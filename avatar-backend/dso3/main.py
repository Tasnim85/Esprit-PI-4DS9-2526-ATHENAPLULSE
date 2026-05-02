"""
DSO3 FastAPI — Compliance Indication Rewriter with Excel Data Source
Production-ready version with Excel-based product data
"""

import os
import io
import logging
from functools import lru_cache
from typing import Optional, Dict, Any
from pathlib import Path

from dotenv import load_dotenv
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from groq import Groq

# ── Configuration ──────────────────────────────────────
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("DSO3_MODEL_PATH", "dso3_model.joblib")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
EXCEL_PATH = os.getenv("EXCEL_DATA_PATH", "produits_final_complet.xlsx")

# ── Load model ─────────────────────────────────────────
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(
        f"Model file '{MODEL_PATH}' not found. Run save_model.py first."
    )

engine = joblib.load(MODEL_PATH)
logger.info(f"DSO3 model loaded from {MODEL_PATH}")

# ── Load Excel Data ────────────────────────────────────
class ExcelDataLoader:
    """Load and cache product data from Excel file"""
    
    def __init__(self, excel_path: str):
        self.excel_path = excel_path
        self.data: Optional[pd.DataFrame] = None
        self.products_dict: Dict[str, Dict[str, Any]] = {}
        self._load_data()
    
    def _load_data(self):
        """Load Excel file and create lookup dictionary"""
        try:
            if not os.path.exists(self.excel_path):
                logger.warning(f"Excel file '{self.excel_path}' not found. Will use LLM fallback.")
                return
            
            # Load Excel file
            self.data = pd.read_excel(self.excel_path)
            logger.info(f"Loaded Excel file with {len(self.data)} products")
            logger.info(f"Excel columns: {self.data.columns.tolist()}")
            
            # Find the correct column names (exact match, case-sensitive)
            col_product = None
            col_indication = None
            col_gamme = None
            col_composition = None
            col_posologie = None
            
            for col in self.data.columns:
                # Exact match for column names (case-sensitive)
                if col == 'produit':
                    col_product = col
                elif col == 'indication':
                    col_indication = col
                elif col == 'gamme':
                    col_gamme = col
                elif col == 'composition':
                    col_composition = col
                elif col == 'posologie':
                    col_posologie = col
            
            if not col_product:
                logger.error(f"Could not find 'produit' column in Excel file. Available columns: {self.data.columns.tolist()}")
                return
            
            logger.info(f"Found columns: product={col_product}, indication={col_indication}, gamme={col_gamme}, composition={col_composition}, posologie={col_posologie}")
            
            # Create lookup dictionary (case-insensitive for search, but preserves original)
            for _, row in self.data.iterrows():
                product_name = str(row.get(col_product, '')).strip()
                if not product_name or product_name == 'nan':
                    continue
                
                # Get values, handling NaN
                indication = str(row.get(col_indication, '')).strip() if col_indication else ''
                if indication == 'nan' or not indication:
                    indication = None
                
                gamme = str(row.get(col_gamme, 'Non spécifié')).strip() if col_gamme else 'Non spécifié'
                if gamme == 'nan':
                    gamme = 'Non spécifié'
                
                composition = str(row.get(col_composition, 'Non spécifiée')).strip() if col_composition else 'Non spécifiée'
                if composition == 'nan':
                    composition = 'Non spécifiée'
                
                posologie = str(row.get(col_posologie, 'Suivre les instructions')).strip() if col_posologie else 'Suivre les instructions'
                if posologie == 'nan':
                    posologie = 'Suivre les instructions'
                
                # Store with lowercase key for case-insensitive search
                self.products_dict[product_name.lower()] = {
                    'produit': product_name,  # Keep original case
                    'indication': indication,
                    'gamme': gamme,
                    'composition': composition,
                    'posologie': posologie,
                }
            
            logger.info(f"Created lookup dictionary with {len(self.products_dict)} products")
            
            # Log first 10 products for debugging
            first_products = list(self.products_dict.keys())[:10]
            logger.info(f"First 10 products: {first_products}")
            
        except Exception as e:
            logger.error(f"Failed to load Excel file: {str(e)}")
            logger.warning("Will use LLM fallback for all products")
    
    def get_product(self, product_name: str) -> Optional[Dict[str, Any]]:
        """Get product data from Excel (case-insensitive search)"""
        if not product_name:
            return None
        
        # Case-insensitive search
        product_key = product_name.lower().strip()
        result = self.products_dict.get(product_key)
        
        if result:
            logger.info(f"Found product '{product_name}' (matched with '{result['produit']}')")
        else:
            logger.warning(f"Product '{product_name}' not found. Available products sample: {list(self.products_dict.keys())[:5]}")
        
        return result
    
    def reload(self):
        """Reload Excel data (useful for development)"""
        logger.info("Reloading Excel data...")
        self.data = None
        self.products_dict = {}
        self._load_data()

