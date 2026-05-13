"""
DSO4 Commercial Mode — HCP Engagement + Delegate Response Pipeline
====================================================================
Avatar = Delegate | Human = HCP (real doctor)

Per turn:
  HCP Input → Sentiment (NLPTown + Pharma calibration) → SER VAD (voice only)
  → Delegate Response (Groq LLM, bilingual) → Return ONLY delegate_response

End session:
  Aggregate all turns → Engagement Report (boxed ASCII, bilingual)

Session persistence:
  Completed sessions saved to JSON for admin dashboard review.
"""

import io
import json
import os
import time
import uuid
import warnings
from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
import requests
import soundfile as sf
import torch
from transformers import pipeline, AutoProcessor, AutoModelForAudioClassification

warnings.filterwarnings("ignore", category=UserWarning)


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 0: AUDIO + WHISPER STT
# ═══════════════════════════════════════════════════════════════════════════

class RobustWhisperSTT:
    """Whisper STT — returns {"text": ..., "language": "fr"|"en"|""}."""

    MEDICAL_PROMPT = (
        "Transcription medicale pharmaceutique. "
        "Conserver les termes techniques, noms de produits, posologies et references cliniques."
    )

    def __init__(self, model_size: str = "small"):
        import whisper
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model(model_size, device=self.device)

    def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> dict:
        try:
            data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
        except Exception:
            try:
                from pydub import AudioSegment
                ext = Path(filename).suffix.lstrip(".") or None
                seg = AudioSegment.from_file(io.BytesIO(audio_bytes), format=ext)
                wav_io = io.BytesIO()
                seg.export(wav_io, format="wav")
                wav_io.seek(0)
                data, sr = sf.read(wav_io, dtype="float32")
            except Exception:
                return {"text": "", "language": ""}

        if data.ndim > 1:
            data = data.mean(axis=1)
        if sr != 16000:
            target_len = int(len(data) * 16000 / sr)
            indices = np.linspace(0, len(data) - 1, target_len)
            data = np.interp(indices, np.arange(len(data)), data)

        result = self.model.transcribe(
            data.astype(np.float32),
            task="transcribe", language=None, fp16=False,
            initial_prompt=self.MEDICAL_PROMPT,
            temperature=0.0, condition_on_previous_text=False,
        )
        lang = (result.get("language") or "").lower()
        text = (result.get("text") or "").strip()
        if lang not in {"fr", "en"} or len(text) < 2:
            return {"text": "", "language": ""}
        return {"text": text, "language": lang}


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1: HCP TEXT SENTIMENT (NLPTown)
# ═══════════════════════════════════════════════════════════════════════════

class HCPSentimentAnalyzer:
    """1-5 star sentiment classifier."""

    def __init__(self):
        self.classifier = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment",
            framework="pt",
        )

    def analyze(self, text: str) -> dict:
        result = self.classifier(text[:512])[0]
        stars = int(result["label"][0])
        if stars <= 2:
            label = "NEGATIVE"
        elif stars == 3:
            label = "NEUTRAL"
        else:
            label = "POSITIVE"
        return {"stars": stars, "label": label, "confidence": round(result["score"], 3)}


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1b: PHARMA SENTIMENT POST-PROCESSOR
# ═══════════════════════════════════════════════════════════════════════════

