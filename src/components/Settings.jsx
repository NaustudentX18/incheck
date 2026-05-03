import { useState, useEffect } from 'react'
import './Settings.css'
import useCaptureStore from '../stores/captureStore'
import TTSReader from './TTSReader'
import { llmService } from '../lib/llmService'

const ONBOARD_KEY = 'incheck_onboarded'

const DURATIONS_MAP = [
  { label: '15 min', value: 0 },
  { label: '25 min', value: 1 },
  { label: '50 min', value: 2 },
  { label: '90 min', value: 3 },
]

const STEPS = [
  { icon: 'mic', title: 'Voice capture', desc: 'Tap the mic, ramble, hit save. Your thoughts are already organized.' },
  { icon: 'library', title: 'Library', desc: 'Everything lives here. Tap any item to open it.' },
  { icon: 'timer', title: 'Focus mode', desc: 'Pick 3 things. One at a time. Timer on. Distractions off.' },
  { icon: 'speaker', title: 'Read aloud', desc: 'Tap the speaker on any item. AI reads it to you.' },
]

function StepIcon({ name }) {
  const icons = {
    mic: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    library: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>,
    timer: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="M22 6 19 3"/><path d="M12 2v2"/></svg>,
    speaker: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  }
  return icons[name] || null
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  )
}

