import { useState, useEffect, useRef, useCallback } from 'react'
import './Focus.css'
import Confetti from './Confetti'
import useCaptureStore from '../stores/captureStore'
import { llmService } from '../lib/llmService'

const DURATIONS = [
  { label: '15 min', minutes: 15, work: 15, break: 5 },
  { label: '25 min', minutes: 25, work: 25, break: 5 },
  { label: '50 min', minutes: 50, work: 50, break: 10 },
  { label: '90 min', minutes: 90, work: 90, break: 15 },
]

const RESISTANCE_FACES = [
  { id: 5, emoji: '😤', label: 'On fire' },
  { id: 4, emoji: '🙂', label: 'Feeling good' },
  { id: 3, emoji: '😐', label: 'Neutral' },
  { id: 2, emoji: '😩', label: 'Struggling' },
  { id: 1, emoji: '🥱', label: 'Zombie mode' },
]

const TIPS_WORK = [
  'One thing at a time. Voice-dump distractions, then let them go.',
  'Your brain wants to wander. Gently bring it back. No judgment.',
  'Deep work is rare. Protect it fiercely.',
  'The mess will still be there later. Right now: this.',
  'Five more minutes. Then a break. You can do this.',
]

const TIPS_BREAK = [
  'Walk. Stretch. Water. No screens.',
  'You earned this. Let your brain decompress.',
  'Look out a window. 20 feet, 20 seconds.',
  'Snack. Bathroom. Move your body.',
]

