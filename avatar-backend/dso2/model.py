"""
DSO2 API Backend — Complete 5-Model Pipeline with Session Management
=====================================================================
Models:
    M0: Whisper STT (voice path)
    M1: Intent & Communication Analysis (Groq LLM + RAG)
    M2: Dialogue State Tracking
    M3: AI Doctor Response Generator (Groq LLM)
    M4: Performance Scoring (Sentence-Transformers)
    M5: Adaptive Learning Recommendation

Session support:
    - Per-session DialogueStateTracker + PerformanceScorer (in-memory)
    - JSON persistence for completed sessions (delegate + admin dashboards)
    - Difficulty levels: beginner / intermediate / professional
"""

import io
import json
import os
import re
import time
import uuid
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import requests
import soundfile as sf
from sentence_transformers import SentenceTransformer
from transformers import pipeline

warnings.filterwarnings("ignore", category=UserWarning)


# =============================================================================
# SESSION STORE (JSON persistence)
# =============================================================================

class SessionStore:
    """Persist completed training sessions to JSON files on disk."""

    def __init__(self, base_dir: str = "sessions"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, session_id: str, delegate_id: str, persona: str, difficulty: str,
             turns: list, report: dict) -> Path:
        path = self.base_dir / f"{session_id}.json"
        record = {
            "session_id": session_id,
            "delegate_id": delegate_id,
            "persona": persona,
            "difficulty": difficulty,
            "created_at": datetime.now().isoformat(),
            "turns": turns,
            "report": report,
        }
        path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
        return path

    def load(self, session_id: str) -> Optional[dict]:
        path = self.base_dir / f"{session_id}.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def load_report(self, session_id: str) -> Optional[dict]:
        data = self.load(session_id)
        return data.get("report") if data else None

    def list_all(self, delegate_id: Optional[str] = None) -> List[dict]:
        sessions = []
        for path in sorted(self.base_dir.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if delegate_id is None or data.get("delegate_id") == delegate_id:
                    sessions.append({
                        "session_id": data["session_id"],
                        "delegate_id": data["delegate_id"],
                        "persona": data.get("persona"),
                        "difficulty": data.get("difficulty"),
                        "created_at": data["created_at"],
                        "overall_score": data.get("report", {}).get("score_global"),
                        "status": data.get("report", {}).get("score_message", "")[:30],
                    })
            except Exception:
                continue
        return sessions


# =============================================================================
# M0: AUDIO + WHISPER STT
# =============================================================================

class RobustWhisperSTT:
    """Whisper STT wrapper. Loads once, reused across sessions."""

    MEDICAL_PROMPT = (
        "Transcription medicale pharmaceutique. "
        "Conserver les termes techniques, noms de produits, posologies et references cliniques."
    )

    def __init__(self, model_size: str = "small"):
        import whisper, torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model(model_size, device=self.device)

    def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """Transcribe raw audio bytes (webm, wav, mp3, m4a)."""
        try:
            data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
        except Exception:
            try:
                from pydub import AudioSegment
                seg = AudioSegment.from_file(io.BytesIO(audio_bytes), format=Path(filename).suffix.lstrip(".") or None)
                wav_io = io.BytesIO()
                seg.export(wav_io, format="wav")
                wav_io.seek(0)
                data, sr = sf.read(wav_io, dtype="float32")
            except Exception:
                return ""

        if data.ndim > 1:
            data = data.mean(axis=1)
        if sr != 16000:
            data = np.interp(np.linspace(0, len(data) - 1, int(len(data) * 16000 / sr)), np.arange(len(data)), data)

        result = self.model.transcribe(
            data.astype(np.float32),
            task="transcribe",
            language=None,
            fp16=False,
            initial_prompt=self.MEDICAL_PROMPT,
            temperature=0.0,
            condition_on_previous_text=False,
        )
        lang = (result.get("language") or "").lower()
        text = (result.get("text") or "").strip()
        if lang not in {"fr", "en"} or len(text) < 2:
            return ""
        return text


# =============================================================================
# M1: INTENT & COMMUNICATION ANALYSIS (LLM + RAG)
# =============================================================================

class Model1_IntentAnalyzer:
    """Enhanced intent classification using Groq LLM + keyword post-processing."""

    def __init__(self, api_key: str, product_info: dict):
        self.api_key = api_key
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.product_info = product_info

        # Keyword sets for post-processing
        self.closing_direct = ["voulez-vous", "souhaitez-vous", "puis-je", "shall we", "would you like",
                               "can i leave", "do you want", "can we add", "essayer", "prescrire",
                               "prescription", "echantillons", "samples", "want to try", "leave you with",
                               "start with", "begin with", "voulez", "souhaitez", "puis"]
        self.closing_indirect = ["don't you think", "n'est-ce pas", "ne pensez-vous pas",
                                 "ready to try", "pret a essayer", "shall we start", "ready to start",
                                 "commencons", "shall we proceed"]
        self.objection_direct = ["trop cher", "too expensive", "cheaper", "generic", "generique",
                                 "effets secondaires", "side effects", "pas sur", "not sure", "doute",
                                 "doubt", "tolerance", "securite", "safety", "risk", "risque",
                                 "dangerous", "dangereux", "contraindicated", "hesitant", "prefere",
                                 "prefer", "concerned", "inquietude", "worried", "allergies",
                                 "allergic", "allergique"]
        self.objection_starters = ["why is", "why are", "why does", "why do", "why would",
                                   "why should", "how come", "how is it", "pourquoi", "comment se fait",
                                   "pourquoi est"]
        self.objection_comparative = ["worse than", "better than", "compared to", "versus", "vs",
                                      "more than", "less than", "autre produit", "other product",
                                      "current treatment", "traitement actuel", "deja utilise", "already use"]
        self.evidence_keywords = ["etude", "study", "clinical", "clinique", "lancet", "jama", "nejm",
                                  "pubmed", "phase", "trial", "research", "publication", "donnees",
                                  "results", "prouve", "demontre", "show", "versus", "meta-analysis",
                                  "cohort", "randomized", "significant", "efficacy", "efficacite",
                                  "superior", "non-inferior"]
        self.other_ambiguous = ["ok", "okay", "d'accord", "bien", "hm", "hmm", "uh", "ah", "oh",
                                "euh", "ben", "alors", "bon", "maybe", "peut-etre", "perhaps",
                                "i see", "je vois", "interesting", "interessant", "not now",
                                "pas maintenant", "later", "plus tard"]

    def retrieve_products(self, text: str) -> list:
        t = text.lower()
        return [{"name": p, **info} for p, info in self.product_info.items() if p.lower() in t]

    def build_prompt(self, text: str, context: list) -> str:
        return f"""You are an expert medical sales conversation analyzer.
Classify delegate message intent precisely.

Message: "{text}"
Product data: {json.dumps(context, indent=2, ensure_ascii=False)}

INTENTS: introduction, benefit, evidence, objection, question, closing, other

CRITICAL:
- "Are you sure...?" / "Can you guarantee...?" → question (neutral verification)
- "Why is this more expensive...?" / "How come results are worse...?" → objection (resistance + comparison)
- "When can we start?" / "Where do I sign?" → closing
- "Don't you think this would help?" → closing
- "Hmm", "OK", "Maybe" → other
- Messages with "why" + comparison → objection, NOT question
- If message asks for ANY action/decision from doctor → closing

Return ONLY JSON: {{"intent": "...", "product": "... or null", "claims": [], "language": "fr or en"}}"""

    def call_llm(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a precise intent classifier. Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.0,
            "max_tokens": 200,
        }
        for attempt in range(max_retries):
            try:
                resp = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
                elif resp.status_code == 429:
                    time.sleep((2 ** attempt) * 2)
            except Exception:
                time.sleep(2 ** attempt)
        return None

    def safe_parse(self, text: str) -> dict:
        if not text:
            return self._default()
        text = text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
        for pat in [r"\{[^{}]*\}", r"\{.*\}"]:
            try:
                m = re.search(pat, text, re.DOTALL)
                if m:
                    return json.loads(m.group())
            except Exception:
                pass
        return self._default()

    def _default(self) -> dict:
        return {"intent": "other", "product": None, "claims": [], "language": "en"}

    def post_process(self, text: str, llm_intent: str) -> str:
        t = text.lower()
        words = t.strip().split()

        if len(words) < 4:
            if any(t.startswith(p) for p in self.other_ambiguous) or len(words) <= 2:
                return "other"

        if (any(k in t for k in self.closing_direct) or any(k in t for k in self.closing_indirect)):
            if llm_intent in ["question", "benefit", "other"]:
                return "closing"

        if (any(k in t for k in self.objection_direct) or
            (any(k in t for k in self.objection_starters) and any(c in t for c in self.objection_comparative))):
            if llm_intent in ["question", "introduction", "benefit"]:
                return "objection"

        if any(k in t for k in self.evidence_keywords) and llm_intent in ["benefit", "introduction"]:
            return "evidence"

        return llm_intent

    def analyze(self, text: str) -> dict:
        context = self.retrieve_products(text)
        prompt = self.build_prompt(text, context)
        raw = self.call_llm(prompt)
        parsed = self.safe_parse(raw)
        llm_intent = parsed.get("intent", "other")
        parsed["intent"] = self.post_process(text, llm_intent)
        parsed["llm_raw_intent"] = llm_intent
        parsed["text"] = text
        if not parsed.get("language"):
            try:
                from langdetect import detect
                parsed["language"] = "fr" if detect(text) == "fr" else "en"
            except Exception:
                parsed["language"] = "en"
        return parsed


# =============================================================================
# M2: DIALOGUE STATE TRACKING
# =============================================================================

class DialogueStateTracker:
    """Tracks conversation state across turns."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.state = {
            "product": None,
            "claims_made": [],
            "evidence_shown": [],
            "objections": [],
            "questions_asked": [],
            "stage": "start",
            "turn_count": 0,
            "last_intent": None,
            "language": "en",
        }
        return self.state

    def update(self, m1_output: dict) -> dict:
        intent = m1_output.get("intent", "other")
        text = m1_output.get("text", "")
        product = m1_output.get("product")
        claims = m1_output.get("claims", [])
        language = m1_output.get("language", "en")

        self.state["turn_count"] += 1
        if product:
            self.state["product"] = product
        self.state["language"] = language
        self.state["last_intent"] = intent

        for claim in claims:
            if claim not in self.state["claims_made"]:
                self.state["claims_made"].append(claim)

        if intent == "evidence":
            snippet = text[:100]
            if snippet not in self.state["evidence_shown"]:
                self.state["evidence_shown"].append(snippet)
        elif intent == "objection":
            snippet = text[:100]
            if snippet not in self.state["objections"]:
                self.state["objections"].append(snippet)
        elif intent == "question":
            snippet = text[:100]
            if snippet not in self.state["questions_asked"]:
                self.state["questions_asked"].append(snippet)

        stage_map = {
            "introduction": "product_introduction",
            "benefit": "benefit_discussion",
            "evidence": "evidence_presentation",
            "objection": "objection_handling",
            "closing": "closing",
        }
        if intent in stage_map:
            self.state["stage"] = stage_map[intent]
        return self.state

    def get_state(self) -> dict:
        return self.state


# =============================================================================
# M3: AI DOCTOR RESPONSE GENERATOR
# =============================================================================

class AIDoctorGenerator:
    """Generates doctor responses. Difficulty modifies doctor behavior."""

    PERSONAS = {
        "dermatologist_aesthetic": {
            "name": "Dr. Leila",
            "specialty": "Dermatologue Esthetique",
            "personality": "Exigeante sur les actifs et concentrations. Veut voir les etudes d'efficacite in vivo."
        },
        "dermatologist_medical": {
            "name": "Dr. Karim",
            "specialty": "Dermatologue Medical",
            "personality": "Prudent avec les peaux sensibles et atopiques. Focus sur la tolerance et les allergenes."
        },
        "aesthetic_doctor": {
            "name": "Dr. Sophie",
            "specialty": "Medecin Esthetique",
            "personality": "Orientee resultats rapides. Interessee par les protocoles combines (creme + acte)."
        },
        "pharmacist_skincare": {
            "name": "Mme. Nadia",
            "specialty": "Pharmacienne Conseil",
            "personality": "Connait bien la concurrence (CeraVe, La Roche-Posay). Compare les prix et les compositions."
        },
        "pharmacist_supplements": {
            "name": "M. Ahmed",
            "specialty": "Pharmacien Nutrition",
            "personality": "Mefiant des allegations sante non validees. Verifie les certifications (ANSM, EFSA)."
        },
        "parapharmacist": {
            "name": "Mme. Yasmina",
            "specialty": "Conseillere Parapharmacie",
            "personality": "Proche des clients, connait les tendances (clean beauty, vegan). Oriente vers le 'best-seller'."
        },
        "general_practitioner": {
            "name": "Dr. Mohamed",
            "specialty": "Medecin Generaliste",
            "personality": "Pragmatique. Prescrit peu de cosmetiques mais recommande les complements pour carences."
        },
        "nutritionist": {
            "name": "Dr. Ines",
            "specialty": "Nutritionniste",
            "personality": "Analyse la biodisponibilite et les interactions alimentaires. Mefiante des 'superfoods'."
        },
        "naturopath": {
            "name": "Mme. Fatima",
            "specialty": "Naturopathe",
            "personality": "Favorable aux actifs naturels et plantes. Critique des conservateurs chimiques."
        },
        "endocrinologist": {
            "name": "Dr. Samira",
            "specialty": "Endocrinologue",
            "personality": "Interessee par les complements metaboliques (vitamine D, omega-3). Surveille les interactions."
        },
        "gastroenterologist": {
            "name": "Dr. Youssef",
            "specialty": "Gastro-enterologue",
            "personality": "Recommande les probiotiques cibles. Exige les souches documentees (CFU, souche specifique)."
        },
        "sports_doctor": {
            "name": "Dr. Djamel",
            "specialty": "Medecine du Sport",
            "personality": "Interesse par la recuperation musculaire et l'hydratation. Ouvert aux complements proteines."
        },
        "esthetician": {
            "name": "Mme. Aicha",
            "specialty": "Estheticienne",
            "personality": "Manuelle, connait les textures et les routines. Recommande ce qui 'fonctionne sur le client'."
        },
        "makeup_artist": {
            "name": "M. Karim",
            "specialty": "Maquilleur Pro",
            "personality": "Focus sur la tenue et la compatibilite maquillage. Veut des bases hydratantes non grasses."
        },
        "spa_director": {
            "name": "Mme. Lamia",
            "specialty": "Directrice de Spa",
            "personality": "Cherche l'experience client et les marges. Interessee par les protocoles 'rituels'."
        },
        "influencer": {
            "name": "Lina",
            "specialty": "Influenceuse Beaute",
            "personality": "Exigeante sur l'INCI, les avis clients, et l'emballage Instagrammable. Critique des greenwashing."
        },
        "patient_advocate": {
            "name": "Mme. Amel",
            "specialty": "Association de Patients (Acne)",
            "personality": "Defend les prix accessibles et les formules non comedogenes. Partage les retours de sa communaute."
        }
    }

    DIFFICULTY_PROMPTS = {
        "beginner": "Be patient and receptive. Ask simple, friendly questions that help the delegate practice basic pitch structure. Give them openings to respond.",
        "intermediate": "Be neutral but inquisitive. Raise 1-2 standard objections per turn (price, generic alternatives). Expect the delegate to handle them.",
        "professional": "Be skeptical and demanding. Challenge unsupported claims aggressively. Ask for specific data: p-values, sample sizes, bioavailability numbers. Do not go easy.",
    }

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    def generate(self, delegate_text: str, state: dict, persona: str, difficulty: str) -> str:
        p = self.PERSONAS.get(persona, self.PERSONAS["general_practitioner"])
        lang = state.get("language", "en")
        product = state.get("product", "ce produit")
        stage = state.get("stage", "start")
        diff_prompt = self.DIFFICULTY_PROMPTS.get(difficulty, self.DIFFICULTY_PROMPTS["intermediate"])

        if lang == "fr":
            prompt = (
                f"Tu es {p['name']}, {p['specialty']}.\n"
                f"{p['personality']}\n\n"
                f"Instruction de difficulte: {diff_prompt}\n\n"
                f"Delegue: '{delegate_text}'\n"
                f"Produit: {product}\n"
                f"Etape: {stage}\n\n"
                f"Reponds en francais, 1-2 phrases maximum, de maniere naturelle."
            )
        else:
            prompt = (
                f"You are {p['name']}, a {p['specialty']}.\n"
                f"{p['personality']}\n\n"
                f"Difficulty instruction: {diff_prompt}\n\n"
                f"Delegate: '{delegate_text}'\n"
                f"Product: {product}\n"
                f"Stage: {stage}\n\n"
                f"Respond in 1-2 sentences, naturally."
            )

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a medical professional in a pharmaceutical sales conversation."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 150,
        }
        try:
            resp = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"][:200]
            elif resp.status_code == 429:
                time.sleep(2)
                resp = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"][:200]
        except Exception:
            pass
        return "[Erreur de generation]"


# =============================================================================
# M4: PERFORMANCE SCORING (Semantic Similarity)
# =============================================================================

class PerformanceScorer:
    """Scores delegate performance using all-MiniLM-L6-v2 semantic similarity."""

    REFERENCE_TEXTS = {
        "product_knowledge": {
            "good": [
                "This product contains lactic acid at 5% concentration indicated for mild acne and hyperpigmentation. The posology is once daily in the evening.",
                "Vital Calmoss is a dietary supplement with magnesium and vitamin B6 indicated for stress and sleep disorders. One capsule per day after dinner.",
            ],
            "poor": [
                "This product is good for your skin.",
                "It helps with stress I think.",
            ],
        },
        "scientific_accuracy": {
            "good": [
                "A randomized double-blind study of 240 patients published in the Journal of Dermatology showed a 42% reduction in inflammatory lesions after 8 weeks with p < 0.01.",
                "The meta-analysis by Smith et al. in 2023 demonstrated non-inferiority compared to topical retinoids with better tolerability profile.",
            ],
            "poor": [
                "Studies show it works really well.",
                "Everyone says this product is amazing.",
            ],
        },
        "objection_handling": {
            "good": [
                "I understand your concern about cost. However, the real-world evidence from our post-marketing study shows 85% patient adherence due to the simplified posology, which reduces overall healthcare costs.",
                "That is a valid point. Let me share the safety data from our Phase III trial of 1,200 patients where adverse events were below 3%, comparable to placebo.",
            ],
            "poor": [
                "No, you are wrong, this product is not expensive.",
                "I don't know what to say about side effects.",
            ],
        },
        "benefit_statement": {
            "good": [
                "This serum reduces sebum production by 35% within 4 weeks, leading to fewer breakouts and improved skin texture for your patients.",
                "Patients report falling asleep 30 minutes faster and experiencing 40% fewer nocturnal awakenings after 2 weeks of treatment.",
            ],
            "poor": [
                "This product is very good.",
                "It has many benefits for patients.",
            ],
        },
        "question_techniques": {
            "good": [
                "What challenges do you currently face when managing patients with resistant acne in your practice?",
                "How do you currently approach stress management for patients with concurrent anxiety and sleep disorders?",
            ],
            "poor": [
                "Do you like this product?",
                "Is everything okay?",
            ],
        },
        "closing_techniques": {
            "good": [
                "Would you be willing to trial this product with 5 patients and evaluate the results at your next follow-up?",
                "Shall I leave you samples for your next 10 eligible patients, and we can schedule a follow-up in 3 weeks?",
            ],
            "poor": [
                "So, do you want it or not?",
                "Please buy this product.",
            ],
        },
        "communication_clarity": {
            "good": [
                "There are three key points. First, the mechanism targets IL-1 directly. Second, onset is visible at 48 hours. Third, the safety profile is clean with no phototoxicity.",
                "Let me outline the protocol. Step one: apply once daily. Step two: monitor at week 2 and week 4. Step three: adjust based on patient response.",
            ],
            "poor": [
                "Uhm... well... I think... the product is like... you know... good...",
                "It does stuff for the skin and things like that.",
            ],
        },
        "engagement_techniques": {
            "good": [
                "What has been your experience with topical retinoids in patients with sensitive skin? Have you observed similar tolerability issues?",
                "Based on your patient population, how do you think a once-daily regimen would impact adherence compared to twice-daily alternatives?",
            ],
            "poor": [
                "Let me tell you everything about this product without stopping.",
                "I will now list 20 features of this serum.",
            ],
        },
        "confidence_building": {
            "good": [
                "I am confident this product will integrate seamlessly into your current acne protocol. The data is robust, and I am here to support you through the first month.",
                "This is the standard of care in our top-performing territories. I recommend initiating with your next 5 patients and reviewing outcomes together.",
            ],
            "poor": [
                "Maybe this could possibly work for some of your patients... if you want to try it...",
                "I am not sure, but perhaps you might consider this product... maybe...",
            ],
        },
    }

    REQUIRED_DIMENSIONS = [
        "product_knowledge",
        "benefit_statement",
        "scientific_accuracy",
        "objection_handling",
        "closing_techniques"
    ]

    STAGE_DIMENSIONS = {
        "introduction": {
            "communication_clarity": 0.6,
            "confidence_building": 0.4,
        },
        "product_pitch": {
            "product_knowledge": 0.4,
            "benefit_statement": 0.4,
            "communication_clarity": 0.2,
        },
        "scientific_discussion": {
            "scientific_accuracy": 0.6,
            "product_knowledge": 0.2,
            "confidence_building": 0.2,
        },
        "objection_handling": {
            "objection_handling": 0.7,
            "scientific_accuracy": 0.2,
            "confidence_building": 0.1,
        },
        "closing": {
            "closing_techniques": 0.7,
            "engagement_techniques": 0.3,
        },
        "general": {
            "communication_clarity": 1.0,
        }
    }

    DIMENSION_LABELS = {
        "product_knowledge": "Maîtrise Produit",
        "scientific_accuracy": "Précision Scientifique",
        "objection_handling": "Gestion Objections",
        "benefit_statement": "Argumentation Bénéfices",
        "question_techniques": "Techniques Questionnement",
        "closing_techniques": "Techniques Closing",
        "communication_clarity": "Clarté Communication",
        "engagement_techniques": "Techniques Engagement",
        "confidence_building": "Confiance en Soi",
    }

    STRENGTH_DESCRIPTIONS = {
        "product_knowledge": "Connaissance précise de la composition, indications et posologie.",
        "scientific_accuracy": "Citation d'études rigoureuses avec données chiffrées et sources.",
        "objection_handling": "Réponses structurées aux objections utilisant des preuves concrètes.",
        "benefit_statement": "Arguments bénéfices clairs, spécifiques et orientés résultats patient.",
        "question_techniques": "Questions ouvertes et pertinentes pour découvrir les besoins réels.",
        "closing_techniques": "Demandes d'engagement professionnelles avec propositions concrètes.",
        "communication_clarity": "Message structuré, concis et sans ambiguïté ni remplissage.",
        "engagement_techniques": "Capacité à maintenir l'attention et l'intérêt du médecin.",
        "confidence_building": "Présence affirmée, langage décisif et crédibilité perçue.",
    }

    WEAKNESS_DESCRIPTIONS = {
        "product_knowledge": "Approfondir la connaissance produit (composition, indication, posologie).",
        "scientific_accuracy": "Citer des études précises avec méthodologie, n et p-values.",
        "objection_handling": "Utiliser le cadre APRC (Acknowledge-Pause-Respond-Confirm).",
        "benefit_statement": "Structurer selon Feature → Advantage → Benefit → Proof.",
        "question_techniques": "Poser plus de questions ouvertes adaptées à la spécialité ciblée.",
        "closing_techniques": "Proposer des essais patients ou des rendez-vous de suivi concrets.",
        "communication_clarity": "Éliminer les mots de remplissage et structurer en points numérotés.",
        "engagement_techniques": "Poser des questions sur l'expérience clinique du médecin.",
        "confidence_building": "Remplacer les hésitations par des affirmations basées sur les données.",
    }

    def __init__(self, product_catalog: dict = None):
        self.product_catalog = product_catalog or {}
        self.session_scores = []

        import logging
        logger = logging.getLogger(__name__)
        logger.info("[M4] Loading sentence-transformer: all-MiniLM-L6-v2...")
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")

        self.reference_embeddings = {}
        for dimension, refs in self.REFERENCE_TEXTS.items():
            self.reference_embeddings[dimension] = {
                "good": self.encoder.encode(refs["good"], convert_to_numpy=True),
                "poor": self.encoder.encode(refs["poor"], convert_to_numpy=True),
            }

    def score_turn(self, delegate_text: str, model1_output: dict, dialogue_state: dict) -> dict:

        intent = model1_output.get("intent", "other")
        text_lower = delegate_text.lower()
    
        # Force objection for messages with "je comprends votre préoccupation"
        if "je comprends votre préoccupation" in text_lower or "concernant le coût" in text_lower:
            intent = "objection"
    
        # Force objection for messages with "cependant" after a concern
        if "préoccupation" in text_lower and "cependant" in text_lower:
            intent = "objection"
    
        # Force evidence for study-related messages
        if "randomisée" in text_lower or "double aveugle" in text_lower or "p <" in text_lower:
            intent = "evidence"
    
        # Force benefit for benefit messages
        if "réduit" in text_lower and "patients" in text_lower and "evidence" not in intent:
            if "étude" not in text_lower:
                intent = "benefit"

        stage = self.detect_stage(delegate_text, intent, dialogue_state)

        stage_dimensions = self.STAGE_DIMENSIONS.get(stage, self.STAGE_DIMENSIONS["general"])

        delegate_embedding = self.encoder.encode(delegate_text, convert_to_numpy=True)

        all_scores = {}

        for dimension, refs in self.reference_embeddings.items():
            good_sims = self._cosine_sim(delegate_embedding, refs["good"])
            poor_sims = self._cosine_sim(delegate_embedding, refs["poor"])
            avg_good = float(np.mean(good_sims))
            avg_poor = float(np.mean(poor_sims))
            raw_score = (avg_good - avg_poor + 1) / 2
            all_scores[dimension] = max(0, min(100, raw_score * 100))

        all_scores = self._apply_intent_weighting(all_scores, intent, delegate_text, dialogue_state)

        weighted_scores = {}
        for dim, score in all_scores.items():
            weight = stage_dimensions.get(dim, 0.1)
            weighted_scores[dim] = {
                "score": round(score, 1),
                "weight": weight,
                "present": score > 5
            }

        weighted_sum = 0
        total_weight = 0
        for dim, data in weighted_scores.items():
            weighted_sum += data["score"] * data["weight"]
            total_weight += data["weight"]

        overall = weighted_sum / (total_weight + 1e-8)

        missing_ratio = 0
        for dim in self.REQUIRED_DIMENSIONS:
            score = all_scores.get(dim, 0)
            if score < 12:
                missing_ratio += 0.8

        penalty = missing_ratio * 1.2
        overall = overall - penalty

        word_count = len(delegate_text.split())
        has_numbers = bool(re.search(r"\d+", delegate_text))
        has_product_detail = any(word in delegate_text.lower() for word in 
                         ["magnésium", "vitamine", "gélule", "patients", "étude", 
                          "complément", "indiqué", "posologie"])
    
        if word_count < 15 and not has_numbers and not has_product_detail:
            overall = max(overall * 0.55, 30)
        elif word_count < 5:
            overall = max(overall, 30)
        elif word_count < 10:
            overall = max(overall * 0.85, 45)

        has_study_details = bool(re.search(r"randomisée|randomisé|double aveugle|p < 0\.01|p inférieur", delegate_text))
        has_numbers = bool(re.search(r"\d+", delegate_text))
        
        if has_study_details and has_numbers and word_count > 20:
            overall = min(100, overall * 1.12)
        
        overall = max(0, min(100, overall))

        result = {
            "overall": round(overall, 1),
            "stage": stage,
            "dimensions": weighted_scores,
            "covered_dimensions": [d for d, v in all_scores.items() if v > 8],
            "missing_core_count": missing_ratio
        }

        self.session_scores.append(result)
        return result

    def detect_stage(self, text: str, intent: str, dialogue_state: dict) -> str:
        text_lower = text.lower()

        intro_keywords = ["bonjour", "bonsoir", "salut", "introduire", "présenter"]
        if any(k in text_lower for k in intro_keywords):
            return "introduction"

        pitch_keywords = ["réduit", "améliore", "efficace", "bénéfice", "traitement"]
        if any(k in text_lower for k in pitch_keywords):
            return "product_pitch"

        scientific_keywords = ["étude", "clinique", "p-value", "publication", "essai"]
        if any(k in text_lower for k in scientific_keywords):
            return "scientific_discussion"

        objection_keywords = ["risque", "effet secondaire", "sécurité", "objection", "dépendance"]
        if any(k in text_lower for k in objection_keywords):
            return "objection_handling"

        closing_keywords = ["prescrire", "essayer", "utiliser", "prochaine visite"]
        if any(k in text_lower for k in closing_keywords):
            return "closing"

        return "general"

    @staticmethod
    def _cosine_sim(embedding: np.ndarray, reference_embeddings: np.ndarray) -> np.ndarray:
        emb_norm = embedding / (np.linalg.norm(embedding) + 1e-8)
        refs_norm = reference_embeddings / (np.linalg.norm(reference_embeddings, axis=1, keepdims=True) + 1e-8)
        return np.dot(refs_norm, emb_norm)

    def _apply_intent_weighting(self, scores: dict, intent: str, text: str, state: dict) -> dict:
        text_lower = text.lower()
        weighted = dict(scores)

        if state.get("product") and intent in ["introduction", "benefit", "evidence"]:
            weighted["product_knowledge"] = min(100, weighted["product_knowledge"] + 5)

        if intent == "evidence":
            weighted["scientific_accuracy"] = min(100, weighted["scientific_accuracy"] + 10)

        if intent == "objection" or state.get("last_intent") == "objection":
            weighted["objection_handling"] = min(100, weighted["objection_handling"] + 10)

        if intent in ["introduction", "benefit"]:
            weighted["benefit_statement"] = min(100, weighted["benefit_statement"] + 5)

        if intent == "question":
            weighted["question_techniques"] = min(100, weighted["question_techniques"] + 10)

        if intent == "closing":
            weighted["closing_techniques"] = min(100, weighted["closing_techniques"] + 10)

        filler_count = text_lower.count("euh") + text_lower.count("uhm") + text_lower.count("hum")
        if filler_count > 0:
            weighted["communication_clarity"] = max(0, weighted["communication_clarity"] - filler_count * 5)

        confident_words = ["je recommande", "nous savons", "il est etabli", "data shows", "proven"]
        hedge_words = ["peut-etre", "maybe", "je ne suis pas sur", "i think", "probably", "euh"]

        conf_bonus = sum(2 for w in confident_words if w in text_lower)
        conf_penalty = sum(3 for w in hedge_words if w in text_lower)

        weighted["confidence_building"] = min(100, max(0, weighted["confidence_building"] + conf_bonus - conf_penalty))

        engagement_markers = [
            "qu'en pensez-vous",
            "what do you think",
            "chez vos patients",
            "avez-vous observe",
            "your experience",
            "your patients"
        ]

        eng_bonus = sum(2 for m in engagement_markers if m in text_lower)
        weighted["engagement_techniques"] = min(100, weighted["engagement_techniques"] + eng_bonus)

                # =====================================================
        # ADD DIFFICULTY SCALING HERE (before return)
        # =====================================================
        difficulty = state.get("difficulty", "intermediate")
        
        if difficulty == "beginner":
            # More forgiving: boost low scores
            for dim in weighted:
                if weighted[dim] < 50:
                    weighted[dim] = min(100, weighted[dim] + 10)
        elif difficulty == "professional":
            # Harsher: deduct for anything below excellent
            for dim in weighted:
                if weighted[dim] < 70:
                    weighted[dim] = max(0, weighted[dim] - 10)
        # intermediate = no adjustment

        return weighted

    def get_session_summary(self) -> dict:
        if not self.session_scores:
            return {}

        summary = {}
        dimension_history = {}

        for turn in self.session_scores:
            for dim, data in turn["dimensions"].items():
                if dim not in dimension_history:
                    dimension_history[dim] = []
                dimension_history[dim].append(data["score"])

        for dim, values in dimension_history.items():
            summary[f"avg_{dim}"] = round(sum(values) / len(values), 1)

        overall_scores = [turn["overall"] for turn in self.session_scores]
        summary["avg_overall"] = round(sum(overall_scores) / len(overall_scores), 1)
        summary["total_turns"] = len(self.session_scores)

        return summary

    def get_weakest_skill(self) -> Tuple[str, float]:
        summary = self.get_session_summary()
        dim_scores = {
            k.replace("avg_", ""): v
            for k, v in summary.items()
            if k.startswith("avg_") and k != "avg_overall"
        }

        if not dim_scores:
            return ("product_knowledge", 50.0)

        weakest = min(dim_scores, key=dim_scores.get)
        return (weakest, dim_scores[weakest])

    def get_top_weaknesses(self, top_n: int = 3) -> List[Tuple[str, float]]:
        summary = self.get_session_summary()
        dim_scores = {
            k.replace("avg_", ""): v
            for k, v in summary.items()
            if k.startswith("avg_") and k != "avg_overall"
        }
        return sorted(dim_scores.items(), key=lambda x: x[1])[:top_n]

# =============================================================================
# M5: ADAPTIVE LEARNING RECOMMENDATION
# =============================================================================

class AdaptiveRecommender:
    """Maps weakest skills to training modules, filtered by difficulty."""

    LEARNING_MODULES = {
        "product_knowledge": {"name": "Product Knowledge Mastery", "description": "Learn product composition, indications, dosage, and positioning", "difficulty": "beginner", "category": "knowledge", "estimated_time": "2-3 hours", "prerequisites": []},
        "clinical_evidence": {"name": "Clinical Evidence & Studies", "description": "Review clinical trials, efficacy data, and scientific publications", "difficulty": "intermediate", "category": "knowledge", "estimated_time": "2 hours", "prerequisites": ["product_knowledge"]},
        "objection_handling": {"name": "Objection Handling Techniques", "description": "Learn to address common doctor concerns about safety, efficacy, and cost", "difficulty": "intermediate", "category": "skills", "estimated_time": "2 hours", "prerequisites": ["product_knowledge"]},
        "benefit_statement": {"name": "Benefits Communication", "description": "Master articulating product benefits clearly and persuasively", "difficulty": "beginner", "category": "skills", "estimated_time": "2-3 hours", "prerequisites": []},
        "scientific_accuracy": {"name": "Scientific Communication", "description": "Improve scientific terminology and accurate claim presentation", "difficulty": "advanced", "category": "skills", "estimated_time": "2 hours", "prerequisites": ["clinical_evidence"]},
        "question_techniques": {"name": "Effective Questioning", "description": "Learn to ask probing questions to uncover doctor needs", "difficulty": "intermediate", "category": "skills", "estimated_time": "1 hour", "prerequisites": []},
        "closing_techniques": {"name": "Closing Strategies", "description": "Master techniques to secure commitment and next steps", "difficulty": "advanced", "category": "skills", "estimated_time": "1 hour", "prerequisites": ["objection_handling"]},
        "communication_clarity": {"name": "Communication Clarity", "description": "Enhance message clarity, conciseness, and impact", "difficulty": "beginner", "category": "soft_skills", "estimated_time": "2 hours", "prerequisites": []},
        "engagement_techniques": {"name": "Engagement Strategies", "description": "Techniques to maintain doctor engagement throughout the conversation", "difficulty": "intermediate", "category": "soft_skills", "estimated_time": "1 hour", "prerequisites": ["communication_clarity"]},
        "confidence_building": {"name": "Confidence Building", "description": "Develop presence, assertiveness, and confident delivery", "difficulty": "advanced", "category": "soft_skills", "estimated_time": "2 hours", "prerequisites": ["objection_handling", "communication_clarity"]},
        "role_play_scenarios": {"name": "Role-Play Scenarios", "description": "Practice with realistic doctor personas and challenging situations", "difficulty": "intermediate", "category": "practice", "estimated_time": "2-3 hours", "prerequisites": ["product_knowledge", "objection_handling"]},
    }

    THRESHOLDS = {"critical": 40, "moderate": 65, "good": 80}

    def _map_skill(self, skill: str) -> str:
        direct = {
            "product_knowledge": "product_knowledge",
            "scientific_accuracy": "scientific_accuracy",
            "objection_handling": "objection_handling",
            "benefit_statement": "benefit_statement",
            "question_techniques": "question_techniques",
            "closing_techniques": "closing_techniques",
            "communication_clarity": "communication_clarity",
            "engagement_techniques": "engagement_techniques",
            "confidence_building": "confidence_building",
        }
        return direct.get(skill, "communication_clarity")

    def recommend(self, weakest_skill: str, avg_score: float, difficulty: str) -> dict:
        module_id = self._map_skill(weakest_skill)
        module = self.LEARNING_MODULES.get(module_id)
        if not module:
            module = self.LEARNING_MODULES["communication_clarity"]

        # Filter by difficulty
        diff_levels = {"beginner": 1, "intermediate": 2, "professional": 3}
        current_level = diff_levels.get(difficulty, 2)
        module_level = diff_levels.get(module["difficulty"], 2)

        if avg_score < self.THRESHOLDS["critical"]:
            priority = "CRITICAL"
            urgency = "Immediate action required before your next sales call."
        elif avg_score < self.THRESHOLDS["moderate"]:
            priority = "MODERATE"
            urgency = "Recommended to complete within this week."
        elif avg_score < self.THRESHOLDS["good"]:
            priority = "OPTIONAL"
            urgency = "Nice-to-have improvement when you have time."
        else:
            priority = "MAINTAIN"
            urgency = "Focus on maintaining this strength."

        # Adjust priority if module difficulty exceeds current level
        if module_level > current_level:
            priority = "CHALLENGE"
            urgency = f"This module is {module['difficulty']}-level. Recommended after completing easier modules."

        return {
            "skill": weakest_skill,
            "score": avg_score,
            "priority": priority,
            "urgency": urgency,
            "module": module["name"],
            "module_id": module_id,
            "description": module["description"],
            "difficulty": module["difficulty"],
            "category": module["category"],
            "estimated_time": module["estimated_time"],
        }

    def recommend_multi(self, top_weaknesses, difficulty: str, top_n: int = 3) -> list:
        recs = []
        for skill, score in top_weaknesses:
            rec = self.recommend(skill, score, difficulty)
            recs.append(rec)
            if len(recs) >= top_n:
                break
        return recs


# =============================================================================
# PIPELINE CORE (shared models, per-session state)
# =============================================================================

class DSO2PipelineCore:
    """
    Loads all heavy models once. Provides per-session turn processing.
    """

    def __init__(self, groq_api_key: str, product_catalog_path: str, whisper_model_size: str = "small"):
        # Load product catalog
        df = pd.read_excel(product_catalog_path)
        product_col = None
        for col in df.columns:
            if str(col).strip().lower() in ["produit", "product", "nom", "name"]:
                product_col = col
                break
        if product_col is None:
            raise ValueError(f"No product column found. Columns: {list(df.columns)}")
        self.product_info = {}
        for _, row in df.iterrows():
            product = str(row.get(product_col, "")).strip().upper()
            if product and product != "NAN":
                self.product_info[product] = {str(c).strip(): str(row.get(c, "")).strip() for c in df.columns}

        # M0: Whisper STT
        self.stt = RobustWhisperSTT(model_size=whisper_model_size)

        # M1: Intent Analyzer
        self.model1 = Model1_IntentAnalyzer(api_key=groq_api_key, product_info=self.product_info)

        # M3: Doctor Response Generator
        self.model3 = AIDoctorGenerator(api_key=groq_api_key)

    def run_text_turn(self, text: str, persona: str, difficulty: str, tracker: DialogueStateTracker, scorer: PerformanceScorer) -> dict:
        """Process one text turn through M1 -> M2 -> M3 -> M4."""
        start = time.time()

        # M1: Intent
        m1_out = self.model1.analyze(text)
        intent = m1_out.get("intent", "other")

        # M2: State
        state = tracker.update(m1_out)

        # M3: Doctor Response
        doctor_response = self.model3.generate(text, state, persona, difficulty)

        # M4: Performance
        mock_model1_output = {
            "intent": intent,
            "product": m1_out.get("product"),
            "claims": m1_out.get("claims", []),
            "language": m1_out.get("language", "en"),
            "difficulty": difficulty
        }
        performance = scorer.score_turn(text, mock_model1_output, state)

        elapsed = int((time.time() - start) * 1000)

        return {
            "turn": state["turn_count"],
            "delegate_text": text,
            "intent": intent,
            "product": m1_out.get("product"),
            "claims": m1_out.get("claims", []),
            "language": m1_out.get("language", "en"),
            "doctor_response": doctor_response,
            "dialogue_state": {
                "stage": state["stage"],
                "turn_count": state["turn_count"],
            },
            "performance": performance,
            "processing_time_ms": elapsed,
        }

    def run_voice_turn(self, audio_bytes: bytes, filename: str, persona: str, difficulty: str, tracker: DialogueStateTracker, scorer: PerformanceScorer) -> dict:
        """STT -> text pipeline."""
        text = self.stt.transcribe(audio_bytes, filename)
        if not text:
            return {
                "turn": tracker.get_state()["turn_count"] + 1,
                "delegate_text": "",
                "transcribed_text": "",
                "intent": "other",
                "product": None,
                "claims": [],
                "language": "en",
                "doctor_response": "[No speech detected]",
                "dialogue_state": {
                    "stage": tracker.get_state()["stage"],
                    "turn_count": tracker.get_state()["turn_count"],
                },
                "performance": None,
                "processing_time_ms": 0,
            }
        result = self.run_text_turn(text, persona, difficulty, tracker, scorer)
        result["transcribed_text"] = text
        return result

    def generate_report(self, tracker: DialogueStateTracker, scorer: PerformanceScorer, difficulty: str) -> dict:
        """Generate AthenaPulse-style final report from accumulated session data."""
        perf_summary = scorer.get_session_summary()
        overall = perf_summary.get("avg_overall", 0)
        n_turns = perf_summary.get("total_turns", 0)

        # Score message
        if overall >= 80:
            score_message = "Excellent travail ! Vous maitrisez les fondamentaux de la vente pharmaceutique."
        elif overall >= 65:
            score_message = "Bon progres. Quelques ajustements vous meneront a l'excellence."
        elif overall >= 50:
            score_message = "A ameliorer, ne vous decouragez pas ! Chaque simulation est un pas en avant."
        else:
            score_message = "Des progres sont possibles. Concentrez-vous sur les modules recommandes ci-dessous."

        # Points forts (top 3)
        dim_scores = {k.replace("avg_", ""): v for k, v in perf_summary.items() if k.startswith("avg_") and k != "avg_overall"}
        sorted_best = sorted(dim_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        points_forts = [{"id": d, "label": scorer.DIMENSION_LABELS.get(d, d), "score": s,
                         "description": scorer.STRENGTH_DESCRIPTIONS.get(d, "")} for d, s in sorted_best]

        # Axes amelioration (bottom 3)
        sorted_worst = sorted(dim_scores.items(), key=lambda x: x[1])[:3]
        axes_amelioration = [{"id": d, "label": scorer.DIMENSION_LABELS.get(d, d), "score": s,
                              "description": scorer.WEAKNESS_DESCRIPTIONS.get(d, "")} for d, s in sorted_worst]

        # Recommendations
        recommender = AdaptiveRecommender()
        top_weaknesses = scorer.get_top_weaknesses(top_n=3)
        recs = recommender.recommend_multi(top_weaknesses, difficulty, top_n=3)

        # All dimensions for radar chart
        all_dimensions = [{"id": d, "label": scorer.DIMENSION_LABELS.get(d, d), "score": s}
                          for d, s in sorted(dim_scores.items(), key=lambda x: x[1], reverse=True)]

        report = {
            "score_global": round(overall),
            "score_message": score_message,
            "total_turns": n_turns,
            "difficulty": difficulty,
            "points_forts": points_forts,
            "axes_amelioration": axes_amelioration,
            "recommandations": [{"module": r["module"], "priority": r["priority"], "description": r["description"],
                                 "difficulty": r["difficulty"], "estimated_time": r["estimated_time"]} for r in recs],
            "all_dimensions": all_dimensions,
        }
        report["formatted_report"] = _format_report_text(report)
        return report


# =============================================================================
# REPORT FORMATTER (module-level helper)
# =============================================================================

def _format_report_text(report: dict) -> str:
    """Format the final report into a nice boxed text for frontend display."""
    score = report["score_global"]
    bar_len = 30
    filled = int(score / 100 * bar_len)
    empty = bar_len - filled
    bar = "█" * filled + "░" * empty

    lines = [
        "╔════════════════════════════════════════════════════════════════════╗",
        "║                    RAPPORT DE PERFORMANCE                          ║",
        "╠════════════════════════════════════════════════════════════════════╣",
        f"║  Score global : {score}%{' ' * (56 - len(str(score)) - 14)}║",
        f"║  [{bar}]{' ' * (62 - bar_len)}║",
        f"║  {report['score_message'][:62]}{' ' * max(0, 63 - len(report['score_message']))}║",
        "╚════════════════════════════════════════════════════════════════════╝",
        "",
        "┌────────────────────────────────────────────────────────────────────┐",
        "│  ✅ POINTS FORTS                                                   │",
        "├────────────────────────────────────────────────────────────────────┤",
    ]

    for pf in report.get("points_forts", []):
        label = pf.get("label", "")
        desc = pf.get("description", "")
        lines.append(f"│    ✔ {label[:55]}{' ' * max(0, 56 - len(label))}│")
        lines.append(f"│      {desc[:59]}{' ' * max(0, 60 - len(desc))}│")
        lines.append(f"│{' ' * 68}│")

    lines.extend([
        "└────────────────────────────────────────────────────────────────────┘",
        "",
        "┌────────────────────────────────────────────────────────────────────┐",
        "│  ⚠️  AXES D'AMÉLIORATION                                          │",
        "├────────────────────────────────────────────────────────────────────┤",
    ])

    for am in report.get("axes_amelioration", []):
        label = am.get("label", "")
        desc = am.get("description", "")
        lines.append(f"│    ○ {label[:55]}{' ' * max(0, 56 - len(label))}│")
        lines.append(f"│      {desc[:59]}{' ' * max(0, 60 - len(desc))}│")
        lines.append(f"│{' ' * 68}│")

    lines.extend([
        "└────────────────────────────────────────────────────────────────────┘",
        "",
        "┌────────────────────────────────────────────────────────────────────┐",
        "│  📋 RECOMMANDATIONS                                                │",
        "├────────────────────────────────────────────────────────────────────┤",
    ])

    for rec in report.get("recommandations", []):
        mod = rec.get("module", "")
        desc = rec.get("description", "")
        prio = rec.get("priority", "")
        lines.append(f"│    □ {mod[:55]}{' ' * max(0, 56 - len(mod))}│")
        lines.append(f"│      → {desc[:57]}{' ' * max(0, 58 - len(desc))}│")
        lines.append(f"│      Priorité : {prio[:46]}{' ' * max(0, 47 - len(prio))}│")
        lines.append(f"│{' ' * 68}│")

    lines.extend([
        "└────────────────────────────────────────────────────────────────────┘",
    ])

    return "\n".join(lines)


# =============================================================================
# SESSION MANAGER (API-facing wrapper)
# =============================================================================

class DSO2SessionManager:
    """
    Manages active training sessions in memory + persists completed ones to disk.
    """

    def __init__(self, groq_api_key: str, product_catalog_path: str, whisper_model_size: str = "small"):
        self.core = DSO2PipelineCore(groq_api_key, product_catalog_path, whisper_model_size)
        self.sessions: Dict[str, dict] = {}
        self.store = SessionStore()

    def create_session(self, delegate_id: str, persona: str, difficulty: str) -> str:
        """Start a new training session. Returns session_id."""
        sid = uuid.uuid4().hex[:12]
        self.sessions[sid] = {
            "delegate_id": delegate_id,
            "persona": persona,
            "difficulty": difficulty,
            "created_at": datetime.now().isoformat(),
            "tracker": DialogueStateTracker(),
            "scorer": PerformanceScorer(),
            "turns": [],
        }
        return sid

    def process_text(self, session_id: str, text: str) -> dict:
        """Process one delegate text message."""
        s = self.sessions[session_id]
        result = self.core.run_text_turn(
            text=text,
            persona=s["persona"],
            difficulty=s["difficulty"],
            tracker=s["tracker"],
            scorer=s["scorer"],
        )
        s["turns"].append(result)
        return result

    def process_voice(self, session_id: str, audio_bytes: bytes, filename: str) -> dict:
        """Process one delegate voice message (STT + pipeline)."""
        s = self.sessions[session_id]
        result = self.core.run_voice_turn(
            audio_bytes=audio_bytes,
            filename=filename,
            persona=s["persona"],
            difficulty=s["difficulty"],
            tracker=s["tracker"],
            scorer=s["scorer"],
        )
        s["turns"].append(result)
        return result

    def get_session_state(self, session_id: str) -> dict:
        """Get current conversation state (for UI sync)."""
        s = self.sessions.get(session_id)
        if not s:
            return None
        return {
            "session_id": session_id,
            "delegate_id": s["delegate_id"],
            "persona": s["persona"],
            "difficulty": s["difficulty"],
            "turn_count": len(s["turns"]),
            "dialogue_state": s["tracker"].get_state(),
        }

    def end_session(self, session_id: str) -> dict:
        """End session, generate report, persist to disk, clean up memory."""
        s = self.sessions[session_id]
        report = self.core.generate_report(s["tracker"], s["scorer"], s["difficulty"])

        self.store.save(
            session_id=session_id,
            delegate_id=s["delegate_id"],
            persona=s["persona"],
            difficulty=s["difficulty"],
            turns=s["turns"],
            report=report,
        )

        del self.sessions[session_id]
        return report

    def get_report(self, session_id: str) -> Optional[dict]:
        """Load a saved report from disk."""
        return self.store.load_report(session_id)

    def list_sessions(self, delegate_id: Optional[str] = None) -> List[dict]:
        """List all completed sessions."""
        return self.store.list_all(delegate_id=delegate_id)