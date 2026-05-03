import { useState, useRef, useCallback } from 'react'
import './FileImporter.css'
import useCaptureStore from '../stores/captureStore'
import Toast from './Toast'

const ACCEPTED_TYPES = {
  'text/plain': 'txt',
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
}

const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const WARN_SIZE = 10 * 1024 * 1024 // 10MB

export default function FileImporter() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVariant, setToastVariant] = useState('success')
  const fileInputRef = useRef(null)
  const addItem = useCaptureStore(s => s.addItem)

  const processFile = useCallback(async (file) => {
    setError(null)

    if (file.size > MAX_SIZE) {
      setError(`File too large. Max 50MB.`)
      return
    }

    const isLarge = file.size > WARN_SIZE

    // Text files
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text()
      if (isLarge) {
        setToastMsg(`${file.name} is large (${(file.size/1024/1024).toFixed(1)}MB). Processing anyway...`)
        setToastVariant('info')
        setShowToast(true)
      }
      setPreview({ name: file.name, type: 'txt', content: text, size: file.size })
      return
    }

    // PDF
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setPreview({ name: file.name, type: 'pdf', content: '[PDF content - extraction requires pdf.js]', size: file.size })
      return
    }

    // ePub
    if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
      setPreview({ name: file.name, type: 'epub', content: '[ePub content - extraction requires epub.js]', size: file.size })
      return
    }

    setError(`Unsupported file type: ${file.type || 'unknown'}`)
  }, [])

  const handleFiles = useCallback((files) => {
    if (files.length === 0) return
    processFile(files[0])
  }, [processFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleFileInput = (e) => {
    handleFiles(e.target.files)
  }

  const handleSave = () => {
    if (!preview) return
    addItem({
      content: preview.content,
      title: preview.name,
      type: preview.type === 'pdf' || preview.type === 'epub' ? 'document' : 'idea',
      status: 'inbox',
    })
    setToastMsg('File imported!')
    setToastVariant('success')
    setShowToast(true)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClear = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="file-importer">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${error ? 'has-error' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Upload file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.epub"
          onChange={handleFileInput}
          className="file-input"
          aria-hidden="true"
        />

        <div className="drop-content">
          {isDragging ? (
            <>
              <div className="drop-icon uploading">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
              </div>
              <p className="drop-label">Drop to import</p>
            </>
          ) : (
            <>
              <div className="drop-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                  <path d="M12 12v6"/>
                  <path d="m15 15-3-3-3 3"/>
                </svg>
              </div>
              <p className="drop-label">Drop file or tap to upload</p>
              <p className="drop-hint">TXT, PDF, ePub · Max 50MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="import-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {preview && (
        <div className="file-preview">
          <div className="preview-header">
            <div className="preview-info">
              <span className="preview-name">{preview.name}</span>
              <span className="preview-size">{(preview.size / 1024).toFixed(1)} KB</span>
            </div>
            <span className={`preview-badge ${preview.type}`}>{preview.type.toUpperCase()}</span>
          </div>
          <div className="preview-content">
            <p>{preview.content.slice(0, 200)}{preview.content.length > 200 ? '...' : ''}</p>
          </div>
          <div className="preview-actions">
            <button className="btn-secondary" onClick={handleClear}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save to Library</button>
          </div>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMsg}
          variant={toastVariant}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