class PharmaSentimentPostProcessor:
    """Calibrates NLPTown sentiment for pharmaceutical conversation context."""

    PHARMA_POSITIVE = [
        "échantillon", "échantillons", "essayer", "tester", "prescrire", "prescription",
        "convaincu", "intéressé", "parfait", "excellent", "super", "génial",
        "d'accord", "ok ", "pourquoi pas", "allons-y", "volontiers",
        "laissez-moi", "je vais", "je prend", "ça marche", "très bien",
        "bonne idée", "je suis ouvert", "on peut essayer",
        "sample", "samples", "try it", "give it a try", "prescribe", "prescription",
        "convinced", "interested", "perfect", "excellent", "great", "good idea",
        "alright", "ok ", "sure", "why not", "let's do it", "let's go",
        "leave me some", "i'll try", "i'll give it a try", "i'll take",
        "that works", "very well", "i'm open", "we can try", "sounds good",
        "makes sense", "fair enough", "that helps", "thank you",
    ]

    PHARMA_NEGATIVE = [
        "pas convaincu", "pas intéressé", "non merci", "trop cher", "trop coûteux",
        "déçu", "problème", "effets secondaires", "contre-indiqué", "contre-indication",
        "déjà satisfait", "ne changerais pas", "inutile", "inacceptable",
        "pas besoin", "pas pour moi", "je refuse", "je n'achèterai pas",
        "arnaque", "trop risqué", "dangereux", "inefficace",
        "not convinced", "not interested", "no thanks", "too expensive", "too costly",
        "disappointed", "problem", "side effects", "contraindicated", "contraindication",
        "already satisfied", "won't switch", "useless", "unacceptable",
        "don't need", "won't change", "i refuse", "i won't buy",
        "scam", "too risky", "dangerous", "ineffective", "doesn't work",
        "waste of time", "not for me", "i'm good", "no need",
    ]

    PHARMA_NEUTRAL = [
        "qu'est-ce que", "comment", "quels sont", "quelles sont", "pourquoi",
        "combien", "où", "quand", "qui", "expliquez-moi",
        "parlez-moi", "dites-moi", "pouvez-vous", "pourriez-vous",
        "j'ai entendu parler", "j'aimerais savoir", "je voudrais",
        "avez-vous", "a-t-il", "est-ce que", "c'est quoi",
        "what is", "how does", "what are", "why ", "how much",
        "where ", "when ", "who ", "explain", "tell me",
        "i heard about", "i'd like to know", "i would like",
        "do you have", "does it", "is it", "what about",
        "how is", "can you", "could you",
    ]

    def process(self, text: str, nlptown_result: dict) -> dict:
        text_lower = text.lower()
        original_stars = nlptown_result["stars"]
        stars = original_stars
        adjustment = "none"

        pos_hits = [sig for sig in self.PHARMA_POSITIVE if sig in text_lower]
        if pos_hits:
            stars = min(5, stars + 2)
            adjustment = f"positive_boost:{','.join(pos_hits[:3])}"

        neg_hits = [sig for sig in self.PHARMA_NEGATIVE if sig in text_lower]
        if neg_hits:
            stars = max(1, stars - 2)
            adjustment = f"negative_penalty:{','.join(neg_hits[:3])}"

        neutral_hits = [sig for sig in self.PHARMA_NEUTRAL if sig in text_lower]
        if neutral_hits and stars <= 2:
            stars = 3
            adjustment = f"neutral_correction:{','.join(neutral_hits[:3])}"

        agreement_phrases = [
            "je vais essayer", "je vais tester", "laissez-moi des échantillons",
            "i'll try", "i'll give it a try", "i'll test", "leave me some samples",
            "je prend", "i'll take it", "ok go ahead",
        ]
        if any(p in text_lower for p in agreement_phrases) and stars < 4:
            stars = 4
            adjustment = "agreement_forced_positive"

        if stars <= 2:
            label = "NEGATIVE"
        elif stars == 3:
            label = "NEUTRAL"
        else:
            label = "POSITIVE"

        return {
            "stars": stars, "label": label,
            "confidence": nlptown_result["confidence"],
            "original_stars": original_stars,
            "original_label": nlptown_result["label"],
            "adjustment": adjustment,
        }


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2: HCP SER VAD (Audeering wav2vec2)
# ═══════════════════════════════════════════════════════════════════════════