# Initialize Excel loader
excel_loader = ExcelDataLoader(EXCEL_PATH)

# ── FastAPI app ────────────────────────────────────────
app = FastAPI(
    title="DSO3 — Compliance Indication Rewriter",
    version="3.0.0",
    description="Product compliance analysis with Excel data source",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schema ─────────────────────────────────────────────
class ProductInput(BaseModel):
    produit: str = Field(..., min_length=1, example="DERMACNÉ", description="Product name (required)")
    indication: Optional[str] = Field(None, description="Product indication (from Excel or auto-generated)")
    gamme: Optional[str] = Field(None, description="Product line (from Excel or default)")
    composition: Optional[str] = Field(None, description="Product composition (from Excel or default)")
    posologie: Optional[str] = Field(None, description="Dosage instructions (from Excel or default)")

# ── Groq Service ───────────────────────────────────────
class IndicationGenerator:
    """Service for generating product indications using Groq API"""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Groq API key is required")
        self.client = Groq(api_key=api_key)
    
    @lru_cache(maxsize=128)
    def generate(self, product_name: str) -> str:
        """Generate indication for a product using Groq API with caching"""
        try:
            prompt = f"""Generate a realistic marketing indication for this product in one simple sentence:
Product: {product_name}

Respond with only the indication, no additional text."""

            response = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100,
            )
            
            indication = response.choices[0].message.content.strip()
            logger.info(f"Generated indication for '{product_name}': {indication}")
            return indication
            
        except Exception as e:
            logger.error(f"Failed to generate indication for '{product_name}': {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to generate indication: {str(e)}"
            )

# ── Product Data Retrieval ─────────────────────────────
class ProductDataRetriever:
    """Retrieve product data from Excel"""
    
    def __init__(self, excel_loader: ExcelDataLoader):
        self.excel_loader = excel_loader
    
    def get_product_data(self, product_name: str) -> Dict[str, Any]:
        """
        Get product data from Excel.
        
        Raises HTTPException if product not found.
        """
        # Try to get from Excel
        excel_data = self.excel_loader.get_product(product_name)
        
        if excel_data:
            logger.info(f"Found product '{product_name}' in Excel")
            return excel_data
        
        # Not found in Excel - raise error with helpful message
        logger.warning(f"Product '{product_name}' not found in Excel")
        raise HTTPException(
            status_code=404,
            detail=f"Product '{product_name}' not found in database. Please check the product name spelling."
        )

# Initialize retriever
product_retriever = ProductDataRetriever(excel_loader)

# ── API KEY Resolution ─────────────────────────────────
def resolve_api_key(header_key: Optional[str]) -> str:
    """Resolve Groq API key from header or environment"""
    key = header_key or GROQ_API_KEY
    if not key:
        raise HTTPException(
            status_code=401,
            detail="Groq API key is missing. Provide via X-Groq-Api-Key header or GROQ_API_KEY env var.",
        )
    return key

# ── Routes ─────────────────────────────────────────────

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "DSO3 Compliance Analyzer",
        "version": "3.0.0",
        "model_loaded": engine is not None,
        "excel_loaded": len(excel_loader.products_dict) > 0,
        "products_count": len(excel_loader.products_dict),
    }

