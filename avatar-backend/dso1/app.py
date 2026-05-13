# ============================================================================
# FASTAPI BACKEND FOR PHARMA PRODUCT RECOMMENDATION
# ============================================================================

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional,Tuple, Dict, Any
import joblib
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import time
import os
from sklearn.metrics.pairwise import cosine_similarity
import whisper
import pyaudio
import tempfile
import wave
import time
import asyncio
import io
from speech_service import get_speech_service
from fastapi.middleware.cors import CORSMiddleware
# ============================================================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================================================

class SymptomRequest(BaseModel):
    """Request model for text input"""
    query: str = Field(..., description="Symptom description in French or English", min_length=2, max_length=200)
    top_k: int = Field(default=5, description="Number of products to return", ge=1, le=20)

class ProductResult(BaseModel):
    """Single product result"""
    rank: int
    produit: str
    gamme: str
    form: str
    phase: str
    symptoms: str
    similarity_score: float

class RecommendationResponse(BaseModel):
    """Full response model"""
    query: str
    total_results: int
    results: List[ProductResult]
    processing_time_ms: float

class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
    version: str


# ============================================================================
# TRANSLATE FUNCTION (English to French)
# ============================================================================

def translate_to_french(text: str) -> str:
    """Simple English to French translation for symptoms"""
    translations = {
        'acne': 'acné',
        'dry skin': 'peau sèche',
        'hair loss': 'chute de cheveux',
        'redness': 'rougeurs',
        'wrinkles': 'rides',
        'fatigue': 'fatigue',
        'stress': 'stress',
        'digestion': 'digestion',
        'pain': 'douleur',
        'heavy legs': 'jambes lourdes',
    }
    
    text_lower = text.lower()
    for eng, fr in translations.items():
        if eng in text_lower:
            return fr
    return text


# ============================================================================
# HYBRID RETRIEVAL MODEL CLASS (Must match the one used during training)
# ============================================================================

