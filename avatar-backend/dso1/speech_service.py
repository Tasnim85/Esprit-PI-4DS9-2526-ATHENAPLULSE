# ============================================================================
# PROFESSIONAL SPEECH-TO-TEXT SERVICE
# ============================================================================
# Production-ready voice recognition for HCPs and delegates
# ============================================================================

import numpy as np
import pyaudio
import whisper
import torch
import tempfile
import wave
import time
import os
from typing import Optional, Tuple, Dict, Any

# ============================================================================
# AUDIO RECORDER
# ============================================================================

class ProfessionalAudioRecorder:
    """Production-grade audio recorder with VAD and noise calibration"""
    
    def __init__(self, sample_rate: int = 16000, channels: int = 1, chunk_size: int = 1024):
        self.sample_rate = sample_rate
        self.channels = channels
        self.chunk_size = chunk_size
        self.format = pyaudio.paInt16
        
    def _get_input_device(self, pa: pyaudio.PyAudio) -> int:
        """Automatically select the best input device"""
        default_device = pa.get_default_input_device_info()
        if default_device['maxInputChannels'] > 0:
            return default_device['index']
        
        for i in range(pa.get_device_count()):
            info = pa.get_device_info_by_index(i)
            if int(info.get('maxInputChannels', 0)) > 0:
                return i
        raise RuntimeError("No input device found")
    
    def _calculate_noise_floor(self, stream, duration: float = 0.8) -> float:
        """Calibrate noise floor from ambient silence"""
        rms_values = []
        chunks = int(duration * self.sample_rate / self.chunk_size)
        
        for _ in range(chunks):
            data = stream.read(self.chunk_size, exception_on_overflow=False)
            audio = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            rms = np.sqrt(np.mean(np.square(audio)))
            rms_values.append(rms)
        
        noise_floor = float(np.median(rms_values)) if rms_values else 0.0
        return max(noise_floor, 0.005)
    
    def record_utterance(
        self,
        max_duration: float = 10.0,
        listen_timeout: float = 8.0,
        min_speech_duration: float = 0.5,
        silence_duration: float = 1.0,
        energy_multiplier: float = 2.5,
        show_progress: bool = True
    ) -> np.ndarray:
        """Records a single utterance with smart VAD"""
        pa = pyaudio.PyAudio()
        stream = None
        
        try:
            device_index = self._get_input_device(pa)
            stream = pa.open(
                format=self.format,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.chunk_size
            )
            
            if show_progress:
                print("   🔇 Calibrating ambient noise...", end='', flush=True)
            noise_floor = self._calculate_noise_floor(stream)
            threshold = max(0.008, noise_floor * energy_multiplier)
            if show_progress:
                print(f" threshold: {threshold:.4f}")
            
            start_wait = time.time()
            speech_frames = []
            speech_started = False
            last_speech_time = None
            speech_start_time = None
            
            while True:
                if not speech_started and (time.time() - start_wait) > listen_timeout:
                    raise RuntimeError("No speech detected")
                
                data = stream.read(self.chunk_size, exception_on_overflow=False)
                audio_chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
                energy = np.sqrt(np.mean(np.square(audio_chunk)))
                
                now = time.time()
                is_speech = energy >= threshold
                
                if is_speech and not speech_started:
                    speech_started = True
                    speech_start_time = now
                    last_speech_time = now
                    if show_progress:
                        print("   🎤 Speech detected", flush=True)
                
                if speech_started:
                    speech_frames.append(data)
                    if is_speech:
                        last_speech_time = now
                    
                    if last_speech_time and (now - last_speech_time) >= silence_duration:
                        break
                    if (now - speech_start_time) >= max_duration:
                        break
                
                if show_progress and not speech_started:
                    print(".", end='', flush=True)
            
            if not speech_started or len(speech_frames) == 0:
                raise RuntimeError("No speech captured")
            
            audio_data = b''.join(speech_frames)
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            duration = len(audio_array) / self.sample_rate
            if duration < min_speech_duration:
                raise RuntimeError(f"Speech too short ({duration:.2f}s)")
            
            return audio_array
            
        finally:
            if stream:
                stream.stop_stream()
                stream.close()
            pa.terminate()


# ============================================================================
# WHISPER TRANSCRIBER
# ============================================================================

