# Kokoro TTS Setup Guide

**Kokoro TTS** — MOS 4.2, Apache 2.0, 100% FREE

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Requirements:**
- `kokoro>=0.8` — The TTS engine
- `soundfile>=0.12` — Audio format handling
- `flask>=3.0` — Web server
- `flask-cors>=4.0` — CORS support

### 2. Run Server

```bash
python backend/kokoro_server.py
```

**First run:** Downloads Kokoro model (~82MB)

### 3. Verify

```bash
curl http://localhost:8080/health
# {"engine": "kokoro", "model_loaded": true, "status": "ok"}

curl http://localhost:8080/voices
# {"voices": [{"id": "af_bella", "name": "Bella", ...}, ...]}
```

## API

### POST /tts

Generate speech from text.

```bash
curl -X POST http://localhost:8080/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice": "af_bella", "speed": 1.0}' \
  --output output.wav
```

**Request:**
```json
{
  "text": "Text to speak",
  "voice": "af_bella",  // voice ID
  "speed": 1.0           // 0.5 - 2.0
}
```

**Response:** WAV audio file

### GET /voices

List available voices.

```json
{
  "voices": [
    {"id": "af_bella", "name": "Bella", "gender": "F", "lang": "American"},
    {"id": "af_nicole", "name": "Nicole", "gender": "F", "lang": "American"},
    {"id": "am_michael", "name": "Michael", "gender": "M", "lang": "American"},
    ...
  ]
}
```

### GET /health

Health check.

## Voice Library

| Voice ID | Name | Gender | Style |
|----------|------|--------|-------|
| af_bella | Bella | F | Warm narration |
| af_nicole | Nicole | F | Clear technical |
| af_sarah | Sarah | F | Professional |
| af_sky | Sky | F | Youthful |
| af_heart | Heart | F | Expressive |
| am_michael | Michael | M | Steady calm |
| am_adam | Adam | M | Clear reliable |
| am_fenston | Fenston | M | British formal |
| bf_emma | Emma | F | UK warm |
| bf_heart | Heart | F | UK expressive |
| bm_george | George | M | UK authoritative |
| bm_lewis | Lewis | M | UK gentle |

## Hardware Requirements

| Hardware | Performance |
|---------|-------------|
| Raspberry Pi 5 | ✅ Real-time, CPU |
| Gaming Laptop (RTX 4090) | 210x real-time |
| Gaming Laptop (RTX 3060) | 30-50x real-time |
| MacBook M1-M3 | 5-10x real-time |
| CPU only (modern) | 2-5x real-time |

## Hosted Alternative (No Setup)

If you don't want to run locally, use **fal.ai** (free tier available):

1. Sign up at https://fal.ai
2. Get API key
3. Store in browser: `localStorage.setItem('fal_api_key', 'your-key')`
4. App automatically uses hosted Kokoro

## Troubleshooting

### "Kokoro not installed"
```bash
pip install kokoro soundfile
```

### "Model download failed"
- First run downloads ~82MB
- Check internet connection
- Try: `python -c "from kokoro import KPipeline; p = KPipeline()"`

### "Audio sounds robotic"
- Kokoro is best-in-class but not perfect
- Try different voices
- Adjust speed (0.8-1.2 usually sounds most natural)

## Performance Tips

1. **Batch requests** — Generate longer chunks, not individual words
2. **Cache common phrases** — Store generated audio for repeated use
3. **Use British voices** (bf_*, bm_*) — Sometimes sound more natural for tech content

## License

Kokoro is Apache 2.0 — free for commercial use, no restrictions.
