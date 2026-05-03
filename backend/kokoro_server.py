#!/usr/bin/env python3
"""
Kokoro TTS Server for ADHD Vibe App

Run locally on Pi 5 or any server:
    pip install kokoro soundfile flask flask-cors
    python kokoro_server.py

API:
    POST /tts    {"text": "...", "voice": "af_bella", "speed": 1.0}
    GET  /voices  -> list available voices
    GET  /health  -> health check
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import soundfile as sf

app = Flask(__name__)
CORS(app)

# Kokoro pipeline (lazy loaded)
PIPELINE = None

def get_pipeline():
    global PIPELINE
    if PIPELINE is None:
        print("Loading Kokoro model... (first run downloads ~82MB)")
        try:
            from kokoro import KPipeline
            PIPELINE = KPipeline(lang_code='a')
            print("Kokoro loaded successfully!")
        except ImportError:
            print("ERROR: Kokoro not installed. Run: pip install kokoro soundfile")
            return None
    return PIPELINE

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'engine': 'kokoro',
        'model_loaded': get_pipeline() is not None
    })

@app.route('/voices', methods=['GET'])
def voices():
    voices = [
        {'id': 'af_bella', 'name': 'Bella', 'gender': 'F', 'lang': 'American', 'style': 'Warm narration'},
        {'id': 'af_nicole', 'name': 'Nicole', 'gender': 'F', 'lang': 'American', 'style': 'Clear technical'},
        {'id': 'af_sarah', 'name': 'Sarah', 'gender': 'F', 'lang': 'American', 'style': 'Professional'},
        {'id': 'af_sky', 'name': 'Sky', 'gender': 'F', 'lang': 'American', 'style': 'Youthful'},
        {'id': 'af_heart', 'name': 'Heart', 'gender': 'F', 'lang': 'American', 'style': 'Expressive'},
        {'id': 'am_michael', 'name': 'Michael', 'gender': 'M', 'lang': 'American', 'style': 'Steady calm'},
        {'id': 'am_adam', 'name': 'Adam', 'gender': 'M', 'lang': 'American', 'style': 'Clear reliable'},
        {'id': 'am_fenston', 'name': 'Fenston', 'gender': 'M', 'lang': 'American', 'style': 'British formal'},
        {'id': 'bf_emma', 'name': 'Emma', 'gender': 'F', 'lang': 'British', 'style': 'UK warm'},
        {'id': 'bf_heart', 'name': 'Heart', 'gender': 'F', 'lang': 'British', 'style': 'UK expressive'},
        {'id': 'bm_george', 'name': 'George', 'gender': 'M', 'lang': 'British', 'style': 'UK authoritative'},
        {'id': 'bm_lewis', 'name': 'Lewis', 'gender': 'M', 'lang': 'British', 'style': 'UK gentle'},
    ]
    return jsonify({'voices': voices})

@app.route('/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text', '')
    voice = data.get('voice', 'af_bella')
    speed = data.get('speed', 1.0)
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    pipeline = get_pipeline()
    if pipeline is None:
        return jsonify({'error': 'Kokoro not installed'}), 500
    
    try:
        # Get language code from voice prefix
        lang_code = 'b' if voice.startswith('bf_') or voice.startswith('bm_') else 'a'
        
        # Generate speech
        segments = list(pipeline(text, voice=voice, speed=speed))
        
        # Combine all audio segments
        all_audio = []
        for gs, ps, audio in segments:
            all_audio.append(audio)
        
        if not all_audio:
            return jsonify({'error': 'No audio generated'}), 500
        
        combined = sum(all_audio) if len(all_audio) > 1 else all_audio[0]
        
        # Convert to WAV
        buffer = io.BytesIO()
        sf.write(buffer, combined, 24000, format='WAV')
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='audio/wav',
            as_attachment=False,
            download_name='output.wav'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Kokoro TTS Server")
    print("=" * 40)
    print("POST /tts    - Generate speech")
    print("GET  /voices - List voices")
    print("GET  /health - Health check")
    print("=" * 40)
    app.run(host='0.0.0.0', port=8080, debug=False)