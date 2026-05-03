import { useState, useEffect, useRef, useCallback } from 'react'
import { ttsService, KOKORO_VOICES } from '../lib/ttsService'
import VoiceSelectorSheet from './VoiceSelectorSheet'
import './TTSReader.css'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

const SLEEP_OPTIONS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
  { label: 'End of chapter', minutes: -1 },
]

function splitIntoSections(content) {
  if (!content) return []
  const paras = content.split(/\n\n+/)
  return paras.filter(p => p.trim().length > 20)
}

export default function TTSReader({ item, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentSection, setCurrentSection] = useState(0)
  const [showPronunciation, setShowPronunciation] = useState(false)
  const [pronunciations, setPronunciations] = useState({})
  const [newPronWord, setNewPronWord] = useState('')
  const [newPronunciation, setNewPronunciation] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('af_bella')
  const [backend, setBackend] = useState('Initializing...')
  const [showVoiceSheet, setShowVoiceSheet] = useState(false)
  const [showSleepMenu, setShowSleepMenu] = useState(false)
  const [sleepTimer, setSleepTimer] = useState(null)
  const [sleepLeft, setSleepLeft] = useState(0)
  const [bookmarks, setBookmarks] = useState([])
  const [showBookmarks, setShowBookmarks] = useState(false)

  const isPlayingRef = useRef(false)
  const sleepIntervalRef = useRef(null)
  const content = item?.content || ''

  const sections = splitIntoSections(content)
  const totalSections = sections.length || 1

  // Initialize TTS on mount
  useEffect(() => {
    ttsService.init().then(() => {
      setBackend(ttsService.getBackendName())
    })
  }, [])

  // Load bookmarks from localStorage
  useEffect(() => {
    if (!item?.id) return
    try {
      const saved = localStorage.getItem(`bookmarks_${item.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setBookmarks(parsed.bookmarks || [])
        if (parsed.lastSection != null) {
          setCurrentSection(parsed.lastSection)
        }
      }
    } catch {}
  }, [item?.id])

  // Save bookmarks
  useEffect(() => {
    if (!item?.id) return
    try {
      localStorage.setItem(`bookmarks_${item.id}`, JSON.stringify({
        bookmarks,
        lastSection: currentSection,
      }))
    } catch {}
  }, [bookmarks, currentSection, item?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsService.stop()
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current)
    }
  }, [])

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimer == null || sleepTimer === -1) {
      if (sleepIntervalRef.current) {
        clearInterval(sleepIntervalRef.current)
        sleepIntervalRef.current = null
      }
      return
    }
    setSleepLeft(sleepTimer * 60)
    sleepIntervalRef.current = setInterval(() => {
      setSleepLeft(prev => {
        if (prev <= 1) {
          clearInterval(sleepIntervalRef.current)
          sleepIntervalRef.current = null
          ttsService.stop()
          setIsPlaying(false)
          isPlayingRef.current = false
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current)
    }
  }, [sleepTimer])

  const speakSection = useCallback(async (text) => {
    setIsLoading(true)
    setIsPlaying(true)
    isPlayingRef.current = true

    try {
      let processedText = text
      Object.entries(pronunciations).forEach(([word, pron]) => {
        processedText = processedText.replace(new RegExp(word, 'gi'), pron)
      })

      ttsService.setVoice(selectedVoice)
      ttsService.setSpeed(speed)
      await ttsService.speak(processedText)
    } catch (error) {
      console.error('TTS error:', error)
    } finally {
      setIsLoading(false)
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }, [selectedVoice, speed, pronunciations])

  const togglePlay = async () => {
    if (isPlaying || isPlayingRef.current) {
      ttsService.stop()
      setIsPlaying(false)
    } else {
      await speakSection(sections[currentSection])
    }
  }

  const nextSection = async () => {
    if (currentSection < totalSections - 1) {
      const next = currentSection + 1
      setCurrentSection(next)
      if (isPlaying) {
        ttsService.stop()
        await speakSection(sections[next])
      }
    }
  }

  const prevSection = async () => {
    if (currentSection > 0) {
      const prev = currentSection - 1
      setCurrentSection(prev)
      if (isPlaying) {
        ttsService.stop()
        await speakSection(sections[prev])
      }
    }
  }

  const handleSpeedChange = () => {
    const currentIndex = SPEEDS.indexOf(speed)
    const nextIndex = (currentIndex + 1) % SPEEDS.length
    setSpeed(SPEEDS[nextIndex])
  }

  const addPronunciation = () => {
    if (newPronWord && newPronunciation) {
      setPronunciations(prev => ({
        ...prev,
        [newPronWord.toLowerCase()]: newPronunciation,
      }))
      setNewPronWord('')
      setNewPronunciation('')
    }
  }

  const currentVoiceInfo = KOKORO_VOICES.find(v => v.id === selectedVoice) || KOKORO_VOICES[0]

  const addBookmark = () => {
    const bm = {
      id: Date.now(),
      section: currentSection,
      label: sections[currentSection]?.slice(0, 40) || `Section ${currentSection + 1}`,
      addedAt: new Date().toISOString(),
    }
    setBookmarks(prev => [...prev, bm])
  }

  const jumpToBookmark = (section) => {
    setCurrentSection(section)
    setShowBookmarks(false)
  }

  const removeBookmark = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  const formatSleep = (s) => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m`
  }

  return (
    <div className="tts-reader-overlay">
      <div className="tts-reader">
        {/* Header */}
        <header className="reader-header">
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <h2>{item?.title || 'Reader'}</h2>
          <span className="backend-badge">{backend}</span>
        </header>

        {/* Text Display */}
        <div className="reader-content">
          <div className="text-display">
            <p className="reading-text">
              {sections[currentSection] || 'No content to read.'}
            </p>
          </div>

          {/* Section Navigation */}
          <div className="section-nav">
            <button
              className="nav-btn"
              onClick={prevSection}
              disabled={currentSection === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Prev
            </button>
            <span className="section-indicator">
              {currentSection + 1} / {totalSections}
            </span>
            <button
              className="nav-btn"
              onClick={nextSection}
              disabled={currentSection === totalSections - 1}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Player Controls */}
        <div className="player-controls" role="group" aria-label="Playback controls">
          <button className="control-btn skip" onClick={() => ttsService.stop()} aria-label="Stop">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>

          <button className="control-btn play" onClick={togglePlay} disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"/>
            ) : isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>

          <button className="control-btn skip" onClick={nextSection} disabled={currentSection === totalSections - 1} aria-label="Next section">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 18l6-6-6-6"/>
              <rect x="15" y="6" width="2" height="12"/>
            </svg>
          </button>
        </div>

        {/* Voice + Speed Controls */}
        <div className="reader-controls-row">
          <button className="voice-btn" onClick={() => setShowVoiceSheet(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            {currentVoiceInfo.name}
          </button>

          <button className="speed-btn" onClick={handleSpeedChange}>
            {speed}x
          </button>
        </div>

        {/* Sleep Timer + Bookmark */}
        <div className="reader-controls-row">
          <button
            className={`voice-btn ${sleepTimer !== null ? 'active-timer' : ''}`}
            onClick={() => setShowSleepMenu(!showSleepMenu)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {sleepTimer !== null ? formatSleep(sleepLeft) : 'Sleep'}
          </button>

          <button className="voice-btn" onClick={() => setShowBookmarks(!showBookmarks)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
            Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
          </button>

          <button className="speed-btn" onClick={addBookmark}>
            + Bookmark
          </button>
        </div>

        {/* Sleep Timer Menu */}
        {showSleepMenu && (
          <div className="pronunciation-panel">
            <h4>Sleep Timer</h4>
            <p className="pron-hint">Stop playing after...</p>
            <div className="pron-list">
              {SLEEP_OPTIONS.map(opt => (
                <li key={opt.label}>
                  <button
                    className="voice-option"
                    onClick={() => {
                      setSleepTimer(opt.minutes)
                      setShowSleepMenu(false)
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
              {sleepTimer !== null && (
                <li>
                  <button
                    className="voice-option"
                    onClick={() => {
                      setSleepTimer(null)
                      setShowSleepMenu(false)
                    }}
                  >
                    Cancel timer
                  </button>
                </li>
              )}
            </div>
          </div>
        )}

        {/* Bookmarks Panel */}
        {showBookmarks && (
          <div className="pronunciation-panel">
            <h4>Bookmarks</h4>
            {bookmarks.length === 0 ? (
              <p className="pron-hint">No bookmarks yet. Tap "+ Bookmark" to save your spot.</p>
            ) : (
              <ul className="pron-list">
                {bookmarks.map(bm => (
                  <li key={bm.id}>
                    <button
                      className="voice-option"
                      onClick={() => jumpToBookmark(bm.section)}
                    >
                      <span className="voice-name">
                        Section {bm.section + 1}: {bm.label}
                      </span>
                      <button
                        className="pron-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBookmark(bm.id)
                        }}
                      >
                        x
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pronunciation Toggle */}
        <button
          className="pronunciation-toggle"
          onClick={() => setShowPronunciation(!showPronunciation)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          {showPronunciation ? 'Hide' : 'Add'} pronunciation
        </button>

        {/* Pronunciation Panel */}
        {showPronunciation && (
          <div className="pronunciation-panel">
            <h4>Custom pronunciations</h4>
            <p className="pron-hint">Fix how the AI reads tech terms</p>

            <div className="pron-form">
              <input
                type="text"
                placeholder="Word (e.g., npm)"
                value={newPronWord}
                onChange={(e) => setNewPronWord(e.target.value)}
              />
              <input
                type="text"
                placeholder="Pronounce as (e.g., N-P-M)"
                value={newPronunciation}
                onChange={(e) => setNewPronunciation(e.target.value)}
              />
              <button className="add-pron-btn" onClick={addPronunciation}>
                Add
              </button>
            </div>

            {Object.keys(pronunciations).length > 0 && (
              <ul className="pron-list">
                {Object.entries(pronunciations).map(([word, pron]) => (
                  <li key={word}>
                    <strong>{word}</strong> → {pron}
                    <button
                      className="pron-remove"
                      onClick={() => setPronunciations(prev => {
                        const next = {...prev}
                        delete next[word]
                        return next
                      })}
                    >x</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showVoiceSheet && (
          <VoiceSelectorSheet
            selectedVoice={selectedVoice}
            onSelect={setSelectedVoice}
            onClose={() => setShowVoiceSheet(false)}
          />
        )}
      </div>
    </div>
  )
}
