"""
DSO4 Commercial Mode — FastAPI Service (Unified Voice + Text)
===============================================================
Avatar = Delegate | Human = HCP (real doctor)

Run locally:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Swagger UI: http://localhost:8000/docs

Endpoints:
    POST /session/start          → Create new commercial session
    POST /analyze/text           → HCP sends text → delegate response
    POST /analyze/voice          → HCP sends audio → delegate response + transcription
    GET  /session/{id}           → Get live session state
    POST /session/{id}/end       → End session → engagement report
    GET  /session/{id}/report    → Retrieve saved engagement report
    GET  /sessions               → List all completed sessions (admin)
"""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from model import DSO4CommercialPipeline, EngagementAccumulator, SessionStore

load_dotenv()

# =============================================================================
# Pydantic request/response schemas
# =============================================================================

class StartSessionRequest(BaseModel):
    hcp_id: str = Field(..., description="Unique HCP identifier")
    hcp_name: str = Field(..., description="HCP display name (e.g., Dr. Karim)")
    hcp_specialty: str = Field(default="", description="Medical specialty")

class StartSessionResponse(BaseModel):
    session_id: str
    message: str

class TextTurnRequest(BaseModel):
    session_id: str
    text: str = Field(..., description="HCP message text (French or English)")

class TurnResponse(BaseModel):
    turn: int
    delegate_response: str = Field(..., description="Avatar's delegate response to display")
    transcribed_text: Optional[str] = Field(None, description="Only populated for voice mode")
    detected_language: str = Field("en", description="fr or en")

class EndSessionResponse(BaseModel):
    score_global: int = Field(..., description="0-100 overall engagement score")
    score_message: str
    total_turns: int
    dominant_emotion: str
    trend_direction: str
    early_avg: float
    late_avg: float
    avg_valence: float
    avg_arousal: float
    avg_dominance: float
    avg_sentiment: float
    risk_moments: list
    recommendations: list
    turn_details: list
    formatted_report: str = Field(..., description="Pre-formatted ASCII report for direct display")

class SessionInfoResponse(BaseModel):
    session_id: str
    hcp_id: str
    hcp_name: str
    hcp_specialty: str
    turn_count: int
    current_state: str

class SavedSessionSummary(BaseModel):
    session_id: str
    hcp_id: str
    hcp_name: str
    hcp_specialty: str
    date: str
    score_global: int

# =============================================================================
# FastAPI app
# =============================================================================

app = FastAPI(
    title="DSO4 Commercial — Avatar Delegate API",
    description="HCP engagement analysis + delegate response generation. Bilingual FR/EN.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Global state (singleton pipeline + in-memory session storage)
# =============================================================================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
PRODUCT_CATALOG_PATH = os.environ.get("PRODUCT_CATALOG_PATH", "produits_final_complet.xlsx")
SESSIONS_DIR = os.environ.get("SESSIONS_DIR", "sessions")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")

# Validation
if not GROQ_API_KEY:
    print("⚠️  WARNING: GROQ_API_KEY not set. Create a .env file with your key.")
    PIPELINE = None
else:
    PIPELINE = DSO4CommercialPipeline(
        groq_api_key=GROQ_API_KEY,
        product_catalog_path=PRODUCT_CATALOG_PATH,
        whisper_model_size=WHISPER_MODEL,
    )

# In-memory active sessions: {session_id: {"hcp_id": ..., "hcp_name": ..., "accumulator": ..., "created_at": ...}}
ACTIVE_SESSIONS = {}
STORE = SessionStore(data_dir=SESSIONS_DIR)

# =============================================================================
# Endpoints
# =============================================================================

@app.post("/session/start", response_model=StartSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(body: StartSessionRequest):
    """Create a new commercial session. The HCP (doctor) starts a conversation with the avatar delegate."""
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized. Set GROQ_API_KEY.")

    session_id = os.urandom(8).hex()
    ACTIVE_SESSIONS[session_id] = {
        "hcp_id": body.hcp_id,
        "hcp_name": body.hcp_name,
        "hcp_specialty": body.hcp_specialty,
        "accumulator": EngagementAccumulator(),
    }
    return {"session_id": session_id, "message": "Session started. Use /analyze/text or /analyze/voice to begin."}

@app.post("/analyze/text", response_model=TurnResponse)
async def analyze_text(body: TextTurnRequest):
    """Process one HCP text message. Returns only the delegate's response."""
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized.")

    sess = ACTIVE_SESSIONS.get(body.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")

    result = PIPELINE.process_text_turn(sess["accumulator"], body.text)
    return {
        "turn": result.turn,
        "delegate_response": result.delegate_response,
        "detected_language": result.detected_language,
    }

@app.post("/analyze/voice", response_model=TurnResponse)
async def analyze_voice(
    session_id: str = Form(..., description="Active session ID"),
    audio: UploadFile = File(..., description="HCP audio file (wav, mp3, webm, m4a, ogg)"),
):
    """Process one HCP voice message. Whisper STT → sentiment → delegate response."""
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized.")

    sess = ACTIVE_SESSIONS.get(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")

    audio_bytes = await audio.read()
    result = PIPELINE.process_voice_turn(sess["accumulator"], audio_bytes, filename=audio.filename)
    return {
        "turn": result.turn,
        "delegate_response": result.delegate_response,
        "transcribed_text": result.transcribed_text,
        "detected_language": result.detected_language,
    }

@app.get("/session/{session_id}", response_model=SessionInfoResponse)
async def get_session(session_id: str):
    """Check the current state of an active session (turn count, etc.)."""
    sess = ACTIVE_SESSIONS.get(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")
    return {
        "session_id": session_id,
        "hcp_id": sess["hcp_id"],
        "hcp_name": sess["hcp_name"],
        "hcp_specialty": sess["hcp_specialty"],
        "turn_count": sess["accumulator"].get_turn_count(),
        "current_state": "active",
    }

@app.post("/session/{session_id}/end", response_model=EndSessionResponse)
async def end_session(session_id: str):
    """End the conversation and generate the HCP engagement report."""
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized.")

    sess = ACTIVE_SESSIONS.pop(session_id, None)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")

    report = PIPELINE.build_report(sess["accumulator"])

    # Persist for admin dashboard
    STORE.save(
        session_id=session_id,
        hcp_id=sess["hcp_id"],
        hcp_name=sess["hcp_name"],
        hcp_specialty=sess["hcp_specialty"],
        report=report,
    )

    return {
        "score_global": report["score_global"],
        "score_message": report["score_message"],
        "total_turns": report["total_turns"],
        "dominant_emotion": report["dominant_emotion"],
        "trend_direction": report["trend_direction"],
        "early_avg": report["early_avg"],
        "late_avg": report["late_avg"],
        "avg_valence": report["avg_valence"],
        "avg_arousal": report["avg_arousal"],
        "avg_dominance": report["avg_dominance"],
        "avg_sentiment": report["avg_sentiment"],
        "risk_moments": report["risk_moments"],
        "recommendations": report["recommendations"],
        "turn_details": report["turn_details"],
        "formatted_report": report["formatted_report"],
    }

@app.get("/session/{session_id}/report")
async def get_report(session_id: str):
    """Retrieve a saved engagement report (admin dashboard)."""
    report = STORE.load_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"session_id": session_id, "engagement_report": report}

@app.get("/sessions")
async def list_sessions(hcp_id: str = None):
    """List all completed sessions for admin review. Optional filter by hcp_id."""
    return STORE.list_all(hcp_id=hcp_id)