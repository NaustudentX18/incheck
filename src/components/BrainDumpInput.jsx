import { useState, useRef, useEffect, useCallback } from 'react'
import './BrainDumpInput.css'
import useCaptureStore from '../stores/captureStore'
import Toast from './Toast'

const MAX_CHARS = 2000

// Inline sub-components for voice and file modes
function VoiceMode() {
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
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        await new Promise(r => setTimeout(r, 1500))
        setCurrentTranscript(getRandomDump())
        await new Promise(r => setTimeout(r, 800))
        setExtractedTasks(extractTasks(getRandomDump()))
        setIsProcessing(false)
        setShowResult(true)
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        setDuration(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setShowResult(false)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      setError('Mic access denied.')
    }
  }, [])

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleToggle = () => isRecording ? stopRecording() : startRecording()

  const saveCapture = () => {
    addItem({ content: currentTranscript, type: 'voice', status: 'inbox', tasks: extractedTasks })
    setShowResult(false)
    setCurrentTranscript('')
    setExtractedTasks([])
  }

  const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div className="voice-mode-inner">
      {error && <div className="voice-error" role="alert">{error}</div>}

      <button
        className={`record-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={handleToggle}
        disabled={isProcessing}
        aria-label={isRecording ? 'Stop' : 'Record'}
      >
        {isProcessing ? <span className="spinner" /> :
         isRecording ? <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> :
         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
        <div className="record-state-area">
          {isProcessing ? <span>Thinking...</span> :
           isRecording ? <><span className="recording-label">Recording</span><span className="record-duration">{fmt(duration)}</span></> :
           <span>Tap to talk</span>}
        </div>
        {isRecording && <span className="pulse-ring" />}
      </button>

      {showResult && (
        <div className="capture-result">
          <p className="transcript-text">{currentTranscript}</p>
          {extractedTasks.length > 0 && (
            <ul className="task-list">{extractedTasks.map((t,i) => <li key={i}>{t}</li>)}</ul>
          )}
          <div className="result-actions">
            <button className="btn-secondary" onClick={() => setShowResult(false)}>Discard</button>
            <button className="btn-primary" onClick={saveCapture}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FileMode() {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const fileInputRef = useRef(null)
  const addItem = useCaptureStore(s => s.addItem)

  const processFile = async (file) => {
    setError(null)
    if (file.size > 50 * 1024 * 1024) { setError('Max 50MB.'); return }
    const text = file.type === 'text/plain' || file.name.endsWith('.txt') ? await file.text() : `[${file.name}]`
    setPreview({ name: file.name, content: text, size: file.size })
  }

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]) }
  const handleSave = () => {
    addItem({ content: preview.content, title: preview.name, type: 'document', status: 'inbox' })
    setPreview(null); setShowToast(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="file-mode-inner">
      <div className={`drop-zone ${isDragging ? 'dragging' : ''}`} onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.epub" onChange={(e) => processFile(e.target.files[0])} className="file-input" />
        <div className="drop-content">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/></svg>
          <p>{isDragging ? 'Drop to import' : 'Drop file or tap'}</p>
          <p className="drop-hint">TXT · PDF · ePub · 50MB max</p>
        </div>
      </div>
      {error && <div className="import-error" role="alert">{error}</div>}
      {preview && (
        <div className="file-preview">
          <div className="preview-header">
            <span className="preview-name">{preview.name}</span>
            <span className="preview-size">{(preview.size/1024).toFixed(0)}KB</span>
          </div>
          <p className="preview-snippet">{preview.content.slice(0,120)}...</p>
          <div className="preview-actions">
            <button className="btn-secondary" onClick={() => setPreview(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
      {showToast && <Toast message="File imported!" variant="success" onClose={() => setShowToast(false)} />}
    </div>
  )
}

// Exported BrainDumpInput with mode tabs
export default function BrainDumpInput() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState('text')
  const [showToast, setShowToast] = useState(false)
  const textareaRef = useRef(null)
  const addItem = useCaptureStore(s => s.addItem)
  const items = useCaptureStore(s => s.items)

  const charCount = text.length
  const isOverLimit = charCount > MAX_CHARS
  const canSend = text.trim().length > 0 && !isOverLimit

  useEffect(() => {
    if (mode === 'text' && textareaRef.current) textareaRef.current.focus()
  }, [mode])

  const handleSend = useCallback(() => {
    if (!canSend) return
    addItem({ content: text.trim(), type: 'idea', status: 'inbox' })
    setText('')
    setShowToast(true)
    textareaRef.current?.focus()
  }, [canSend, text, addItem])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend() }
  }

  const lastItem = items[0]

  return (
    <div className="brain-dump-input">
      <header className="dump-header">
        <h1>Brain Dump</h1>
        <p className="dump-subtitle">Just get it out. I&apos;ll help organize.</p>
      </header>

      <div className="mode-tabs" role="tablist">
        {['text','voice','file'].map(m => (
          <button key={m} role="tab" aria-selected={mode === m}
            className={`mode-tab ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
            {m === 'text' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/></svg>}
            {m === 'voice' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
            {m === 'file' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>}
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {mode === 'text' && (
        <div className="text-input-area">
          <div className="textarea-wrapper">
            <textarea ref={textareaRef} className={`dump-textarea ${isOverLimit ? 'over-limit' : ''}`}
              placeholder="Dump your brain here... everything on your mind, no structure needed."
              value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
              rows={8} maxLength={MAX_CHARS + 100} aria-label="Brain dump" />
            <div className="textarea-footer">
              <span className={`char-count ${isOverLimit ? 'over' : charCount > MAX_CHARS * 0.9 ? 'warn' : ''}`}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>
          </div>
          <div className="input-actions">
            <span className="keyboard-hint"><kbd>⌘</kbd><kbd>↵</kbd> to send</span>
            <button className="send-btn" onClick={handleSend} disabled={!canSend} aria-label="Save capture">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              Save
            </button>
          </div>
        </div>
      )}

      {mode === 'voice' && <VoiceMode />}
      {mode === 'file' && <FileMode />}

      {lastItem && (
        <div className="last-capture" aria-live="polite">
          <span className="last-label">Just captured</span>
          <p className="last-preview">{lastItem.content.slice(0, 80)}...</p>
        </div>
      )}

      {showToast && <Toast message="Captured!" variant="success" onClose={() => setShowToast(false)} />}
    </div>
  )
}

// Helper functions for VoiceMode inline component
function getRandomDump() {
  const dumps = [
    "Fix the auth middleware bug before the release. Also add dark mode toggle to settings. Write tests for the user service with Vitest. Schedule the design team meeting about the dashboard.",
    "The database schema migration for user profiles needs to happen first. Then add the preferences endpoint. Use React Query for the dashboard data. Look into the memory leak issue in Chrome DevTools.",
  ]
  return dumps[Math.floor(Math.random() * dumps.length)]
}

function extractTasks(text) {
  const patterns = [/need to\s+([^.]+)/gi, /should\s+([^.]+)/gi, /have to\s+([^.]+)/gi, /add\s+([^.]+)/gi,
    /fix\s+([^.]+)/gi, /write\s+([^.]+)/gi, /schedule\s+([^.]+)/gi, /look into\s+([^.]+)/gi]
  const tasks = []
  patterns.forEach(p => { let m; while ((m = p.exec(text)) !== null) { const t = m[1].trim(); if (t.length > 5 && t.length < 100) tasks.push(t.charAt(0).toUpperCase() + t.slice(1)) } })
  return tasks.slice(0, 5)
}
