import { useState, useRef, useCallback } from 'react'
import './VoiceCapture.css'
import useCaptureStore from '../stores/captureStore'

export default function VoiceCapture() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState([])
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const addItem = useCaptureStore(s => s.addItem)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        // Simulate transcription (replace with real STT in production)
        await new Promise(r => setTimeout(r, 1500))
        const mockTranscript = getRandomBrainDump()
        setCurrentTranscript(mockTranscript)

        await new Promise(r => setTimeout(r, 800))
        const tasks = extractTasks(mockTranscript)
        setExtractedTasks(tasks)
        setIsProcessing(false)
        setShowResult(true)

        stream.getTracks().forEach(track => track.stop())
        clearInterval(timerRef.current)
        setDuration(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setShowResult(false)
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      setError('Microphone access denied. Please allow mic permission.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const handleCapture = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const saveCapture = () => {
    addItem({
      content: currentTranscript,
      type: 'voice',
      status: 'inbox',
      tasks: extractedTasks,
    })
    setShowResult(false)
    setCurrentTranscript('')
    setExtractedTasks([])
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="voice-capture">
      <header className="capture-header">
        <h1>Voice Capture</h1>
        <p className="subtitle">Just talk. I&apos;ll transcribe it.</p>
      </header>

      {error && (
        <div className="voice-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <button
        className={`record-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={handleCapture}
        disabled={isProcessing}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isProcessing ? (
          <span className="spinner" aria-hidden="true" />
        ) : isRecording ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        )}

        <div className="record-state-area">
          {isProcessing ? (
            <span className="record-state-label">Thinking...</span>
          ) : isRecording ? (
            <>
              <span className="record-state-label recording-label">Recording</span>
              <span className="record-duration">{formatDuration(duration)}</span>
            </>
          ) : (
            <span className="record-state-label">Tap to talk</span>
          )}
        </div>

        {isRecording && <span className="pulse-ring" aria-hidden="true" />}
      </button>

      {showResult && currentTranscript && (
        <div className="capture-result" role="region" aria-label="Capture result">
          <div className="transcript-section">
            <h3>What you said</h3>
            <p className="transcript-text">{currentTranscript}</p>
          </div>

          {extractedTasks.length > 0 && (
            <div className="tasks-section">
              <h3>Extracted tasks <span className="task-count">{extractedTasks.length}</span></h3>
              <ul className="task-list">
                {extractedTasks.map((task, i) => (
                  <li key={i} className="task-item">
                    <span className="task-checkbox" aria-hidden="true" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="result-actions">
            <button className="btn-secondary" onClick={() => setShowResult(false)}>
              Discard
            </button>
            <button className="btn-primary" onClick={saveCapture}>
              Save to Library
            </button>
          </div>
        </div>
      )}

      <div className="voice-hints">
        <p>Tip: Speak naturally about anything on your mind. Tasks are auto-detected.</p>
      </div>
    </div>
  )
}

function getRandomBrainDump() {
  const dumps = [
    "So I need to fix the auth middleware bug before the release. Also should add dark mode toggle to the settings. And I want to write tests for the user service, maybe use Vitest. Oh and schedule that design team meeting about the dashboard.",
    "The database schema migration for user profiles needs to happen first. Then we can add the preferences endpoint. I've been thinking about using React Query for the dashboard data. Also need to look into that memory leak issue in Chrome DevTools.",
  ]
  return dumps[Math.floor(Math.random() * dumps.length)]
}

function extractTasks(text) {
  const patterns = [
    /need to\s+([^.]+)/gi,
    /should\s+([^.]+)/gi,
    /have to\s+([^.]+)/gi,
    /must\s+([^.]+)/gi,
    /add\s+([^.]+)/gi,
    /fix\s+([^.]+)/gi,
    /write\s+([^.]+)/gi,
    /refactor\s+([^.]+)/gi,
    /schedule\s+([^.]+)/gi,
    /look into\s+([^.]+)/gi,
  ]
  const tasks = []
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const task = match[1].trim()
      if (task.length > 5 && task.length < 100) {
        tasks.push(capitalize(task))
      }
    }
  })
  return tasks.slice(0, 5)
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
