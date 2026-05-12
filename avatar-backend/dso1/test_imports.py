# test_imports.py
try:
    import whisper
    print(f"✅ Whisper version: {whisper.__version__ if hasattr(whisper, '__version__') else 'installed'}")
except ImportError as e:
    print(f"❌ Whisper import error: {e}")

try:
    import pyaudio
    print("✅ PyAudio OK")
except ImportError as e:
    print(f"❌ PyAudio import error: {e}")