class HCPSERAnalyzer:
    """Extracts VAD from HCP audio. Includes vocab_size=None patch."""

    def __init__(self):
        model_name = "audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim"
        from transformers import PretrainedConfig, Wav2Vec2FeatureExtractor
        import json as _json

        try:
            from huggingface_hub import hf_hub_download
            raw_config_path = hf_hub_download(repo_id=model_name, filename="config.json")
            with open(raw_config_path, "r", encoding="utf-8") as f:
                config_dict = _json.load(f)
            if config_dict.get("vocab_size") is None:
                config_dict["vocab_size"] = 32
            config = PretrainedConfig.from_dict(config_dict)
            self.processor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
            self.model = AutoModelForAudioClassification.from_pretrained(
                model_name, config=config, ignore_mismatched_sizes=True,
            )
        except Exception as e:
            print(f"[SER] Config patch failed ({e}), trying direct load...")
            self.processor = AutoProcessor.from_pretrained(model_name)
            self.model = AutoModelForAudioClassification.from_pretrained(model_name)
        self.model.eval()

    def extract(self, audio_bytes: bytes) -> dict:
        try:
            data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
        except Exception:
            return {"valence": 3.0, "arousal": 3.0, "dominance": 3.0}
        if data.ndim > 1:
            data = data.mean(axis=1)
        if sr != 16000:
            target_len = int(len(data) * 16000 / sr)
            indices = np.linspace(0, len(data) - 1, target_len)
            data = np.interp(indices, np.arange(len(data)), data)
        inputs = self.processor(data, sampling_rate=16000, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model(**inputs)
        logits = outputs.logits.squeeze()
        vad_raw = torch.sigmoid(logits).numpy()
        vad_scaled = 1 + 4 * vad_raw
        if len(vad_scaled) >= 3:
            v = float(np.clip(vad_scaled[0], 1, 5))
            a = float(np.clip(vad_scaled[1], 1, 5))
            d = float(np.clip(vad_scaled[2], 1, 5))
        elif len(vad_scaled) == 1:
            v, d = 3.0, 3.0
            a = float(np.clip(vad_scaled[0], 1, 5))
        else:
            v = a = d = 3.0
        return {"valence": round(v, 2), "arousal": round(a, 2), "dominance": round(d, 2)}


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3: ENGAGEMENT ACCUMULATOR
# ═══════════════════════════════════════════════════════════════════════════

class EngagementAccumulator:
    """Per-conversation in-memory storage for turn data."""

    def __init__(self):
        self.turns: List[dict] = []

    def add_turn(self, turn_number: int, hcp_text: str, delegate_response: str,
                 sentiment: dict, vad: Optional[dict], language: str = "en") -> None:
        self.turns.append({
            "turn": turn_number, "hcp_text": hcp_text,
            "delegate_response": delegate_response,
            "sentiment_stars": sentiment["stars"],
            "sentiment_label": sentiment["label"],
            "sentiment_confidence": sentiment["confidence"],
            "valence": vad.get("valence", 3.0) if vad else 3.0,
            "arousal": vad.get("arousal", 3.0) if vad else 3.0,
            "dominance": vad.get("dominance", 3.0) if vad else 3.0,
            "language": language, "timestamp": time.time(),
        })

    def get_all_turns(self) -> List[dict]:
        return list(self.turns)

    def get_turn_count(self) -> int:
        return len(self.turns)

    def reset(self):
        self.turns = []

    def get_dominant_language(self) -> str:
        if not self.turns:
            return "en"
        fr = sum(1 for t in self.turns if t.get("language") == "fr")
        en = sum(1 for t in self.turns if t.get("language") == "en")
        return "fr" if fr >= en else "en"


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 4: DELEGATE RESPONSE GENERATOR (Groq LLM) — BILINGUAL
# ═══════════════════════════════════════════════════════════════════════════

class DelegateResponseGenerator:
    """Generates bilingual delegate responses via Groq LLM."""

    def __init__(self, api_key: str, product_info: dict):
        self.api_key = api_key
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.product_info = product_info

    def retrieve_products(self, text: str) -> list:
        t = text.lower()
        return [{"name": p, **info} for p, info in self.product_info.items() if p.lower() in t]

    def build_prompt(self, hcp_text: str, sentiment_label: str,
                     history: List[dict], language: str = "en",
                     product_name: Optional[str] = None) -> str:
        context = self.retrieve_products(hcp_text)
        if not context and product_name:
            context = [{"name": product_name, **self.product_info.get(product_name.upper(), {})}]

        history_lines = []
        for turn in history[-5:]:
            history_lines.append(f"HCP: {turn['hcp_text'][:80]}")
            history_lines.append(f"Delegate: {turn['delegate_response'][:80]}")
        history_text = "\n".join(history_lines) if history_lines else (
            "[Conversation start]" if language == "en" else "[Début de conversation]"
        )

        if language == "fr":
            if sentiment_label == "POSITIVE":
                strategy = "Le HCP est POSITIF et réceptif. Avancez sereinement vers le closing. Proposez un essai ou des échantillons."
            elif sentiment_label == "NEGATIVE":
                strategy = "Le HCP est NÉGATIF ou méfiant. Ne soyez pas pushy. Reformulez, admettez ses doutes, proposez une preuve concrète. S'il est vraiment hostile, proposez de recontacter plus tard."
            else:
                strategy = "Le HCP est NEUTRE / INDÉCIS. Posez une question ouverte pour comprendre son besoin réel. Ne proposez pas de closing tout de suite — rebâtissez l'intérêt."

            prompt = f"""Tu es Amine, délégué pharmaceutique chez Vital. Tu visites un médecin pour présenter un produit.

CONTEXTE PRODUIT:
{json.dumps(context, indent=2, ensure_ascii=False) if context else "Aucun produit spécifique mentionné."}

HISTORIQUE DE LA CONVERSATION:
{history_text}

DERNIER MESSAGE DU MÉDECIN:
"{hcp_text}"

TON ÉMOTIONNEL DU MÉDECIN (détecté automatiquement): {sentiment_label}

STRATÉGIE ADAPTÉE:
{strategy}

INSTRUCTIONS:
- Réponds en FRANÇAIS, 1-2 phrases maximum.
- Sois naturel, professionnel, pas robotique.
- Ne dis jamais "En tant que délégué..." — sois direct.
- Si le médecin compare à un concurrent, cite UNE différence concrète (donnée ou formulation).
- Ne fais pas de promesses médicales que tu ne peux pas tenir.
- IMPORTANT: Si le médecin a DÉJÀ accepté des échantillons ou un essai au tour précédent, ne le re-propose PAS. Remercie et confirme le suivi (date, contact).

Ta réponse:"""
        else:
            if sentiment_label == "POSITIVE":
                strategy = "The HCP is POSITIVE and receptive. Move smoothly toward closing. Offer a trial or samples."
            elif sentiment_label == "NEGATIVE":
                strategy = "The HCP is NEGATIVE or skeptical. Don't be pushy. Rephrase, acknowledge their doubts, offer concrete proof. If they are truly hostile, suggest reconnecting later."
            else:
                strategy = "The HCP is NEUTRAL / INDECISIVE. Ask an open-ended question to understand their real need. Don't propose closing yet — rebuild interest first."

            prompt = f"""You are Alex, a pharmaceutical sales representative at Vital. You are visiting a doctor to present a product.

PRODUCT CONTEXT:
{json.dumps(context, indent=2, ensure_ascii=False) if context else "No specific product mentioned."}

CONVERSATION HISTORY:
{history_text}

DOCTOR'S LAST MESSAGE:
"{hcp_text}"

DOCTOR'S EMOTIONAL TONE (auto-detected): {sentiment_label}

ADAPTIVE STRATEGY:
{strategy}

INSTRUCTIONS:
- Respond in ENGLISH, 1-2 sentences maximum.
- Be natural, professional, not robotic.
- Never say "As a sales rep..." — be direct.
- If the doctor compares to a competitor, cite ONE concrete differentiator (data or formulation).
- Don't make medical promises you can't keep.
- IMPORTANT: If the doctor ALREADY accepted samples or a trial in the previous turn, do NOT re-offer. Thank them and confirm next steps.

Your response:"""
        return prompt

    def generate(self, hcp_text: str, sentiment_label: str, history: List[dict],
                 language: str = "en", product_name: Optional[str] = None) -> str:
        prompt = self.build_prompt(hcp_text, sentiment_label, history, language, product_name)
        system_msg = (
            "You are an experienced pharmaceutical sales representative. You always respond in English, briefly and naturally."
            if language == "en" else
            "Tu es un délégué pharmaceutique expérimenté. Tu réponds toujours en français, brièvement et naturellement."
        )
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "system", "content": system_msg},
                         {"role": "user", "content": prompt}],
            "temperature": 0.7, "max_tokens": 150,
        }
        try:
            resp = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()[:250]
            elif resp.status_code == 429:
                time.sleep(2)
                resp = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()[:250]
        except Exception:
            pass
        return ("I understand. May I leave you a sample for evaluation?" if language == "en"
                else "Je comprends. Puis-je vous proposer un échantillon pour évaluation ?")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 5: ENGAGEMENT REPORT BUILDER — BILINGUAL
