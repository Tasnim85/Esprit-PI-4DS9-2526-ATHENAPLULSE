"""
DSO2 API — FastAPI Service
==========================
Complete 5-model pipeline for Delegate Training with:
  - Text & Voice input paths
  - 18 doctor personas + 3 difficulty levels
  - Session persistence (delegate + admin dashboards)

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Swagger:
    http://localhost:8000/docs
"""

import os
os.environ["TRANSFORMERS_NO_TF"] = "1"  # Force PyTorch-only, skip TensorFlow/Keras

from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, Form, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from model import DSO2SessionManager

# =============================================================================
# Request schemas
# =============================================================================

class StartSessionRequest(BaseModel):
    delegate_id: str = Field(..., description="Delegate user identifier")
    persona: str = Field("general_practitioner", description="Doctor persona to simulate")
    difficulty: str = Field("intermediate", description="beginner / intermediate / professional")


class TextTurnRequest(BaseModel):
    session_id: str = Field(..., description="Active session ID from /session/start")
    text: str = Field(..., description="Delegate message text", min_length=1)


class SessionStateResponse(BaseModel):
    session_id: str
    delegate_id: str
    persona: str
    difficulty: str
    turn_count: int
    dialogue_state: dict


class TurnResultResponse(BaseModel):
    turn: int
    doctor_response: str
    transcribed_text: Optional[str] = None


class EndSessionResponse(BaseModel):
    score_global: int = Field(..., description="0-100 overall performance score")
    score_message: str
    total_turns: int
    difficulty: str
    points_forts: List[dict]
    axes_amelioration: List[dict]
    recommandations: List[dict]
    all_dimensions: List[dict]
    formatted_report: str = Field(..., description="Pre-formatted text report for direct frontend display")


class SessionSummaryItem(BaseModel):
    session_id: str
    delegate_id: str
    persona: Optional[str]
    difficulty: Optional[str]
    created_at: str
    overall_score: int
    status: str


# =============================================================================
# App setup
# =============================================================================

app = FastAPI(
    title="AVATAR DSO2 API",
    description="Complete 5-model training pipeline with persona/difficulty selection.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MANAGER: Optional[DSO2SessionManager] = None


def _init_manager():
    global MANAGER
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise RuntimeError("GROQ_API_KEY environment variable not set")

    # Check .env path first, then local folder, then current directory
    product_path = os.environ.get("PRODUCT_CATALOG_PATH")
    if not product_path:
        local = Path(__file__).parent / "produits_final_complet.xlsx"
        product_path = str(local) if local.exists() else "produits_final_complet.xlsx"

    MANAGER = DSO2SessionManager(
        groq_api_key=groq_key,
        product_catalog_path=product_path,
        whisper_model_size="small",
    )


@app.on_event("startup")
def startup():
    try:
        _init_manager()
        print("✅ DSO2 API ready!")
    except Exception as e:
        print(f"⚠️  Startup warning: {e}")
        print("   Set GROQ_API_KEY and optionally PRODUCT_CATALOG_PATH, then restart.")


# =============================================================================
# Endpoints
# =============================================================================

@app.post(
    "/session/start",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    tags=["Session"],
    summary="Start a new training session",
    description="Delegate selects persona and difficulty before training begins.",
)
def start_session(req: StartSessionRequest):
    """Create a new training session. Returns the session_id to use in subsequent turn calls."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    sid = MANAGER.create_session(req.delegate_id, req.persona, req.difficulty)
    return {"session_id": sid, "status": "created", "persona": req.persona, "difficulty": req.difficulty}


@app.post(
    "/analyze/text",
    response_model=TurnResultResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
    summary="Process one text turn",
    description="Send delegate text. Returns intent classification, doctor response, and performance score.",
)
def analyze_text(req: TextTurnRequest):
    """Process one delegate text message through the full pipeline."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    if req.session_id not in MANAGER.sessions:
        return JSONResponse(status_code=404, content={"detail": "Session not found"})
    return MANAGER.process_text(req.session_id, req.text)


@app.post(
    "/analyze/voice",
    response_model=TurnResultResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
    summary="Process one voice turn",
    description="Upload delegate audio. Whisper STT transcribes, then full pipeline runs.",
)
async def analyze_voice(
    audio: UploadFile = File(..., description="Delegate audio message"),
    session_id: str = Form(..., description="Active session ID"),
):
    """Process one delegate voice message: STT -> M1 -> M2 -> M3 -> M4."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    if session_id not in MANAGER.sessions:
        return JSONResponse(status_code=404, content={"detail": "Session not found"})

    audio_bytes = await audio.read()
    return MANAGER.process_voice(session_id, audio_bytes, audio.filename or "audio.webm")


@app.get(
    "/session/{session_id}",
    response_model=SessionStateResponse,
    tags=["Session"],
    summary="Get current session state",
)
def get_session_state(session_id: str):
    """Check current session status: persona, difficulty, turn count, dialogue stage."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    state = MANAGER.get_session_state(session_id)
    if state is None:
        return JSONResponse(status_code=404, content={"detail": "Session not found"})
    return state


@app.post(
    "/session/{session_id}/end",
    response_model=EndSessionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Session"],
    summary="End session and generate report",
    description="Call when training ends. Generates AthenaPulse report and saves session to disk.",
)
def end_session(session_id: str):
    """End the session, generate the performance report, and persist everything."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    if session_id not in MANAGER.sessions:
        return JSONResponse(status_code=404, content={"detail": "Session not found or already ended"})
    return MANAGER.end_session(session_id)


@app.get(
    "/session/{session_id}/report",
    response_model=EndSessionResponse,
    tags=["Admin"],
    summary="Retrieve a saved session report",
)
def get_session_report(session_id: str):
    """Load a previously saved session report (for delegate/admin dashboard)."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    report = MANAGER.get_report(session_id)
    if report is None:
        return JSONResponse(status_code=404, content={"detail": "Session not found"})
    return report


@app.get(
    "/sessions",
    response_model=List[SessionSummaryItem],
    tags=["Admin"],
    summary="List all sessions",
)
def list_sessions(delegate_id: Optional[str] = None):
    """List all completed training sessions. Optionally filter by delegate_id."""
    if MANAGER is None:
        return JSONResponse(status_code=503, content={"detail": "Pipeline not initialized"})
    return MANAGER.list_sessions(delegate_id=delegate_id)


# =============================================================================
# Entrypoint
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
        log_level="info",
    )