function SettingsRow({ label, children, hint }) {
  return (
    <div className="setting-row">
      <div className="setting-label">
        <span className="setting-name">{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  )
}

export default function Settings() {
  const storeSettings = useCaptureStore(s => s.settings) || {}
  const updateSettings = useCaptureStore(s => s.updateSettings)

  // Voice settings
  const [defaultVoice, setDefaultVoice] = useState(storeSettings.defaultVoice || 'af_bella')
  const [defaultSpeed, setDefaultSpeed] = useState(storeSettings.defaultSpeed ?? 1)

  // Focus settings
  const [defaultDuration, setDefaultDuration] = useState(storeSettings.defaultDuration ?? 1)
  const [tickSound, setTickSound] = useState(storeSettings.tickSound ?? false)
  const [focusCompanion, setFocusCompanion] = useState(storeSettings.focusCompanion ?? false)

  // Capture settings
  const [autoOrganize, setAutoOrganize] = useState(storeSettings.autoOrganize ?? false)

  // Appearance settings
  const [fontSize, setFontSize] = useState(storeSettings.fontSize ?? 16)
  const [reducedMotion, setReducedMotion] = useState(storeSettings.reducedMotion ?? false)

  // Modals / onboarding
  const [showOnboard, setShowOnboard] = useState(false)
  const [onboardStep, setOnboardStep] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [showFalKey, setShowFalKey] = useState(false)
  const [falKeyInput, setFalKeyInput] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showReader, setShowReader] = useState(false)
  const [clearStep, setClearStep] = useState(0) // 0 = confirm, 1 = type "delete"
  const [ollamaUrl, setOllamaUrl] = useState('')
  const [llmStatus, setLlmStatus] = useState('checking')
  const [showOllamaInput, setShowOllamaInput] = useState(false)
  const [ollamaInput, setOllamaInput] = useState('')
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')

  // TTS preview
  const [testItem] = useState({
    id: 'settings-test',
    title: 'Welcome to InCheck',
    content: 'This is how text-to-speech works. Your captures are read back to you in a natural voice.\n\nSwipe left to go back. Tap the play button to hear it read aloud.',
    type: 'document',
    priority: 2,
    status: 'inbox',
    tags: [],
    createdAt: new Date().toISOString(),
  })

  // Check on mount — only show onboarding once
  useEffect(() => {
    if (!localStorage.getItem(ONBOARD_KEY)) {
      setShowOnboard(true)
    }
  }, [])

  // Check LLM status on mount
  useEffect(() => {
    const checkLlm = async () => {
      const ok = await llmService.ping()
      setLlmStatus(ok ? 'connected' : 'offline')
      if (ok) {
        const availableModels = await llmService.models
        setModels(availableModels || [])
      }
    }
    checkLlm()
    const unsub = llmService.onStatusChange((status) => {
      if (status === 'loading') setLlmStatus('loading')
      else if (status === 'error') setLlmStatus('offline')
    })
    return unsub
  }, [])

  // Sync settings to store on change
  const saveVoice = (voice, speed) => {
    updateSettings({ defaultVoice: voice, defaultSpeed: speed })
  }
  const saveFocus = (duration, tick, companion) => {
    updateSettings({ defaultDuration: duration, tickSound: tick, focusCompanion: companion })
  }
  const saveCapture = (autoOrg) => {
    updateSettings({ autoOrganize: autoOrg })
  }
  const saveAppearance = (size, motion) => {
    updateSettings({ fontSize: size, reducedMotion: motion })
    document.documentElement.style.fontSize = size ? `${size}px` : ''
  }

  const handleOnboardNext = () => {
    if (onboardStep < STEPS.length - 1) {
      setOnboardStep(s => s + 1)
    } else {
      localStorage.setItem(ONBOARD_KEY, '1')
      setShowOnboard(false)
    }
  }

  const handleOnboardSkip = () => {
    localStorage.setItem(ONBOARD_KEY, '1')
    setShowOnboard(false)
  }

  const handleFalKeySave = () => {
    if (falKeyInput.trim()) {
      localStorage.setItem('fal_api_key', falKeyInput.trim())
      updateSettings({ falApiKey: falKeyInput.trim() })
    }
    setShowFalKey(false)
    setFalKeyInput('')
  }

  const handleExport = () => {
    const allData = {
      items: useCaptureStore.getState().items,
      settings: useCaptureStore.getState().settings,
      bookmarks: Object.keys(localStorage)
        .filter(k => k.startsWith('bookmarks_'))
        .reduce((acc, k) => { acc[k] = localStorage.getItem(k); return acc }, {}),
      exportedAt: new Date().toISOString(),
      version: '0.3.0',
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incheck-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const count = Array.isArray(data.items) ? data.items.length : 0
        setImportPreview({ data, count })
      } catch {
        setImportPreview({ error: 'Invalid JSON file' })
      }
    }
    reader.readAsText(file)
  }

  const handleImportConfirm = () => {
    if (!importPreview?.data) return
    const { data } = importPreview
    if (Array.isArray(data.items)) {
      const store = useCaptureStore.getState()
      data.items.forEach(item => {
        if (!store.items.find(i => i.id === item.id)) {
          store.addItem(item)
        }
      })
    }
    if (data.bookmarks) {
      Object.entries(data.bookmarks).forEach(([k, v]) => localStorage.setItem(k, v))
    }
    setShowImport(false)
    setImportFile(null)
    setImportPreview(null)
  }

  const handleClearData = () => {
    if (clearStep === 0) {
      setClearStep(1)
    } else {
      localStorage.clear()
      window.location.reload()
    }
  }

  // === ONBOARDING ===
  if (showOnboard) {
    return (
      <div className="settings">
        <div className="onboard">
          <div className="onboard-progress" aria-hidden="true">
            {STEPS.map((_, i) => (
              <div key={i} className={`onboard-dot ${i === onboardStep ? 'active' : ''} ${i < onboardStep ? 'done' : ''}`} />
            ))}
          </div>
          <div className="onboard-content">
            <div className="onboard-icon" aria-hidden="true"><StepIcon name={STEPS[onboardStep].icon} /></div>
            <h2>{STEPS[onboardStep].title}</h2>
            <p>{STEPS[onboardStep].desc}</p>
          </div>
          <div className="onboard-actions">
            <button className="onboard-skip" onClick={handleOnboardSkip}>Skip tour</button>
            <button className="onboard-next" onClick={handleOnboardNext}>
              {onboardStep === STEPS.length - 1 ? 'Start capturing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showReader) {
    return <TTSReader item={testItem} onClose={() => setShowReader(false)} />
  }

  return (
    <div className="settings">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      {/* === VOICE / TTS === */}
      <section className="settings-section" aria-labelledby="voice-heading">
        <h2 id="voice-heading">Voice &amp; Reading</h2>

        <SettingsRow label="Default voice" hint="Used for reading captures aloud">
          <button className="action-btn inline" onClick={() => setShowReader(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            {defaultVoice}
          </button>
        </SettingsRow>

        <SettingsRow label="Reading speed" hint={defaultSpeed === 1 ? 'Normal' : defaultSpeed < 1 ? 'Slower' : 'Faster'}>
          <div className="speed-input">
            <input
              type="range"
              min="0.5" max="2" step="0.25"
              value={defaultSpeed}
              onChange={e => { setDefaultSpeed(parseFloat(e.target.value)); saveVoice(defaultVoice, parseFloat(e.target.value)) }}
              aria-label="Reading speed"
            />
            <span>{defaultSpeed}x</span>
          </div>
        </SettingsRow>

        <SettingsRow label="Preview TTS">
          <button className="action-btn inline accent" onClick={() => setShowReader(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Try reading
          </button>
        </SettingsRow>
      </section>

      {/* === FOCUS === */}
      <section className="settings-section" aria-labelledby="focus-heading">
        <h2 id="focus-heading">Focus Mode</h2>

        <SettingsRow label="Default timer" hint="How long each focus session lasts">
          <div className="duration-options">
            {DURATIONS_MAP.map(d => (
              <button
                key={d.label}
                className={`duration-pill ${defaultDuration === d.value ? 'active' : ''}`}
                onClick={() => { setDefaultDuration(d.value); saveFocus(d.value, tickSound, focusCompanion) }}
                aria-pressed={defaultDuration === d.value}
              >
                {d.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow label="Tick sound" hint="Subtle clock tick during session">
          <Toggle checked={tickSound} onChange={v => { setTickSound(v); saveFocus(defaultDuration, v, focusCompanion) }} label="Tick sound" />
        </SettingsRow>

        <SettingsRow label="Focus companion" hint="AI voice encouragement between sessions">
          <Toggle checked={focusCompanion} onChange={v => { setFocusCompanion(v); saveFocus(defaultDuration, tickSound, v) }} label="Focus companion" />
        </SettingsRow>
      </section>

      {/* === CAPTURE === */}
      <section className="settings-section" aria-labelledby="capture-heading">
        <h2 id="capture-heading">Capture</h2>

        <SettingsRow label="Auto-organize" hint="Run AI organize after every capture">
          <Toggle checked={autoOrganize} onChange={v => { setAutoOrganize(v); saveCapture(v) }} label="Auto-organize" />
        </SettingsRow>
      </section>

      {/* === APPEARANCE === */}
      <section className="settings-section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>

        <SettingsRow label="Font size" hint={`${fontSize}px`}>
          <div className="speed-input">
            <input
              type="range"
              min="14" max="20" step="1"
              value={fontSize}
              onChange={e => { setFontSize(parseInt(e.target.value)); saveAppearance(parseInt(e.target.value), reducedMotion) }}
              aria-label="Font size"
            />
            <span>{fontSize}px</span>
          </div>
        </SettingsRow>

        <SettingsRow label="Dark mode">
          <span className="badge">Always on</span>
        </SettingsRow>

        <SettingsRow label="Reduced motion" hint="Minimize animations throughout">
          <Toggle checked={reducedMotion} onChange={v => { setReducedMotion(v); saveAppearance(fontSize, v) }} label="Reduced motion" />
        </SettingsRow>
      </section>

      {/* === AI SERVICES === */}
      <section className="settings-section" aria-labelledby="ai-heading">
        <h2 id="ai-heading">AI Services</h2>

        {/* Ollama connection status */}
        <div className="llm-status-card">
          <div className="llm-status-icon">
            {llmStatus === 'connected' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            )}
            {llmStatus === 'offline' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            )}
            {llmStatus === 'checking' && (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            )}
            {llmStatus === 'loading' && (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            )}
          </div>
          <div className="llm-status-info">
            <span className="llm-status-label">
              {llmStatus === 'connected' ? 'Ollama connected' : llmStatus === 'offline' ? 'Ollama offline' : 'Checking...'}
            </span>
            {models.length > 0 && (
              <span className="llm-status-models">{models.length} model{models.length !== 1 ? 's' : ''} available</span>
            )}
          </div>
          <button
            className="llm-retry-btn"
            onClick={async () => {
              setLlmStatus('checking')
              const ok = await llmService.ping()
              setLlmStatus(ok ? 'connected' : 'offline')
            }}
            aria-label="Retry connection"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </button>
        </div>

        {/* Ollama URL config */}
        <SettingsRow label="Ollama URL" hint="Local LLM server address">
          {showOllamaInput ? (
            <div className="input-row">
              <input
                id="ollama-url" type="url" placeholder="http://localhost:11434"
                value={ollamaInput}
                onChange={e => setOllamaInput(e.target.value)}
                autoFocus
                aria-label="Ollama server URL"
              />
              <button className="action-btn save-btn" onClick={() => {
                if (ollamaInput) {
                  // Update llmService URL directly
                  llmService._url = ollamaInput
                  localStorage.setItem('ollama_url', ollamaInput)
                }
                setShowOllamaInput(false)
                setLlmStatus('checking')
                setTimeout(async () => {
                  const ok = await llmService.ping()
                  setLlmStatus(ok ? 'connected' : 'offline')
                }, 1500)
              }}>Save</button>
            </div>
          ) : (
            <button className="action-btn inline" onClick={() => { setOllamaInput(localStorage.getItem('ollama_url') || 'http://localhost:11434'); setShowOllamaInput(true) }}>
              {localStorage.getItem('ollama_url') || 'http://localhost:11434'}
            </button>
          )}
        </SettingsRow>

        {/* Model selector */}
        {models.length > 0 && (
          <SettingsRow label="Main model" hint="Used for organizing captures">
            <select
              className="model-select"
              value={selectedModel}
              onChange={e => {
                setSelectedModel(e.target.value)
                updateSettings({ model: e.target.value })
              }}
              aria-label="Select LLM model"
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </SettingsRow>
        )}

        <SettingsRow label="Kokoro fal.ai key" hint="Free cloud TTS fallback when Pi 5 is offline">
          {showFalKey ? (
            <div className="input-row">
              <input
                id="fal-key" type="password" placeholder="sk-..."
                value={falKeyInput}
                onChange={e => setFalKeyInput(e.target.value)}
                autoFocus
                aria-label="fal.ai API key"
              />
              <button className="action-btn save-btn" onClick={handleFalKeySave}>Save</button>
            </div>
          ) : (
            <button className="action-btn inline" onClick={() => { setFalKeyInput(localStorage.getItem('fal_api_key') || ''); setShowFalKey(true) }}>
              {localStorage.getItem('fal_api_key') ? 'Update key' : 'Add API key'}
            </button>
          )}
        </SettingsRow>
        <p className="section-hint">Ollama powers AI organization. Kokoro TTS runs on your Pi 5 server.</p>
      </section>

      {/* === DATA === */}
      <section className="settings-section" aria-labelledby="data-heading">
        <h2 id="data-heading">Data</h2>

        <SettingsRow label="Export all data">
          <button className="action-btn inline" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </SettingsRow>

        <SettingsRow label="Import data">
          <button className="action-btn inline" onClick={() => setShowImport(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
        </SettingsRow>

        <SettingsRow label="Clear all data">
          {showClearConfirm ? (
            <div className="danger-confirm">
              {clearStep === 0 ? (
                <button className="action-btn danger" onClick={handleClearData}>
                  Clear everything
                </button>
              ) : (
                <div className="danger-type-row">
                  <p>Type <strong>delete</strong> to confirm</p>
                  <input
                    type="text"
                    className="danger-type-input"
                    placeholder="delete"
                    onChange={e => { if (e.target.value === 'delete') handleClearData() }}
                    autoFocus
                    aria-label="Type delete to confirm"
                  />
                  <button className="action-btn inline cancel" onClick={() => { setShowClearConfirm(false); setClearStep(0) }}>Cancel</button>
                </div>
              )}
            </div>
          ) : (
            <button className="action-btn inline danger" onClick={() => setShowClearConfirm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              Clear data
            </button>
          )}
        </SettingsRow>
      </section>

      {/* === ABOUT === */}
      <section className="settings-section about-section">
        <div className="about-logo" aria-hidden="true">V</div>
        <div className="about-info">
          <p className="about-name">InCheck</p>
          <p className="about-version">Version 0.3.0</p>
          <p className="about-tagline">Voice-first capture + AI organization for ADHD brains.</p>
        </div>
      </section>

      <footer className="settings-footer">
        <p>Made for ADHD brains that think faster than fingers can type.</p>
      </footer>

      {/* === IMPORT MODAL === */}
      {showImport && (
        <div className="import-overlay" onClick={() => { setShowImport(false); setImportPreview(null) }}>
          <div className="import-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Import data">
            <div className="import-modal-header">
              <h3>Import Data</h3>
              <button onClick={() => { setShowImport(false); setImportPreview(null) }} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {!importPreview ? (
              <div className="import-drop">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Drop or select a InCheck export (.json)</p>
                <input type="file" accept=".json" onChange={handleImportFile} />
              </div>
            ) : importPreview.error ? (
              <div className="import-error">
                <p>{importPreview.error}</p>
                <button className="action-btn inline" onClick={() => setImportPreview(null)}>Try again</button>
              </div>
            ) : (
              <div className="import-preview">
                <div className="import-count-icon" aria-hidden="true">📥</div>
                <p>Found <strong>{importPreview.count}</strong> capture{importPreview.count !== 1 ? 's' : ''}. Merge into library?</p>
                <div className="import-actions">
                  <button className="action-btn inline cancel" onClick={() => { setShowImport(false); setImportPreview(null) }}>Cancel</button>
                  <button className="action-btn inline save" onClick={handleImportConfirm}>Import</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