# ═══════════════════════════════════════════════════════════════════════════

class EngagementReportBuilder:
    """Builds final HCP engagement report in dominant conversation language."""

    EMOTION_LABELS = {
        "fr": {
            "high_engagement": "Engagé / Intéressé", "moderate_engagement": "Modérément intéressé",
            "neutral": "Neutre / Indécis", "disengaged": "Désengagé / Ennuyé", "hostile": "Hostile / Frustré",
        },
        "en": {
            "high_engagement": "Engaged / Interested", "moderate_engagement": "Moderately interested",
            "neutral": "Neutral / Indecisive", "disengaged": "Disengaged / Bored", "hostile": "Hostile / Frustrated",
        },
    }

    SCORE_MESSAGES = {
        "fr": {
            "excellent": "Excellent engagement ! Le HCP était réceptif et intéressé tout au long de la conversation.",
            "moderate": "Engagement modéré. Quelques moments de désengagement, mais le HCP reste globalement ouvert.",
            "low": "Engagement faible. Le HCP a montré des signes d'indifférence ou de méfiance.",
            "critical": "Engagement critique. Le HCP était largement désengagé ou hostile. Une nouvelle stratégie est nécessaire.",
        },
        "en": {
            "excellent": "Excellent engagement! The HCP was receptive and interested throughout the conversation.",
            "moderate": "Moderate engagement. Some disengagement moments, but the HCP remains generally open.",
            "low": "Low engagement. The HCP showed signs of indifference or distrust.",
            "critical": "Critical engagement. The HCP was largely disengaged or hostile. A new strategy is needed.",
        },
    }

    def _compute_engagement_score(self, turn: dict) -> float:
        v_norm = (turn["valence"] - 1) / 4.0
        a_norm = (turn["arousal"] - 1) / 4.0
        d_norm = (turn["dominance"] - 1) / 4.0
        s_norm = (turn["sentiment_stars"] - 1) / 4.0
        return round((v_norm * 0.35 + a_norm * 0.25 + s_norm * 0.25 + d_norm * 0.15) * 100, 1)

    def _classify_emotion(self, valence: float, arousal: float) -> str:
        if arousal >= 3.5:
            return "hostile" if valence <= 2.5 else "high_engagement"
        elif arousal <= 2.5:
            return "disengaged" if valence <= 2.5 else "neutral"
        return "moderate_engagement" if valence >= 3.0 else "neutral"

    def build(self, turns: List[dict], language: str = "en") -> dict:
        if not turns:
            return self._empty_report(language)

        n = len(turns)
        labels = self.EMOTION_LABELS.get(language, self.EMOTION_LABELS["en"])
        msgs = self.SCORE_MESSAGES.get(language, self.SCORE_MESSAGES["en"])

        for turn in turns:
            turn["engagement_score"] = self._compute_engagement_score(turn)
            turn["emotion_state"] = self._classify_emotion(turn["valence"], turn["arousal"])

        scores = [t["engagement_score"] for t in turns]
        overall = round(sum(scores) / n, 1)
        if n <= 1:
            early_avg = late_avg = overall
        else:
            mid = max(1, n // 2)
            early_avg = round(sum(scores[:mid]) / mid, 1)
            late_avg = round(sum(scores[mid:]) / (n - mid), 1)

        is_fr = language == "fr"
        trend = ("↗️ En hausse" if is_fr else "↗️ Rising") if late_avg > early_avg + 5 else \
                ("↘️ En baisse" if is_fr else "↘️ Falling") if late_avg < early_avg - 5 else \
                "➡️ Stable"

        emotion_counts = {}
        for t in turns:
            emotion_counts[t["emotion_state"]] = emotion_counts.get(t["emotion_state"], 0) + 1
        dominant = max(emotion_counts, key=emotion_counts.get)

        risk_turns = [{
            "turn": t["turn"],
            "hcp_text": t["hcp_text"][:60] + "..." if len(t["hcp_text"]) > 60 else t["hcp_text"],
            "score": t["engagement_score"],
            "emotion": labels.get(t["emotion_state"], t["emotion_state"]),
        } for t in turns if t["engagement_score"] < 40]

        if overall >= 75:
            score_msg = msgs["excellent"]
        elif overall >= 50:
            score_msg = msgs["moderate"]
        elif overall >= 35:
            score_msg = msgs["low"]
        else:
            score_msg = msgs["critical"]

        report = {
            "score_global": round(overall), "score_message": score_msg, "total_turns": n,
            "dominant_emotion": labels.get(dominant, dominant), "trend_direction": trend,
            "early_avg": early_avg, "late_avg": late_avg,
            "avg_valence": round(sum(t["valence"] for t in turns) / n, 2),
            "avg_arousal": round(sum(t["arousal"] for t in turns) / n, 2),
            "avg_dominance": round(sum(t["dominance"] for t in turns) / n, 2),
            "avg_sentiment": round(sum(t["sentiment_stars"] for t in turns) / n, 2),
            "risk_moments": risk_turns,
            "turn_details": [{"turn": t["turn"], "engagement_score": t["engagement_score"],
                              "emotion": labels.get(t["emotion_state"], t["emotion_state"]),
                              "sentiment": t["sentiment_label"]} for t in turns],
            "recommendations": self._build_recommendations(turns, dominant, early_avg, late_avg, language),
        }
        report["formatted_report"] = self._format_report(report, language)
        return report

    def _build_recommendations(self, turns, dominant_emotion, early, late, language="en"):
        recs = []
        fr = language == "fr"
        if late < early - 10:
            recs.append({"title": "Attention au décrochage en fin de conversation" if fr else "Watch for late-conversation drop-off",
                         "description": "L'engagement du HCP a chuté en fin d'entretien. Évitez les monologues. Posez des questions." if fr else "HCP engagement dropped at the end. Avoid long monologues. Ask questions every 2-3 sentences.", "priority": "HIGH"})
        if dominant_emotion == "disengaged":
            recs.append({"title": "Le HCP s'est ennuyé" if fr else "HCP was bored",
                         "description": "Le HCP a montré un profil 'basse énergie + basse valence'." if fr else "The HCP showed a 'low energy + low valence' profile.", "priority": "CRITICAL"})
        elif dominant_emotion == "hostile":
            recs.append({"title": "Le HCP était frustré" if fr else "HCP was frustrated",
                         "description": "Utilisez le cadre APRC. Ne contre-argumentez jamais directement." if fr else "Use the APRC framework. Never counter-argue directly.", "priority": "CRITICAL"})
        elif dominant_emotion == "neutral":
            recs.append({"title": "Le HCP est resté indécis" if fr else "HCP remained indecisive",
                         "description": "Travaillez votre argumentation 'Bénéfice → Preuve'." if fr else "Work on your 'Benefit → Proof' argumentation.", "priority": "MODERATE"})
        neg_turns = [t for t in turns if t["sentiment_label"] == "NEGATIVE"]
        if len(neg_turns) >= 2:
            recs.append({"title": "Plusieurs messages négatifs détectés" if fr else "Multiple negative messages detected",
                         "description": f"{len(neg_turns)} messages du HCP étaient négatifs." if fr else f"{len(neg_turns)} HCP messages were negative.", "priority": "HIGH"})
        if not recs:
            recs.append({"title": "Continuez sur cette lancée" if fr else "Keep up the good work",
                         "description": "Le profil d'engagement était globalement positif." if fr else "The engagement profile was generally positive.", "priority": "LOW"})
        return recs

    def _format_report(self, report: dict, language: str = "en") -> str:
        score = report["score_global"]
        bar_len = 30
        filled = int(score / 100 * bar_len)
        bar = "█" * filled + "░" * (bar_len - filled)
        fr = language == "fr"

        title_text = "RAPPORT D'ENGAGEMENT - ANALYSE HCP" if fr else "HCP ENGAGEMENT REPORT - ANALYSIS"
        score_label = "Score global d'engagement" if fr else "Overall engagement score"
        emo_title = "ETAT EMOTIONNEL GLOBAL" if fr else "OVERALL EMOTIONAL STATE"
        trend_label = "Tendance" if fr else "Trend"
        start_label = "Debut" if fr else "Start"
        end_label = "Fin" if fr else "End"

        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            f"║           {title_text:<56}     ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  {score_label}: {score}%{' ' * (40 - len(str(score)))}║",
            f"║  [{bar}]{' ' * (62 - bar_len)}  ║",
            f"║  {report['score_message'][:62]}{' ' * max(0, 63 - len(report['score_message']))}║",
            "╚══════════════════════════════════════════════════════════════════════╝", "",
            f"┌─ {emo_title} ──────────────────────────────────────────┐",
            f"│  Dominant: {report['dominant_emotion']:<55}│",
            f"│  {trend_label}: {report['trend_direction']:<55}│",
            f"│  {start_label}: {report['early_avg']}/100  →  {end_label}: {report['late_avg']}/100{' ' * 23}│",
            "└──────────────────────────────────────────────────────────────────────┘", "",
        ]
        if report["risk_moments"]:
            risk_title = "MOMENTS DE RISQUE" if fr else "RISK MOMENTS"
            lines.extend([f"┌-  {risk_title} -------------------------------------------------------┐"])
            for r in report["risk_moments"]:
                turn_label = "Tour" if fr else "Turn"
                emo_label = "Emotion" if fr else "Emotion"
                lines.append(f"|  {turn_label} {r['turn']}: {r['hcp_text'][:50]}{' ' * max(0, 51 - len(r['hcp_text'][:50]))}|")
                lines.append(f"|         -> {emo_label}: {r['emotion']:<45}|")
            lines.extend(["└---------------------------------------------------------------------┘", ""])
        rec_title = "RECOMMANDATIONS POUR LE DELEGUE" if fr else "RECOMMENDATIONS FOR THE REP"
        lines.extend([f"┌-  {rec_title} -------------------------------------------------------┐"])
        for rec in report["recommendations"]:
            lines.append(f"│  [{rec['priority']}] {rec['title'][:52]}{' ' * max(0, 53 - len(rec['title']))}│")
            lines.append(f"│      {rec['description'][:59]}{' ' * max(0, 60 - len(rec['description'][:59]))}│")
            lines.append(f"│{' ' * 68}│")
        lines.extend(["└──────────────────────────────────────────────────────────────────────┘"])
        return "\n".join(lines)

    def _empty_report(self, language: str = "en") -> dict:
        fr = language == "fr"
        return {"score_global": 0, "score_message": "Aucune donnée." if fr else "No data.",
                "total_turns": 0, "dominant_emotion": "Inconnu" if fr else "Unknown",
                "formatted_report": "Aucune donnée." if fr else "No data."}


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 6: PIPELINE ORCHESTRATOR — BILINGUAL
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class CommercialTurnResult:
    turn: int
    delegate_response: str
    transcribed_text: Optional[str] = None
    detected_language: str = "en"


