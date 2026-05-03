/**
 * TTS Service — Kokoro Integration
 * 
 * Architecture:
 * - Primary: Local Kokoro server (runs on Pi 5)
 * - Fallback: fal.ai hosted Kokoro (free tier)
 * - Last resort: Web Speech API (robotic but works)
 * 
 * Kokoro TTS: MOS 4.2, Apache 2.0, 100% free
 * https://github.com/hexgrad/kokoro
 */

// TTS backends ranked by quality
const BACKENDS = {
  KOKORO_LOCAL: 'kokoro_local',
  KOKORO_FAL: 'kokoro_fal', 
  WEB_SPEECH: 'web_speech'
}

// Voice presets (Kokoro voices)
export const KOKORO_VOICES = [
  { id: 'af_bella', name: 'Bella', gender: 'F', description: 'Warm, narration' },
  { id: 'af_nicole', name: 'Nicole', gender: 'F', description: 'Clear, technical' },
  { id: 'af_sarah', name: 'Sarah', gender: 'F', description: 'Professional' },
  { id: 'af_sky', name: 'Sky', gender: 'F', description: 'Youthful' },
  { id: 'am_michael', name: 'Michael', gender: 'M', description: 'Steady, calm' },
  { id: 'am_adam', name: 'Adam', gender: 'M', description: 'Clear, reliable' },
  { id: 'am_fenston', name: 'Fenston', gender: 'M', description: 'British, formal' },
  { id: 'bf_emma', name: 'Emma', gender: 'F', description: 'UK accent' },
  { id: 'bf_heart', name: 'Heart', gender: 'F', description: 'UK, warm' },
  { id: 'bm_george', name: 'George', gender: 'M', description: 'UK accent' },
  { id: 'bm_lewis', name: 'Lewis', gender: 'M', description: 'UK, clear' },
]

// Default voice
const DEFAULT_VOICE = 'af_bella'

class TTSService {
  constructor() {
    this.backend = null
    this.currentVoice = DEFAULT_VOICE
    this.speed = 1.0
    this.volume = 1.0
    this.initialized = false
    this.audioContext = null
    this.audioQueue = []
    this.isPlaying = false
  }

  /**
   * Initialize TTS - detect best available backend
   */
  async init() {
    if (this.initialized) return

    // Check for local Kokoro server
    try {
      const response = await fetch('http://localhost:8080/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(500)
      })
      if (response.ok) {
        this.backend = BACKENDS.KOKORO_LOCAL
        console.log('🎙️ Kokoro TTS: Local server detected')
        this.initialized = true
        return
      }
    } catch {
      // Local not available
    }

    // Try fal.ai hosted Kokoro
    try {
      const response = await fetch('https://api.fal.ai/models/hexgrad/kokoro', {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      })
      if (response.ok) {
        this.backend = BACKENDS.KOKORO_FAL
        console.log('🎙️ Kokoro TTS: Using fal.ai hosted')
        this.initialized = true
        return
      }
    } catch {
      // fal.ai not available
    }

    // Fallback to Web Speech API
    if ('speechSynthesis' in window) {
      this.backend = BACKENDS.WEB_SPEECH
      console.log('🎙️ TTS: Using Web Speech API (fallback)')
    } else {
      throw new Error('No TTS backend available')
    }

    this.initialized = true
  }

  /**
   * Set voice
   */
  setVoice(voiceId) {
    this.currentVoice = voiceId
  }

  /**
   * Set speed (0.5 - 2.0)
   */
  setSpeed(speed) {
    this.speed = Math.max(0.5, Math.min(2.0, speed))
  }

  /**
   * Speak text
   */
  async speak(text) {
    if (!this.initialized) await this.init()

    switch (this.backend) {
      case BACKENDS.KOKORO_LOCAL:
        return this.speakKokoroLocal(text)
      case BACKENDS.KOKORO_FAL:
        return this.speakKokoroFal(text)
      default:
        return this.speakWebSpeech(text)
    }
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.backend === BACKENDS.WEB_SPEECH) {
      window.speechSynthesis.cancel()
    }
    this.isPlaying = false
    this.audioQueue = []
  }

  /**
   * Pause (Web Speech only)
   */
  pause() {
    if (this.backend === BACKENDS.WEB_SPEECH) {
      window.speechSynthesis.pause()
    }
  }

  /**
   * Resume (Web Speech only)
   */
  resume() {
    if (this.backend === BACKENDS.WEB_SPEECH) {
      window.speechSynthesis.resume()
    }
  }

  /**
   * Local Kokoro server
   */
  async speakKokoroLocal(text) {
    const response = await fetch('http://localhost:8080/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        voice: this.currentVoice,
        speed: this.speed 
      })
    })
    
    if (!response.ok) throw new Error('Kokoro request failed')
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    await this.playAudio(url)
    URL.revokeObjectURL(url)
  }

  /**
   * fal.ai hosted Kokoro
   */
  async speakKokoroFal(text) {
    // fal.ai has free tier for Kokoro
    // Sign up at https://fal.ai
    const FAL_KEY = localStorage.getItem('fal_api_key')
    
    if (!FAL_KEY) {
      console.warn('fal.ai API key not set, falling back to Web Speech')
      return this.speakWebSpeech(text)
    }

    const response = await fetch('https://fal.run/hexgrad/kokoro', {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: this.currentVoice,
        speed: this.speed
      })
    })

    if (!response.ok) throw new Error('fal.ai request failed')
    
    // fal.ai returns audio URL
    const { audio_url } = await response.json()
    
    await this.playAudio(audio_url)
  }

  /**
   * Web Speech API (fallback)
   */
  speakWebSpeech(text) {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = this.speed
      utterance.pitch = 1.0
      utterance.volume = this.volume

      // Try to find a better voice
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('female') || v.name.includes('Samantha'))
      )
      if (preferred) utterance.voice = preferred

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      window.speechSynthesis.speak(utterance)
    })
  }

  /**
   * Play audio from URL
   */
  playAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.src = url
      audio.playbackRate = this.speed
      
      audio.onended = () => resolve()
      audio.onerror = (e) => reject(e)
      
      audio.play()
    })
  }

  /**
   * Get available backend name
   */
  getBackendName() {
    switch (this.backend) {
      case BACKENDS.KOKORO_LOCAL: return 'Kokoro (Local)'
      case BACKENDS.KOKORO_FAL: return 'Kokoro (fal.ai)'
      case BACKENDS.WEB_SPEECH: return 'Web Speech API'
      default: return 'Unknown'
    }
  }
}

// Singleton
export const ttsService = new TTSService()

export default ttsService