@app.get("/data/reload")
def reload_excel_data():
    """Reload Excel data (useful for development)"""
    try:
        excel_loader.reload()
        return {
            "status": "success",
            "message": "Excel data reloaded",
            "products_count": len(excel_loader.products_dict),
        }
    except Exception as e:
        logger.error(f"Failed to reload Excel data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reload: {str(e)}")

@app.get("/products/list")
def list_products(limit: int = 100):
    """List available products for debugging"""
    products = list(excel_loader.products_dict.keys())[:limit]
    return {
        "total": len(excel_loader.products_dict),
        "products": products
    }

# ── ANALYZE ────────────────────────────────────────────
@app.post("/compliance/analyze")
def analyze_product(
    product: ProductInput,
    x_groq_api_key: Optional[str] = Header(None),
):
    """
    Analyze product compliance.
    
    Only product name (produit) is required.
    Product must exist in Excel file.
    """
    api_key = resolve_api_key(x_groq_api_key)

    try:
        # Retrieve product data from Excel (raises 404 if not found)
        product_data_retrieved = product_retriever.get_product_data(product.produit)
        
        # Override with user-provided values if given
        product_data = {
            "produit": product.produit,
            "gamme": product.gamme or product_data_retrieved.get("gamme", "Non spécifié"),
            "indication": product.indication or product_data_retrieved.get("indication"),
            "composition": product.composition or product_data_retrieved.get("composition", "Non spécifiée"),
            "posologie": product.posologie or product_data_retrieved.get("posologie", "Suivre les instructions"),
        }

        result = engine.generate_compliance(product_data, api_key)
        result.pop("_pptx_bytes", None)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compliance analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ── PPTX ───────────────────────────────────────────────
@app.post("/compliance/pptx")
def generate_pptx(
    product: ProductInput,
    x_groq_api_key: Optional[str] = Header(None),
):
    """
    Generate compliance report as PowerPoint file.
    
    Only product name (produit) is required.
    Product must exist in Excel file.
    """
    api_key = resolve_api_key(x_groq_api_key)

    try:
        # Retrieve product data from Excel (raises 404 if not found)
        product_data_retrieved = product_retriever.get_product_data(product.produit)
        
        # Override with user-provided values if given
        product_data = {
            "produit": product.produit,
            "gamme": product.gamme or product_data_retrieved.get("gamme", "Non spécifié"),
            "indication": product.indication or product_data_retrieved.get("indication"),
            "composition": product.composition or product_data_retrieved.get("composition", "Non spécifiée"),
            "posologie": product.posologie or product_data_retrieved.get("posologie", "Suivre les instructions"),
        }

        result = engine.generate_compliance(product_data, api_key)

        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Unknown error"))

        pptx_bytes = result.get("_pptx_bytes")

        if not pptx_bytes:
            raise HTTPException(status_code=500, detail="PowerPoint generation failed")

        filename = f"{product.produit.replace(' ', '_')}.pptx"

        return StreamingResponse(
            io.BytesIO(pptx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PPTX generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PPTX generation failed: {str(e)}")

# ── PDF / RAPPORT ───────────────────────────────────────
@app.post("/compliance/report")
def generate_report(
    product: ProductInput,
    x_groq_api_key: Optional[str] = Header(None),
):
    """
    Generate compliance report as PDF file.

    Only product name (produit) is required.
    Product must exist in Excel file.
    """
    api_key = resolve_api_key(x_groq_api_key)

    try:
        # Retrieve product data from Excel (raises 404 if not found)
        product_data_retrieved = product_retriever.get_product_data(product.produit)

        # Override with user-provided values if given
        product_data = {
            "produit": product.produit,
            "gamme": product.gamme or product_data_retrieved.get("gamme", "Non spécifié"),
            "indication": product.indication or product_data_retrieved.get("indication"),
            "composition": product.composition or product_data_retrieved.get("composition", "Non spécifiée"),
            "posologie": product.posologie or product_data_retrieved.get("posologie", "Suivre les instructions"),
        }

        result = engine.generate_compliance(product_data, api_key)

        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Unknown error"))

        slides = result.get("presentation_slides", {})
        chatbot = ChatbotService(api_key)
        paragraph = chatbot.transform_slides_to_paragraph(product.produit, slides)
        pdf_bytes = chatbot.generate_pdf_file(product.produit, paragraph)

        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="PDF generation failed")

        filename = f"{product.produit.replace(' ', '_')}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF report generation failed: {str(e)}")

