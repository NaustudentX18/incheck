import { useState, useEffect } from 'react'
import './VoiceSelectorSheet.css'
import { KOKORO_VOICES } from '../lib/ttsService'

const RECENT_KEY = 'incheck_recent_voices'

function getRecentVoices() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
}

function saveRecentVoice(voiceId) {
  try {
    const recent = [voiceId, ...getRecentVoices().filter(v => v !== voiceId)].slice(0, 4)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {}
}

export default function VoiceSelectorSheet({ selectedVoice, onSelect, onClose }) {
  const [filter, setFilter] = useState('')
  const [previewing, setPreviewing] = useState(null)
  const [voices, setVoices] = useState(KOKORO_VOICES)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(getRecentVoices())
  }, [])

  // Get Web Speech voices too
  const [speechVoices, setSpeechVoices] = useState([])
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const load = () => setSpeechVoices(window.speechSynthesis.getVoices())
      load()
      window.speechSynthesis.onvoiceschanged = load
    }
  }, [])

  const previewVoice = (voiceId) => {
    if (previewing === voiceId) {
      window.speechSynthesis.cancel()
      setPreviewing(null)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('This is how this voice sounds.')
    utterance.rate = 1
    utterance.pitch = 1
    const v = speechVoices.find(sv => sv.name.includes(voiceId))
    if (v) utterance.voice = v
    utterance.onend = () => setPreviewing(null)
    window.speechSynthesis.speak(utterance)
    setPreviewing(voiceId)
  }

  const handleSelect = (voiceId) => {
    saveRecentVoice(voiceId)
    onSelect(voiceId)
    onClose()
  }

  const filteredVoices = filter
    ? voices.filter(v =>
        v.name.toLowerCase().includes(filter.toLowerCase()) ||
        v.gender.toLowerCase().includes(filter.toLowerCase()) ||
        v.description.toLowerCase().includes(filter.toLowerCase())
      )
    : voices

  const recentVoices = voices.filter(v => recent.includes(v.id))

  return (
    <div className="voice-sheet-overlay" onClick={onClose}>
      <div className="voice-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="Select voice">
        <div className="voice-sheet-header">
          <h2>Select Voice</h2>
          <button className="close-voice-sheet" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="voice-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            placeholder="Search voices..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            autoFocus
            aria-label="Search voices"
          />
        </div>

        <div className="voice-sheet-content">
          {/* Recent voices */}
          {!filter && recentVoices.length > 0 && (
            <section className="voice-section">
              <h3 className="voice-section-title">Recent</h3>
              <div className="voice-grid">
                {recentVoices.map(v => (
                  <button
                    key={v.id}
                    className={`voice-card ${selectedVoice === v.id ? 'active' : ''} ${previewing === v.id ? 'previewing' : ''}`}
                    onClick={() => handleSelect(v.id)}
                    aria-pressed={selectedVoice === v.id}
                  >
                    <div className="voice-card-top">
                      <span className="voice-avatar">{v.gender === 'F' ? '👩' : '👨'}</span>
                      {selectedVoice === v.id && (
                        <span className="voice-check" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="voice-card-name">{v.name}</span>
                    <span className="voice-card-meta">{v.gender} · {v.description}</span>
                    <button
                      className="voice-preview-btn"
                      onClick={e => { e.stopPropagation(); previewVoice(v.id) }}
                      aria-label={`Preview ${v.name}`}
                    >
                      {previewing === v.id ? '⏹' : '▶'}
                    </button>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* All Kokoro voices */}
          <section className="voice-section">
            <h3 className="voice-section-title">{filter ? 'Results' : 'All Voices'}</h3>
            <div className="voice-grid">
              {filteredVoices.map(v => (
                <button
                  key={v.id}
                  className={`voice-card ${selectedVoice === v.id ? 'active' : ''} ${previewing === v.id ? 'previewing' : ''}`}
                  onClick={() => handleSelect(v.id)}
                  aria-pressed={selectedVoice === v.id}
                >
                  <div className="voice-card-top">
                    <span className="voice-avatar">{v.gender === 'F' ? '👩' : '👨'}</span>
                    {selectedVoice === v.id && (
                      <span className="voice-check" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className="voice-card-name">{v.name}</span>
                  <span className="voice-card-meta">{v.gender} · {v.description}</span>
                  <button
                    className="voice-preview-btn"
                    onClick={e => { e.stopPropagation(); previewVoice(v.id) }}
                    aria-label={`Preview ${v.name}`}
                  >
                    {previewing === v.id ? '⏹' : '▶'}
                  </button>
                </button>
              ))}
            </div>
            {filteredVoices.length === 0 && (
              <p className="no-voices">No voices match "{filter}"</p>
            )}
          </section>

          {/* Web Speech voices */}
          {speechVoices.filter(sv => sv.lang.startsWith('en')).length > 0 && (
            <section className="voice-section">
              <h3 className="voice-section-title">System Voices</h3>
              <div className="voice-grid">
                {speechVoices.filter(sv => sv.lang.startsWith('en')).slice(0, 12).map((sv, i) => (
                  <button
                    key={sv.name}
                    className={`voice-card ${selectedVoice === sv.name ? 'active' : ''}`}
                    onClick={() => handleSelect(sv.name)}
                    aria-pressed={selectedVoice === sv.name}
                  >
                    <div className="voice-card-top">
                      <span className="voice-avatar">🎙️</span>
                      {selectedVoice === sv.name && (
                        <span className="voice-check" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="voice-card-name">{sv.name.split(' ')[0]}</span>
                    <span className="voice-card-meta">{sv.lang}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