class DSO4CommercialPipeline:
    """Complete DSO4 Commercial Pipeline — Bilingual (FR/EN)."""

    def __init__(self, groq_api_key: str, product_catalog_path: str = "produits_final_complet.xlsx",
                 whisper_model_size: str = "small"):
        self.product_info = self._load_products(product_catalog_path)
        self.stt = RobustWhisperSTT(model_size=whisper_model_size)
        self.sentiment_analyzer = HCPSentimentAnalyzer()
        self.sentiment_postprocessor = PharmaSentimentPostProcessor()
        self.ser_analyzer = HCPSERAnalyzer()
        self.delegate_generator = DelegateResponseGenerator(api_key=groq_api_key, product_info=self.product_info)
        self.report_builder = EngagementReportBuilder()

    def process_text_turn(self, accumulator: EngagementAccumulator, hcp_text: str) -> CommercialTurnResult:
        return self._run_turn(accumulator, hcp_text=hcp_text, hcp_audio=None)

    def process_voice_turn(self, accumulator: EngagementAccumulator, audio_bytes: bytes,
                           filename: str = "audio.webm") -> CommercialTurnResult:
        stt_result = self.stt.transcribe(audio_bytes, filename)
        hcp_text = stt_result.get("text", "")
        lang = stt_result.get("language", "en")
        if not hcp_text:
            fallback = ("I'm sorry, I didn't catch that. Could you repeat?" if lang == "en"
                        else "Je n'ai pas bien compris. Pourriez-vous répéter ?")
            return CommercialTurnResult(turn=accumulator.get_turn_count() + 1,
                                        delegate_response=fallback, transcribed_text="", detected_language=lang)
        return self._run_turn(accumulator, hcp_text=hcp_text, hcp_audio=audio_bytes,
                              transcribed=hcp_text, language=lang)

    def build_report(self, accumulator: EngagementAccumulator) -> dict:
        turns = accumulator.get_all_turns()
        dominant_lang = accumulator.get_dominant_language()
        return self.report_builder.build(turns, language=dominant_lang)

    def _run_turn(self, accumulator: EngagementAccumulator, hcp_text: str,
                  hcp_audio: Optional[bytes] = None, transcribed: Optional[str] = None,
                  language: Optional[str] = None) -> CommercialTurnResult:
        start = time.time()

        # Language detection with continuity
        if language is None:
            try:
                from langdetect import detect
                detected = detect(hcp_text)
                detected_lang = "fr" if detected == "fr" else "en"
                if accumulator.turns:
                    dominant_so_far = accumulator.get_dominant_language()
                    word_count = len(hcp_text.split())
                    if word_count < 8 and detected_lang != dominant_so_far:
                        text_lower = hcp_text.lower()
                        if dominant_so_far == "fr":
                            en_markers = ["the ", "and ", "you ", "your ", "what ", "how ", "why ",
                                          "thank you", "thanks", "please", "can you", "do you",
                                          "i want", "i need", "i have", "my patients"]
                            en_score = sum(1 for m in en_markers if m in text_lower)
                            language = detected_lang if en_score >= 2 else dominant_so_far
                        else:
                            fr_markers = ["le ", "la ", "les ", "je ", "vous ", "nous ",
                                          "merci beaucoup", "d'accord", "très bien", "bonjour",
                                          "comment ", "pourquoi ", "qu'est-ce"]
                            fr_score = sum(1 for m in fr_markers if m in text_lower)
                            language = detected_lang if fr_score >= 2 else dominant_so_far
                    else:
                        language = detected_lang
                else:
                    language = detected_lang
            except Exception:
                language = accumulator.get_dominant_language() if accumulator.turns else "en"

        # Sentiment + calibration
        raw_sentiment = self.sentiment_analyzer.analyze(hcp_text)
        sentiment = self.sentiment_postprocessor.process(hcp_text, raw_sentiment)

        # SER VAD (voice only)
        if hcp_audio is not None:
            vad = self.ser_analyzer.extract(hcp_audio)
        else:
            vad = {"valence": 3.0, "arousal": 3.0, "dominance": 3.0}

        # Generate delegate response
        history = accumulator.get_all_turns()
        delegate_response = self.delegate_generator.generate(
            hcp_text=hcp_text, sentiment_label=sentiment["label"],
            history=history, language=language,
        )

        # Accumulate
        turn_number = accumulator.get_turn_count() + 1
        accumulator.add_turn(turn_number=turn_number, hcp_text=hcp_text,
                             delegate_response=delegate_response, sentiment=sentiment,
                             vad=vad, language=language)

        elapsed = int((time.time() - start) * 1000)
        calib_note = ""
        if sentiment["original_label"] != sentiment["label"]:
            calib_note = f"  [calibrated: {sentiment['original_label']}→{sentiment['label']}]"
        print(f"[Turn {turn_number}] Lang:{language} | Sentiment:{sentiment['label']}{calib_note} | {elapsed}ms")

        return CommercialTurnResult(turn=turn_number, delegate_response=delegate_response,
                                    transcribed_text=transcribed, detected_language=language)

    @staticmethod
    def _load_products(path: str) -> dict:
        df = pd.read_excel(path)
        product_col = None
        for col in df.columns:
            if str(col).strip().lower() in ["produit", "product", "nom", "name"]:
                product_col = col
                break
        if product_col is None:
            raise ValueError(f"No product column found. Columns: {list(df.columns)}")
        product_info = {}
        for _, row in df.iterrows():
            product = str(row.get(product_col, "")).strip().upper()
            if product and product != "NAN":
                product_info[product] = {str(c).strip(): str(row.get(c, "")).strip() for c in df.columns}
        return product_info


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 7: SESSION STORE (completed sessions persistence)
# ═══════════════════════════════════════════════════════════════════════════