# ── MODEL INFO ─────────────────────────────────────────
@app.get("/model/info")
def model_info():
    """Get model configuration information"""
    return {
        "model": engine._config if hasattr(engine, "_config") else "Unknown",
        "groq_model": GROQ_MODEL,
    }

# ── CHATBOT SERVICE ────────────────────────────────────
class ChatbotService:
    """Transform DSO3 presentation slides into natural, human-readable text"""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Groq API key is required")
        self.client = Groq(api_key=api_key)
    
    def transform_slides_to_paragraph(self, product_name: str, slides: dict) -> str:
        """
        Transform 7 slides into a single, coherent product description paragraph.
        
        Args:
            product_name: Name of the product
            slides: Dict with keys like slide1_title, slide2_introduction, etc.
        
        Returns:
            A natural, flowing paragraph describing the product
        """
        slides_text = f"""
Product Name: {product_name}

Slide 1 (Title): {slides.get('slide1_title', '')}
Slide 2 (Introduction): {slides.get('slide2_introduction', '')}
Slide 3 (Key Benefit): {slides.get('slide3_key_benefit', '')}
Slide 4 (How It Works): {slides.get('slide4_how_it_works', '')}
Slide 5 (Usage): {slides.get('slide5_usage', '')}
Slide 6 (Safety): {slides.get('slide6_safety', '')}
Slide 7 (Closing): {slides.get('slide7_closing', '')}
"""
        
        prompt = f"""You are a professional product copywriter. Transform the following presentation slides into a single, natural, human-readable paragraph that flows smoothly.

Requirements:
- NO slide labels (no "Slide 1", "Slide 2", etc.)
- NO bullet points or numbered lists
- Write as a cohesive product description/explanation
- Sound professional and engaging
- Combine all information naturally
- Keep it concise but complete
- Use proper French if the content is in French

Slides content:
{slides_text}

Return ONLY the paragraph, nothing else."""

        try:
            response = self.client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=500,
            )
            
            paragraph = response.choices[0].message.content.strip()
            logger.info(f"Generated chatbot paragraph for '{product_name}'")
            return paragraph
            
        except Exception as e:
            logger.error(f"Failed to transform slides for '{product_name}': {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to transform slides: {str(e)}"
            )
    
    def generate_text_file(self, product_name: str, paragraph: str) -> bytes:
        """Generate a plain text file"""
        content = f"{product_name}\n{'=' * len(product_name)}\n\n{paragraph}"
        return content.encode('utf-8')
    
    def generate_pdf_file(self, product_name: str, paragraph: str) -> bytes:
        """Generate a PDF file"""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.colors import HexColor
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.units import inch
            import io
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72,
            )
            styles = getSampleStyleSheet()
            
            # Custom style for product name
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=HexColor('#1a1a1a'),
                spaceAfter=12,
                alignment=1,  # Center
                fontName='Helvetica-Bold',
            )
            
            # Custom style for body text
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['BodyText'],
                fontSize=11,
                leading=16,
                alignment=4,  # Justify
                spaceAfter=12,
                fontName='Helvetica',
            )
            
            story = []
            story.append(Paragraph(product_name, title_style))
            story.append(Spacer(1, 0.3 * inch))
            
            # Escape special characters in paragraph for PDF
            safe_paragraph = paragraph.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(safe_paragraph, body_style))
            
            doc.build(story)
            buffer.seek(0)
            pdf_bytes = buffer.getvalue()
            
            if not pdf_bytes or len(pdf_bytes) < 100:
                logger.error("PDF generation produced invalid output")
                raise ValueError("PDF generation produced empty or invalid output")
            
            logger.info(f"Generated PDF for '{product_name}' ({len(pdf_bytes)} bytes)")
            return pdf_bytes
            
        except ImportError:
            logger.warning("reportlab not installed, returning text as fallback")
            return self.generate_text_file(product_name, paragraph)
        except Exception as e:
            logger.error(f"PDF generation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"PDF generation failed: {str(e)}"
            )

