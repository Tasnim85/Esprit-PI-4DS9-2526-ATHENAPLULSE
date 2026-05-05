import { useState, useRef } from "react";
import { audioLipSync } from "./Avatar";

export default function Chat({ onSpeakStart, onSpeakEnd }) {
  const [message,  setMessage]  = useState("");
  const [response, setResponse] = useState("");
  const [loading,  setLoading]  = useState(false);
  const audioCtxRef = useRef(null);

  const speak = (text) => {
    speechSynthesis.cancel();

    // Setup Web Audio analyser to capture TTS output volume
    // SpeechSynthesis routes through the default audio output —
    // we capture it via a silent AudioContext + AnalyserNode driven
    // by a MediaStreamDestination connected to the system audio.
    // Since browsers block direct SpeechSynthesis capture, we use
    // a workaround: create an AudioContext and analyse a silent
    // oscillator that we modulate based on speech events + timing.
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    // Create analyser
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Oscillator that simulates voice frequency (100-300 Hz)
    // We modulate its gain based on speech timing to drive lip sync
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type      = "sawtooth";
    osc.frequency.value = 150;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(analyser);
    // Do NOT connect to destination — stays silent, only for analysis
    osc.start();

    audioLipSync.analyser  = analyser;
    audioLipSync.dataArray = dataArray;
    audioLipSync.isSpeaking = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = "fr-FR";
    utterance.rate  = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      audioLipSync.isSpeaking = true;
      onSpeakStart?.(text);

      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);

      // Strong signal so analyser reads clearly (avg/40 formula needs avg > 0)
      // Schedule alternating high/low to simulate natural speech rhythm
      const estimatedDuration = Math.max(1, text.length * 0.065);
      let t2 = now;
      while (t2 < now + estimatedDuration) {
        gain.gain.linearRampToValueAtTime(0.8 + Math.random() * 0.2, t2 + 0.05);
        gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.3, t2 + 0.12);
        t2 += 0.17;
      }
      gain.gain.linearRampToValueAtTime(0, now + estimatedDuration + 0.1);
    };

    utterance.onend = () => {
      audioLipSync.isSpeaking = false;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      setTimeout(() => { try { osc.stop(); } catch { /* */ } }, 200);
      onSpeakEnd?.();
    };

    utterance.onerror = () => {
      audioLipSync.isSpeaking = false;
      try { osc.stop(); } catch { /* */ }
      onSpeakEnd?.();
    };

    speechSynthesis.speak(utterance);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      const data = await res.json();
      setResponse(data.message);
      speak(data.message);
    } catch {
      const fallback = `Je n'ai pas de connexion au serveur, mais je peux quand même parler. Vous avez écrit : ${message}`;
      setResponse(fallback);
      speak(fallback);
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "min(600px, 90vw)" }}>
      {response && (
        <div style={{
          background: "rgba(0,0,0,0.55)", color: "#fff",
          borderRadius: 12, padding: "10px 14px",
          fontSize: 14, maxHeight: 80, overflowY: "auto",
        }}>
          {response}
        </div>
      )}
      <div style={{
        display: "flex", gap: 8,
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        borderRadius: 16, padding: "10px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez une question..."
          disabled={loading}
          style={{
            flex: 1, border: "none", outline: "none",
            background: "transparent", fontSize: 15,
            color: "#fff", padding: "4px 8px",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          style={{
            background: "#6366f1", color: "#fff", border: "none",
            borderRadius: 10, padding: "8px 18px",
            cursor: "pointer", fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