class SessionStore:
    """Persists completed DSO4 commercial sessions to JSON files for admin review."""

    def __init__(self, data_dir: str = "sessions"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def save(self, session_id: str, hcp_id: str, hcp_name: str, hcp_specialty: str,
             report: dict) -> str:
        file_path = self.data_dir / f"{session_id}.json"
        record = {
            "session_id": session_id,
            "hcp_id": hcp_id,
            "hcp_name": hcp_name,
            "hcp_specialty": hcp_specialty,
            "date": pd.Timestamp.now().isoformat(),
            "engagement_report": report,
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)
        return str(file_path)

    def load(self, session_id: str) -> Optional[dict]:
        file_path = self.data_dir / f"{session_id}.json"
        if not file_path.exists():
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_report(self, session_id: str) -> Optional[dict]:
        record = self.load(session_id)
        return record.get("engagement_report") if record else None

    def list_all(self, hcp_id: str = None) -> list:
        sessions = []
        for f in sorted(self.data_dir.glob("*.json"), reverse=True):
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                if hcp_id is None or data.get("hcp_id") == hcp_id:
                    sessions.append({
                        "session_id": data["session_id"],
                        "hcp_id": data["hcp_id"],
                        "hcp_name": data["hcp_name"],
                        "hcp_specialty": data.get("hcp_specialty", ""),
                        "date": data["date"],
                        "score_global": data.get("engagement_report", {}).get("score_global", 0),
                    })
        return sessions