class ProfessionalWhisperTranscriber:
    """Production-grade Whisper transcriber with medical optimization"""
    
    MEDICAL_PROMPT = """French or English medical consultation. Patient describes symptoms.
Symptômes: acné, peau sèche, chute de cheveux, rougeurs, rides, fatigue, stress, digestion, douleur, jambes lourdes, vergetures, cicatrices, pellicules, transpiration, allergie, immunité, ménopause.
Symptoms: acne, dry skin, hair loss, redness, wrinkles, fatigue, stress, digestion, pain, heavy legs, stretch marks, scars, dandruff, sweating, allergy, immunity, menopause.
Speak clearly, one symptom at a time."""
    
    def __init__(self, model_size: str = 'small', model_path: str = 'whisper_model'):
        self.model_size = model_size
        self.model_path = model_path
        self.model = None
        self._load_model()
    
    def _load_model(self):
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"   🎤 Loading Whisper {self.model_size} on {device}...")
        self.model = whisper.load_model(self.model_size, device=device, download_root=self.model_path)
        print(f"   ✅ Model ready")
    
    def transcribe(self, audio_array: np.ndarray, language: Optional[str] = None) -> Dict[str, Any]:
        """Transcribe audio to text with medical optimization"""
        result = self.model.transcribe(
            audio_array,
            language=language,
            task='transcribe',
            fp16=False,
            initial_prompt=self.MEDICAL_PROMPT,
            temperature=0.0,
            condition_on_previous_text=False,
            no_speech_threshold=0.6,
            compression_ratio_threshold=2.4,
            logprob_threshold=-1.0,
        )
        
        return {
            'text': result['text'].strip(),
            'language': result['language'],
            'confidence': 1.0 - result.get('no_speech_prob', 0.0),
            'segments': result.get('segments', [])
        }


# ============================================================================
# SPEECH-TO-TEXT SERVICE
# ============================================================================

class SpeechToTextService:
    """Complete professional speech-to-text service for HCPs"""
    
    def __init__(self, whisper_model_size: str = 'small', whisper_model_path: str = 'whisper_model'):
        self.recorder = ProfessionalAudioRecorder()
        self.transcriber = ProfessionalWhisperTranscriber(whisper_model_size, whisper_model_path)
    
    def record_and_transcribe(
        self,
        max_duration: float = 10.0,
        min_speech_duration: float = 0.5,
        silence_duration: float = 1.0,
        retries: int = 2
    ) -> Dict[str, Any]:
        """Complete pipeline: record → transcribe → validate"""
        for attempt in range(retries):
            try:
                audio = self.recorder.record_utterance(
                    max_duration=max_duration,
                    listen_timeout=8.0,
                    min_speech_duration=min_speech_duration,
                    silence_duration=silence_duration,
                    show_progress=(attempt == 0)
                )
                
                result = self.transcriber.transcribe(audio)
                
                if not result['text'] or len(result['text']) < 2:
                    continue
                if result['language'] not in ['fr', 'en']:
                    continue
                
                return {
                    'success': True,
                    'text': result['text'],
                    'language': result['language'],
                    'confidence': result['confidence'],
                    'error': None
                }
                
            except RuntimeError as e:
                if attempt == retries - 1:
                    return {
                        'success': False,
                        'text': '',
                        'language': None,
                        'confidence': 0.0,
                        'error': str(e)
                    }
                continue
        
        return {
            'success': False,
            'text': '',
            'language': None,
            'confidence': 0.0,
            'error': 'Max retries exceeded'
        }
    
    def transcribe_audio_file(self, audio_bytes: bytes) -> Dict[str, Any]:
        """Transcribe pre-recorded audio file (for API endpoint)"""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
            
            with wave.open(tmp_path, 'rb') as wf:
                frames = wf.readframes(wf.getnframes())
                audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            
            os.unlink(tmp_path)
            result = self.transcriber.transcribe(audio)
            
            return {
                'success': True,
                'text': result['text'],
                'language': result['language'],
                'confidence': result['confidence'],
                'error': None
            }
            
        except Exception as e:
            return {
                'success': False,
                'text': '',
                'language': None,
                'confidence': 0.0,
                'error': str(e)
            }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_speech_service = None

def get_speech_service(whisper_model_size: str = 'small', whisper_model_path: str = 'whisper_model'):
    """Get or create singleton speech service instance"""
    global _speech_service
    if _speech_service is None:
        _speech_service = SpeechToTextService(whisper_model_size, whisper_model_path)
    return _speech_service