class HybridRetrievalModel:
    """
    Final Phase 1 model combining TF-IDF and MPNet with adaptive weighting.
    """

    def __init__(self, df, tfidf_vectorizer, tfidf_matrix, mpnet_model, mpnet_embeddings):
        self.df = df
        self.tfidf_vectorizer = tfidf_vectorizer
        self.tfidf_matrix = tfidf_matrix
        self.mpnet_model = mpnet_model
        self.mpnet_embeddings = mpnet_embeddings

        # Natural-language trigger words → MPNet territory
        self.nl_indicators = [
            "j'ai", "j'", "je ", "mon ", "ma ", "mes ",
            "depuis ", "après ", "quand ", "pour mon", "pour ma",
            "quelque chose", "produit pour", "souffre", "aide",
            "fils", "fille", "enfant", "bébé", "mari", "femme",
            "ça fait", "un peu", "beaucoup", "très ", "trop ",
            "comment", "quel ", "quelle ", "est-ce que", "c'est",
            "qui ", "que ", "avec ", "sans ", "sur ",
            "depuis", "suite à", "à cause", "en ce moment",
        ]

        # Spell corrections
        self.spell_fixes = {
            'chutte': 'chute',
            'cheuveux': 'cheveux',
            'boutton': 'bouton',
            'acnee': 'acné',
            'seche': 'sèche',
            'peau sec': 'peau sèche',
        }

        # Synonym expansion
        self.symptom_synonyms = {
            'acné': ['boutons', 'imperfections', 'points noirs'],
            'peau sèche': ['déshydratée', 'tiraille', 'rugueuse'],
            'chute de cheveux': ['perte cheveux', 'alopécie', 'cheveux clairsemés'],
            'rides': ['ridules', 'anti-âge', 'vieillissement'],
            'rougeurs': ['irritations', 'inflammations', 'sensibilité'],
            'fatigue': ['énergie', 'tonus', 'vitalité'],
            'stress': ['anxiété', 'sommeil', 'nervosité'],
            'digestion': ['ballonnements', 'transit', 'reflux'],
            'jambes lourdes': ['circulation', 'varice', 'rétention eau'],
        }

    def retrieve(self, query: str, top_k: int = 50, strategy: str = 'hybrid') -> pd.DataFrame:
        """Main retrieval function."""
        query_fr = translate_to_french(query)
        query_expanded = self._preprocess(query_fr)

        if strategy == 'tfidf':
            return self._tfidf_retrieve(query_expanded, top_k)
        elif strategy == 'mpnet':
            return self._mpnet_retrieve(query_fr, top_k)
        else:
            return self._hybrid_retrieve(query_expanded, query_fr, top_k)

    def _preprocess(self, query: str) -> str:
        query = query.lower().strip()
        for wrong, correct in self.spell_fixes.items():
            query = query.replace(wrong, correct)
        expanded = query
        for symptom, synonyms in self.symptom_synonyms.items():
            if symptom in query:
                expanded += ' ' + ' '.join(synonyms[:2])
        return expanded

    def _is_exact_query(self, query: str) -> bool:
        query_lower = query.lower().strip()
        words = query_lower.split()

        if any(ind in query_lower for ind in self.nl_indicators):
            return False
        if len(words) == 1:
            return True
        if len(words) <= 3:
            verb_signals = ['est', 'sont', 'avoir', 'faire', 'mettre', 'prendre',
                           'utiliser', 'traiter', 'soigner', 'aider', 'besoin',
                           'voudrais', 'veux', 'cherche', 'recommande']
            if not any(v in words for v in verb_signals):
                return True
        return False

    def _tfidf_retrieve(self, query: str, top_k: int) -> pd.DataFrame:
        q_vec = self.tfidf_vectorizer.transform([query])
        scores = cosine_similarity(q_vec, self.tfidf_matrix).flatten()
        top_indices = scores.argsort()[::-1][:top_k]
        results = self.df.iloc[top_indices][
            ['produit', 'symptoms_spacy_lemmatized', 'form', 'phase', 'gamme']
        ].copy()
        results['similarity_score'] = scores[top_indices]
        results['retrieval_source'] = 'tfidf'
        return results.reset_index(drop=True)

    def _mpnet_retrieve(self, query: str, top_k: int) -> pd.DataFrame:
        q_emb = self.mpnet_model.encode([query], normalize_embeddings=True)
        scores = (self.mpnet_embeddings @ q_emb.T).flatten()
        top_indices = scores.argsort()[::-1][:top_k * 2]  # Get extra for dedup
        
        results = self.df.iloc[top_indices][
            ['produit', 'symptoms_spacy_lemmatized', 'form', 'phase', 'gamme']
        ].copy()
        results['similarity_score'] = scores[top_indices]
        
        # Remove duplicates by product name, keep highest score
        results = results.sort_values('similarity_score', ascending=False)
        results = results.drop_duplicates(subset=['produit'], keep='first')
        results = results.head(top_k)
        results['retrieval_source'] = 'mpnet'
        return results.reset_index(drop=True)

    def _hybrid_retrieve(self, query_expanded: str, query_original: str, top_k: int) -> pd.DataFrame:
        tfidf_results = self._tfidf_retrieve(query_expanded, top_k=30)
        mpnet_results = self._mpnet_retrieve(query_original, top_k=30)
        
        # Get actual similarity scores from both methods
        tfidf_scores = {row['produit']: row['similarity_score'] for idx, row in tfidf_results.iterrows()}
        mpnet_scores = {row['produit']: row['similarity_score'] for idx, row in mpnet_results.iterrows()}
        tfidf_ranks = {row['produit']: idx + 1 for idx, row in tfidf_results.iterrows()}
        mpnet_ranks = {row['produit']: idx + 1 for idx, row in mpnet_results.iterrows()}

        is_exact = self._is_exact_query(query_original)
        tfidf_weight = 0.7 if is_exact else 0.3
        mpnet_weight = 0.3 if is_exact else 0.7

        all_products = set(tfidf_ranks.keys()) | set(mpnet_ranks.keys())
        scores = []
        
        for product in all_products:
            # Use actual similarity scores when available, fallback to rank-based
            tfidf_score = tfidf_scores.get(product, 0)
            mpnet_score = mpnet_scores.get(product, 0)
            
            # Weighted average of actual similarity scores
            if tfidf_score > 0 or mpnet_score > 0:
                combined_score = (tfidf_weight * tfidf_score) + (mpnet_weight * mpnet_score)
            else:
                # Fallback to RRF scoring for products only in one method
                tfidf_rank = tfidf_ranks.get(product, 31)
                mpnet_rank = mpnet_ranks.get(product, 31)
                combined_score = (tfidf_weight / (60 + tfidf_rank)) + (mpnet_weight / (60 + mpnet_rank))
            
            scores.append({'produit': product, 'combined_score': combined_score})
        
        scores_df = pd.DataFrame(scores).sort_values('combined_score', ascending=False).head(top_k)
        results = scores_df.merge(
            self.df[['produit', 'symptoms_spacy_lemmatized', 'form', 'phase', 'gamme']],
            on='produit', how='left'
        )
        results['similarity_score'] = results['combined_score']
        results['retrieval_source'] = 'hybrid'
        return results.drop('combined_score', axis=1).reset_index(drop=True)


# ============================================================================
# MODEL LOADER CLASS
# ============================================================================

