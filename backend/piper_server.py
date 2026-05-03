#!/usr/bin/env python3
"""
Piper TTS Server for ADHD Vibe App

Run:
    source venv/bin/activate
    python backend/piper_server.py

API:
    POST /tts    {"text": "...", "voice": "en_US-lessac-medium", "speed": 1.0}
    GET  /voices -> list available voices
    GET  /health -> health check
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import subprocess
import os
import tempfile

app = Flask(__name__)
CORS(app)

# Piper installation path
PIPER_CMD = None

def find_piper():
    global PIPER_CMD
    venv_path = os.path.join(os.path.dirname(__file__), '..', 'venv')
    
    # Check common locations
    paths = [
        os.path.join(venv_path, 'bin', 'piper'),
        '/usr/local/bin/piper',
        '/usr/bin/piper',
    ]
    
    for p in paths:
        if os.path.exists(p):
            PIPER_CMD = p
            return True
    
    # Try using piper from python module
    try:
        import piper_tts
        PIPER_CMD = 'piper'  # Will work if PATH includes venv/bin
        return True
    except:
        pass
    
    return False

if not find_piper():
    print("WARNING: Piper not found. Install with: pip install piper-tts")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'engine': 'piper',
        'found': PIPER_CMD is not None
    })

@app.route('/voices', methods=['GET'])
def voices():
    # Piper voices - downloadable from HuggingFace
    voices = [
        {'id': 'en_US-lessac-medium', 'name': 'Amy (Medium)', 'gender': 'F', 'lang': 'English', 'quality': 'medium'},
        {'id': 'en_US-lessac-high', 'name': 'Amy (High)', 'gender': 'F', 'lang': 'English', 'quality': 'high'},
        {'id': 'en_US-libritts-high', 'name': 'LibriTTS (High)', 'gender': 'F', 'lang': 'English', 'quality': 'high'},
        {'id': 'en_GB-alba-medium', 'name': 'Alba (Scottish)', 'gender': 'F', 'lang': 'English UK', 'quality': 'medium'},
        {'id': 'en_GB-southern-english-medium', 'name': 'Southern English', 'gender': 'F', 'lang': 'English UK', 'quality': 'medium'},
        {'id': 'en_GB-Jenny_Direct-medium', 'name': 'Jenny Direct', 'gender': 'F', 'lang': 'English UK', 'quality': 'medium'},
    ]
    return jsonify({'voices': voices})

@app.route('/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text', '')
    voice = data.get('voice', 'en_US-lessac-medium')
    speed = float(data.get('speed', 1.0))

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # Map voice ID to model path
        voice_paths = {
            'en_US-lessac-medium': '/home/pi/.local/share/piper/en_US-lessac-medium.onnx',
        }

        model_path = voice_paths.get(voice, voice)

        # Create temp file for output
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            output_path = f.name

        # Build piper command
        cmd = ['piper', '--model', model_path, '--output_file', output_path]

        if speed != 1.0:
            cmd.extend(['--length_scale', str(1.0 / speed)])

        # Run piper
        result = subprocess.run(
            cmd,
            input=text,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            return jsonify({'error': result.stderr or 'Piper failed'}), 500

        # Read output
        with open(output_path, 'rb') as f:
            audio_data = f.read()

        # Cleanup
        os.unlink(output_path)

        # Return audio
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/wav',
            as_attachment=False,
            download_name='output.wav'
        )

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'TTS timeout'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download-voice', methods=['POST'])
def download_voice():
    """Download a voice model"""
    data = request.json
    voice_id = data.get('voice', '')
    
    if not voice_id:
        return jsonify({'error': 'No voice specified'}), 400
    
    # Download from HuggingFace
    hf_url = f"https://huggingface.co/rhasspy/piper/resolve/main/{voice_id}.onnx"
    
    try:
        # Download model
        model_path = os.path.expanduser(f"~/.local/share/piper/{voice_id}.onnx")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        if not os.path.exists(model_path):
            subprocess.run(['curl', '-sSL', '-o', model_path, hf_url], check=True)
        
        return jsonify({'status': 'downloaded', 'path': model_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Piper TTS Server")
    print("=" * 40)
    print(f"Piper command: {PIPER_CMD or 'using module'}")
    print("POST /tts    - Generate speech")
    print("GET  /voices - List voices")
    print("GET  /health - Health check")
    print("=" * 40)
    app.run(host='0.0.0.0', port=8080, debug=False)