# ── CHATBOT ROUTES ────────────────────────────────────

@app.post("/chatbot/product-description")
def chatbot_product_description(
    product: ProductInput,
    x_groq_api_key: Optional[str] = Header(None),
):
    """
    Chatbot endpoint: Get a natural product description.
    
    Only product name (produit) is required.
    Product must exist in Excel file.
    """
    api_key = resolve_api_key(x_groq_api_key)
    chatbot = ChatbotService(api_key)

    try:
        # Retrieve product data from Excel (raises 404 if not found)
        product_data_retrieved = product_retriever.get_product_data(product.produit)
        
        # Override with user-provided values if given
        product_data = {
            "produit": product.produit,
            "gamme": product.gamme or product_data_retrieved.get("gamme", "Non spécifié"),
            "indication": product.indication or product_data_retrieved.get("indication"),
            "composition": product.composition or product_data_retrieved.get("composition", "Non spécifiée"),
            "posologie": product.posologie or product_data_retrieved.get("posologie", "Suivre les instructions"),
        }

        # Run DSO3 pipeline
        result = engine.generate_compliance(product_data, api_key)

        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Unknown error"))

        # Transform slides to paragraph
        slides = result.get("presentation_slides", {})
        paragraph = chatbot.transform_slides_to_paragraph(product.produit, slides)

        return {
            "success": True,
            "product_name": product.produit,
            "description": paragraph,
            "compliant_indication": result.get("compliant_indication", ""),
            "generated_at": result.get("processed_at", ""),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot description failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")

@app.post("/chatbot/product-description/download")
def chatbot_download_description(
    product: ProductInput,
    format: str = "txt",
    x_groq_api_key: Optional[str] = Header(None),
):
    """
    Download the product description as a file (txt or pdf).
    
    Query params:
    - format: "txt" or "pdf" (default: "txt")
    
    Product must exist in Excel file.
    """
    if format not in ["txt", "pdf"]:
        raise HTTPException(status_code=400, detail="Format must be 'txt' or 'pdf'")

    api_key = resolve_api_key(x_groq_api_key)
    chatbot = ChatbotService(api_key)

    try:
        # Retrieve product data from Excel (raises 404 if not found)
        product_data_retrieved = product_retriever.get_product_data(product.produit)
        
        # Override with user-provided values if given
        product_data = {
            "produit": product.produit,
            "gamme": product.gamme or product_data_retrieved.get("gamme", "Non spécifié"),
            "indication": product.indication or product_data_retrieved.get("indication"),
            "composition": product.composition or product_data_retrieved.get("composition", "Non spécifiée"),
            "posologie": product.posologie or product_data_retrieved.get("posologie", "Suivre les instructions"),
        }

        # Run DSO3 pipeline
        result = engine.generate_compliance(product_data, api_key)

        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Unknown error"))

        # Transform slides to paragraph
        slides = result.get("presentation_slides", {})
        paragraph = chatbot.transform_slides_to_paragraph(product.produit, slides)

        # Generate file
        try:
            if format == "pdf":
                file_bytes = chatbot.generate_pdf_file(product.produit, paragraph)
                media_type = "application/pdf"
                extension = "pdf"
            else:
                file_bytes = chatbot.generate_text_file(product.produit, paragraph)
                media_type = "text/plain"
                extension = "txt"
        except Exception as file_error:
            logger.error(f"File generation failed: {str(file_error)}")
            # Fallback to TXT if PDF fails
            if format == "pdf":
                logger.warning("PDF generation failed, falling back to TXT")
                file_bytes = chatbot.generate_text_file(product.produit, paragraph)
                media_type = "text/plain"
                extension = "txt"
            else:
                raise

        filename = f"{product.produit.replace(' ', '_')}_description.{extension}"
        
        # Validate file bytes
        if not file_bytes or len(file_bytes) < 10:
            raise HTTPException(status_code=500, detail="Generated file is empty or invalid")

        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(file_bytes)),
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")