class PharmaModelLoader:
    """Loads all models and keeps them in memory"""
    
    def __init__(self, model_path: str = "."):
        self.model_path = model_path
        self.models = {}
        
    def load_all(self):
        """Load all models at startup"""
        print("\n" + "="*60)
        print("🚀 LOADING MODELS FOR PHARMA API")
        print("="*60)
        
        start_time = time.time()
        
        # 1. Load TF-IDF components
        print("\n📊 Loading TF-IDF components...")
        self.models['tfidf_vectorizer'] = joblib.load(f'{self.model_path}/models/tfidf_vectorizer.joblib')
        self.models['tfidf_matrix'] = joblib.load(f'{self.model_path}/models/tfidf_matrix.joblib')
        print("   ✅ TF-IDF loaded")
        
        # 2. Load products DataFrame
        print("📦 Loading products data...")
        self.models['df'] = joblib.load(f'{self.model_path}/models/products_df.joblib')
        print(f"   ✅ {len(self.models['df'])} products loaded")
        
        # 3. Load Phase 2 models
        print("🔬 Loading Phase 2 models...")
        self.models['phase2_clf'] = joblib.load(f'{self.model_path}/models/phase2_classifier.joblib')
        self.models['le_phase'] = joblib.load(f'{self.model_path}/models/phase2_label_encoder.joblib')
        print("   ✅ Phase 2 loaded")
        
        # 4. Load Phase 3 model
        print("📈 Loading Phase 3 model...")
        self.models['phase3_ranker'] = joblib.load(f'{self.model_path}/models/phase3_ranker.joblib')
        print("   ✅ Phase 3 loaded")
        
        # 5. Load MPNet model
        print("🎤 Loading MPNet model...")
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.models['mpnet_model'] = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2', device=device)
        self.models['mpnet_embeddings'] = np.load(f'{self.model_path}/models/mpnet_embeddings.npy')
        print(f"   ✅ MPNet loaded on {device}")
        
        # 6. Load hybrid model with the class
        try:
            self.models['hybrid_model'] = HybridRetrievalModel(
                df=self.models['df'],
                tfidf_vectorizer=self.models['tfidf_vectorizer'],
                tfidf_matrix=self.models['tfidf_matrix'],
                mpnet_model=self.models['mpnet_model'],
                mpnet_embeddings=self.models['mpnet_embeddings']
            )
            print("   ✅ Hybrid model loaded")
        except Exception as e:
            print(f"   ⚠️ Hybrid model initialization failed: {e}")
            print("   Using MPNet directly")
        
        elapsed = time.time() - start_time
        print(f"\n✅ ALL MODELS LOADED IN {elapsed:.2f} SECONDS")
        print("="*60 + "\n")
        
        return self.models
    
    def get(self, key):
        return self.models.get(key)


# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Pharma Product Recommendation API",
    description="Voice & Text-based product recommendation for healthcare professionals",
    version="1.0.0"
)
# Configure CORS - Add this block
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Global model holder
models = None

@app.on_event("startup")
async def startup_event():
    """Load models when API starts"""
    global models
    loader = PharmaModelLoader(model_path=".")
    models = loader.load_all()


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        models_loaded=list(models.get('models', {}).keys()) if models else [],
        version="1.0.0"
    )


@app.get("/health")
async def health_check():
    """Simple health check"""
    return {"status": "ok", "products_loaded": len(models.get('df')) if models else 0}


@app.post("/recommend", response_model=RecommendationResponse)
async def recommend(request: SymptomRequest):
    """
    Get product recommendations based on symptom text input.
    Works with French or English symptoms.
    """
    start_time = time.time()
    
    if not models:
        raise HTTPException(status_code=503, detail="Models not loaded yet")
    
    query = request.query.strip().lower()
    top_k = request.top_k
    
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query too short. Please provide a valid symptom.")
    
    # Get hybrid model or fallback to MPNet
    hybrid_model = models.get('hybrid_model')
    df = models.get('df')
    
    if hybrid_model:
        # Use hybrid model
        results = hybrid_model.retrieve(query, top_k=top_k * 2, strategy='hybrid')
    else:
        # Fallback to MPNet
        mpnet_model = models.get('mpnet_model')
        mpnet_embeddings = models.get('mpnet_embeddings')
        q_emb = mpnet_model.encode([query], normalize_embeddings=True)
        scores = (mpnet_embeddings @ q_emb.T).flatten()
        top_indices = scores.argsort()[::-1][:top_k * 2]
        results = df.iloc[top_indices][['produit', 'gamme', 'symptoms_spacy_lemmatized', 'form', 'phase']].copy()
        results['similarity_score'] = scores[top_indices]
    
    # Filter to VITAL brand only
    #results = results[results['gamme'].str.upper() == 'VITAL']
    results = results.head(top_k)
    results['rank'] = range(1, len(results) + 1)
    
    # Build response
    products = []
    for _, row in results.iterrows():
        products.append(ProductResult(
            rank=int(row['rank']),
            produit=str(row['produit']),
            gamme=str(row.get('gamme', 'Unknown')),
            form=str(row.get('form', 'Unknown')),
            phase=str(row.get('phase', 'Unknown')),
            symptoms=str(row.get('symptoms_spacy_lemmatized', '')),
            similarity_score=float(row['similarity_score'])
        ))
    
    processing_time = (time.time() - start_time) * 1000
    
    return RecommendationResponse(
        query=query,
        total_results=len(products),
        results=products,
        processing_time_ms=round(processing_time, 2)
    )