export default function Focus({ items }) {
  // === STATES ===
  const [view, setView] = useState('setup') // 'setup' | 'active' | 'celebrate'
  const [focusSlots, setFocusSlots] = useState([null, null, null])
  const [availableItems, setAvailableItems] = useState([])
  const [showPicker, setShowPicker] = useState(null) // which slot (0,1,2)
  const [currentSlot, setCurrentSlot] = useState(0) // which slot we're working on
  const [durationIdx, setDurationIdx] = useState(1) // 25 min default
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [resistance, setResistance] = useState(3)
  const [sessionCount, setSessionCount] = useState(0)
  const [tadaCount, setTaDaCount] = useState(0)
  const [confettiKey, setConfettiKey] = useState(0)
  const [showTip, setShowTip] = useState(true)
  const [companionMessage, setCompanionMessage] = useState('')
  const [showCompanion, setShowCompanion] = useState(false)

  const intervalRef = useRef(null)
  const timerRef = useRef(null)
  const updateItem = useCaptureStore(s => s.updateItem)
  const settings = useCaptureStore(s => s.settings)

  const dur = DURATIONS[durationIdx]
  const activeItem = focusSlots[currentSlot]

  // pauseTimer needs to be defined early so handleTimerEnd can reference it
  const pauseTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  // Timer end handler — depends on live closure values
  const handleTimerEnd = useCallback(() => {
    pauseTimer()
    if (!isBreak) {
      setSessionCount(c => c + 1)
      if (activeItem) {
        updateItem(activeItem.id, { status: 'completed' })
      }
      setTaDaCount(c => {
        const next = c + 1
        if (next <= 3) {
          setConfettiKey(k => k + 1)
          setTimeout(() => setView('celebrate'), 100)
        }
        return next
      })
      setIsBreak(true)
      setTimeLeft(dur.break * 60)
    } else {
      setIsBreak(false)
      setTimeLeft(dur.work * 60)
      if (currentSlot < 2 && focusSlots[currentSlot + 1]) {
        setCurrentSlot(s => s + 1)
      }
      setView('setup')
    }
  }, [isBreak, activeItem, currentSlot, dur, focusSlots, updateItem])

  // Load available items
  useEffect(() => {
    const pool = items.filter(i => {
      if (i.status === 'completed') return false
      if (i.status === 'parking') return false
      return (i.subtasks?.length > 0) || (i.content?.length > 0)
    })
    setAvailableItems(pool)
  }, [items])

  // Timer interval cleanup
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const startTimer = useCallback(() => {
    setIsRunning(true)
    setShowTip(false)
    // If AI companion is on, fetch first message after showing view
    if (settings.focusCompanion) {
      setTimeout(() => fetchCompanion('work'), 3000)
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          handleTimerEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [handleTimerEnd, settings.focusCompanion, fetchCompanion])

  const pickForSlot = (slotIdx, item) => {
    setFocusSlots(prev => {
      const next = [...prev]
      next[slotIdx] = item
      return next
    })
    setShowPicker(null)
    if (slotIdx === currentSlot) setView('active')
  }

  const removeFromSlot = (slotIdx) => {
    setFocusSlots(prev => {
      const next = [...prev]
      next[slotIdx] = null
      return next
    })
    setView('setup')
  }

  const completedSlots = focusSlots.filter(Boolean).length

  const resetTimer = () => {
    pauseTimer()
    setTimeLeft(dur.work * 60)
    setIsBreak(false)
    setView('setup')
  }

  const skipBreak = () => {
    pauseTimer()
    setIsBreak(false)
    setTimeLeft(dur.work * 60)
  }

  const abandonSession = () => {
    pauseTimer()
    setView('setup')
    setTimeLeft(dur.work * 60)
    setIsBreak(false)
  }

  const fetchCompanion = useCallback(async (phase = 'encouragement') => {
    try {
      const msg = await llmService.getCompanionMessage({
        phase,
        sessionCount,
        resistance,
        taskTitle: activeItem?.title || activeItem?.content?.slice(0, 50),
      })
      if (msg) {
        setCompanionMessage(msg)
        setShowCompanion(true)
      }
    } catch (err) {
      console.warn('[Focus] Companion message failed:', err)
    }
  }, [sessionCount, resistance, activeItem])

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const progress = isBreak
    ? ((dur.break * 60 - timeLeft) / (dur.break * 60)) * 100
    : ((dur.work * 60 - timeLeft) / (dur.work * 60)) * 100

  const circumference = 2 * Math.PI * 54

  const currentTip = isBreak
    ? TIPS_BREAK[Math.floor(Date.now() / 1000) % TIPS_BREAK.length]
    : TIPS_WORK[Math.floor(Date.now() / 1000) % TIPS_WORK.length]

  const overflowed = focusSlots.filter(Boolean).length > 3

  return (
    <div className="focus">
      <Confetti key={confettiKey} active={view === 'celebrate'} />

      {/* === HEADER === */}
      <header className="focus-header">
        <h1>Focus</h1>
        <div className="focus-stats">
          {tadaCount > 0 && (
            <span className="tada-badge">
              <span aria-hidden="true">🎉</span> {tadaCount} Ta-Da{tadaCount !== 1 ? 's' : ''} today
            </span>
          )}
          {sessionCount > 0 && (
            <span className="session-badge">
              {sessionCount} session{sessionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* === SETUP VIEW: Morning Ritual === */}
      {view === 'setup' && (
        <div className="setup-view">
          <div className="morning-ritual">
            <h2>Pick your 3 focuses</h2>
            <p className="ritual-sub">What matters most today?</p>
          </div>

          <div className="focus-slots">
            {[0, 1, 2].map(slotIdx => (
              <div key={slotIdx} className={`focus-slot ${focusSlots[slotIdx] ? 'filled' : 'empty'} ${currentSlot === slotIdx ? 'current' : ''}`}>
                {focusSlots[slotIdx] ? (
                  <>
                    <div className="slot-content">
                      <span className="slot-num">{slotIdx + 1}</span>
                      <div className="slot-info">
                        <p className="slot-title">
                          {focusSlots[slotIdx].title ||
                            focusSlots[slotIdx].content?.slice(0, 40) || 'Untitled'}
                        </p>
                        {focusSlots[slotIdx].subtasks?.length > 0 && (
                          <span className="slot-subtasks">
                            {focusSlots[slotIdx].subtasks.filter(s => s.done).length}/{focusSlots[slotIdx].subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="slot-actions">
                      {currentSlot === slotIdx && !isBreak ? (
                        <button
                          className="start-focus-btn"
                          onClick={() => setView('active')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"/>
                          </svg>
                          Start
                        </button>
                      ) : null}
                      <button
                        className="slot-remove"
                        onClick={() => removeFromSlot(slotIdx)}
                        aria-label="Remove from focus"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    className="slot-empty-btn"
                    onClick={() => setShowPicker(slotIdx)}
                    aria-label={`Select item for slot ${slotIdx + 1}`}
                  >
                    <span className="slot-num muted">{slotIdx + 1}</span>
                    <span className="slot-placeholder">+ Add focus</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {overflowed && (
            <div className="overflow-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              More than 3 — defer extras to Parking Lot?
            </div>
          )}

          {/* Duration picker */}
          <div className="duration-picker">
            {DURATIONS.map((d, i) => (
              <button
                key={d.label}
                className={`duration-btn ${durationIdx === i ? 'active' : ''}`}
                onClick={() => { setDurationIdx(i); setTimeLeft(d.work * 60) }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Item picker sheet */}
          {showPicker !== null && (
            <div className="picker-sheet" role="dialog" aria-label="Select item">
              <div className="picker-header">
                <h3>Choose for slot {showPicker + 1}</h3>
                <button onClick={() => setShowPicker(null)} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <ul className="picker-list">
                {availableItems.length === 0 ? (
                  <li className="picker-empty">No items in inbox. Go capture something!</li>
                ) : availableItems.map(item => (
                  <li key={item.id}>
                    <button
                      className="picker-item"
                      onClick={() => pickForSlot(showPicker, item)}
                    >
                      <p>{item.title || item.content?.slice(0, 50) || 'Untitled'}</p>
                      <span className="picker-meta">
                        {item.subtasks?.length > 0 ? `${item.subtasks.length} subtasks` : item.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* === ACTIVE VIEW === */}
      {view === 'active' && (
        <div className="active-view">
          {/* Resistance picker */}
          <div className="resistance-picker" role="group" aria-label="How are you feeling?">
            {RESISTANCE_FACES.map(f => (
              <button
                key={f.id}
                className={`resistance-face ${resistance === f.id ? 'active' : ''}`}
                onClick={() => setResistance(f.id)}
                aria-label={f.label}
                aria-pressed={resistance === f.id}
                title={f.label}
              >
                {f.emoji}
              </button>
            ))}
          </div>

          {/* Current task */}
          {activeItem && (
            <div className="active-task">
              <p className="active-task-title">
                {activeItem.title || activeItem.content?.slice(0, 60)}
              </p>
              <span className="slot-indicator">Focus {currentSlot + 1}</span>
            </div>
          )}

          {/* Timer */}
          <div className={`timer-display ${isBreak ? 'break' : ''}`}>
            <svg className="progress-ring" viewBox="0 0 120 120" aria-hidden="true">
              <circle className="progress-bg" cx="60" cy="60" r="54" fill="none" strokeWidth="6" />
              <circle
                className="progress-fill"
                cx="60" cy="60" r="54" fill="none" strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="timer-inner">
              <span className="time-text" aria-live="polite" aria-atomic="true">
                {formatTime(timeLeft)}
              </span>
              <span className="timer-label">{isBreak ? 'Break' : 'Focus'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="timer-controls">
            {!isRunning ? (
              <button className="start-btn" onClick={startTimer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                {isBreak ? 'Start break' : 'Lock in'}
              </button>
            ) : (
              <button className="pause-btn" onClick={pauseTimer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pause
              </button>
            )}
            {isBreak && (
              <button className="skip-btn" onClick={skipBreak}>Skip break</button>
            )}
          </div>

          {/* AI Companion or Tip */}
          {showTip && (
            <div className="focus-tip" aria-live="polite">
              {settings.focusCompanion && showCompanion && companionMessage ? (
                <div className="companion-message">
                  <div className="companion-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                    </svg>
                    AI Companion
                    <button
                      className="companion-dismiss"
                      onClick={() => setShowCompanion(false)}
                      aria-label="Hide companion"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <p>{companionMessage}</p>
                  <button
                    className="companion-refresh"
                    onClick={() => fetchCompanion('encouragement')}
                    aria-label="Get new message"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M8 16H3v5"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <p>{currentTip}</p>
              )}
            </div>
          )}

          {/* Bottom actions */}
          <div className="active-actions">
            <button className="abandon-btn" onClick={abandonSession}>
              Abandon
            </button>
            <button className="reset-btn" onClick={resetTimer}>
              Reset
            </button>
          </div>
        </div>
      )}

      {/* === CELEBRATE VIEW === */}
      {view === 'celebrate' && (
        <div className="celebrate-view">
          <div className="tada-icon" aria-hidden="true">🎉</div>
          <h2 className="tada-title">Ta-Da!</h2>
          <p className="tada-sub">Session complete. You crushed it.</p>

          {activeItem && (
            <div className="tada-item">
              <p>{activeItem.title || activeItem.content?.slice(0, 50)}</p>
              <span className="completed-tag">Completed</span>
            </div>
          )}

          <div className="tada-actions">
            {currentSlot < 2 && focusSlots[currentSlot + 1] ? (
              <button className="next-btn" onClick={() => {
                setCurrentSlot(s => s + 1)
                setIsBreak(false)
                setTimeLeft(dur.work * 60)
                setView('active')
              }}>
                Next focus →
              </button>
            ) : (
              <button className="next-btn" onClick={() => {
                setView('setup')
                setIsBreak(false)
                setTimeLeft(dur.work * 60)
              }}>
                Back to setup
              </button>
            )}
            <button className="skip-btn" onClick={() => {
              setView('setup')
              setTimeLeft(dur.work * 60)
              setIsBreak(false)
            }}>
              Done for now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