# ============================================================================
# VOICE ENDPOINTS (Clean - just call the speech service)
# ============================================================================

@app.post("/recommend/voice")
async def recommend_voice(
    audio: UploadFile = File(..., description="Audio file (WAV format, 16kHz mono)")
):
    """Get product recommendations from voice input"""
    start_time = time.time()
    
    if not models:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    if not audio.filename.endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only WAV files are accepted")
    
    try:
        audio_bytes = await audio.read()
        if len(audio_bytes) < 1000:
            raise HTTPException(status_code=400, detail="Audio file too small")
        
        # Transcribe using speech service
        speech_service = get_speech_service()
        transcription = speech_service.transcribe_audio_file(audio_bytes)
        
        if not transcription['success']:
            raise HTTPException(status_code=400, detail=f"Transcription failed: {transcription['error']}")
        
        query = transcription['text']
        if not query or len(query) < 2:
            raise HTTPException(status_code=400, detail="No speech detected")
        
        # Get recommendations
        hybrid_model = models.get('hybrid_model')
        results = hybrid_model.retrieve(query, top_k=10, strategy='hybrid')
        results = results.head(5)
        results['rank'] = range(1, len(results) + 1)
        
        products = []
        for _, row in results.iterrows():
            products.append({
                'rank': int(row['rank']),
                'produit': str(row['produit']),
                'gamme': str(row.get('gamme', 'Unknown')),
                'form': str(row.get('form', 'Unknown')),
                'phase': str(row.get('phase', 'Unknown')),
                'symptoms': str(row.get('symptoms_spacy_lemmatized', '')),
                'similarity_score': float(row['similarity_score'])
            })
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            'success': True,
            'transcribed_text': query,
            'detected_language': transcription['language'],
            'confidence': transcription['confidence'],
            'total_results': len(products),
            'results': products,
            'processing_time_ms': round(processing_time, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/voice/transcribe")
async def transcribe_only(
    audio: UploadFile = File(..., description="Audio file (WAV format)")
):
    """Simple endpoint - just transcribe, no recommendations"""
    if not audio.filename.endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only WAV files are accepted")
    
    try:
        audio_bytes = await audio.read()
        speech_service = get_speech_service()
        result = speech_service.transcribe_audio_file(audio_bytes)
        
        return {
            'success': result['success'],
            'text': result['text'],
            'language': result['language'],
            'confidence': result['confidence'],
            'error': result['error']
        }
        
    except Exception as e:
        return {
            'success': False,
            'text': '',
            'language': None,
            'confidence': 0.0,
            'error': str(e)
        }


@app.get("/voice/health")
async def voice_health():
    """Check voice service health"""
    try:
        import pyaudio
        pa = pyaudio.PyAudio()
        device_count = pa.get_device_count()
        pa.terminate()
        
        return {
            'status': 'available',
            'audio_devices': device_count,
            'whisper_ready': True
        }
    except Exception as e:
        return {'status': 'unavailable', 'error': str(e)}

@app.get("/products/{product_name}")
async def get_product_details(product_name: str):
    """Get detailed information about a specific product"""
    if not models:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    df = models.get('df')
    
    # Decode URL-encoded string
    import urllib.parse
    decoded_name = urllib.parse.unquote(product_name)
    
    # Try exact match (case-insensitive)
    product = df[df['produit'].str.lower() == decoded_name.lower()]
    
    # Try partial match (contains the search term)
    if len(product) == 0:
        product = df[df['produit'].str.contains(decoded_name, case=False, na=False)]
    
    # Try word-by-word matching
    if len(product) == 0:
        words = decoded_name.split()
        for word in words:
            if len(word) > 3:
                matches = df[df['produit'].str.contains(word, case=False, na=False)]
                if len(matches) > 0:
                    product = matches
                    break
    
    # If still no match, return all products with similar names (limit 5)
    if len(product) == 0:
        # Return a list of similar products (for debugging)
        similar = df[df['produit'].str.contains(decoded_name[:10], case=False, na=False)]
        if len(similar) > 0:
            return {
                "error": "Product not found",
                "suggestions": similar['produit'].head(5).tolist()
            }
        raise HTTPException(status_code=404, detail=f"Product not found: {decoded_name}")
    
    return product.iloc[0].to_dict()


# ============================================================================
# RUN THE API
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)