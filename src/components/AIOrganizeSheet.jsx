import { useState, useEffect, useRef } from 'react'
import './AIOrganizeSheet.css'
import Sheet from './Sheet'
import useCaptureStore from '../stores/captureStore'
import { Skeleton } from './Skeleton'
import { llmService, useSettings } from '../lib/llmService'

const PRIORITIES = [
  { value: 1, label: 'High', color: 'var(--error)' },
  { value: 2, label: 'Medium', color: 'var(--accent-primary)' },
  { value: 3, label: 'Low', color: 'var(--success)' },
]

export default function AIOrganizeSheet({ item, onClose, onAccept }) {
  const [suggestions, setSuggestions] = useState({
    project: '',
    priority: 2,
    subtasks: [],
    tags: [],
    summary: '',
  })
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [editingProject, setEditingProject] = useState(false)
  const [projectInput, setProjectInput] = useState('')
  const [llmError, setLlmError] = useState(null)
  const updateItem = useCaptureStore(s => s.updateItem)
  const abortRef = useRef(false)

  useEffect(() => {
    abortRef.current = false
    setLoading(true)
    setDone(false)
    setLlmError(null)
    setSuggestions({ project: '', priority: 2, subtasks: [], tags: [], summary: '' })

    let accumulated = { project: '', priority: 2, subtasks: [], tags: [], summary: '' }
    let lastUpdateTime = 0

    const run = async () => {
      try {
        // Use real LLM streaming
        for await (const update of llmService.organize(item.content)) {
          if (abortRef.current) break
          if (update.error) {
            setLlmError(update.error)
            setLoading(false)
            return
          }
          if (update.done) {
            setDone(true)
            setLoading(false)
            continue
          }

          // Rate-limit state updates to every 200ms so we don't thrash React
          const now = Date.now()
          if (now - lastUpdateTime > 200 || update.done) {
            lastUpdateTime = now
            // Only fill in non-empty fields so loading skeletons persist
            const newProject = update.project || accumulated.project
            const newPriority = update.priority || accumulated.priority
            const newSubtasks = update.subtasks?.length ? update.subtasks : accumulated.subtasks
            const newTags = update.tags?.length ? update.tags : accumulated.tags
            const newSummary = update.summary || accumulated.summary
            accumulated = { project: newProject, priority: newPriority, subtasks: newSubtasks, tags: newTags, summary: newSummary }
            setSuggestions({ ...accumulated })
          }
        }
      } catch (err) {
        console.error('[AIOrganize]', err)
        setLlmError('AI unavailable. Check your connection and try again.')
        setLoading(false)
      }
    }

    run()
    return () => { abortRef.current = true }
  }, [item.id])

  const handleAccept = () => {
    updateItem(item.id, {
      project: suggestions.project || undefined,
      priority: suggestions.priority,
      subtasks: suggestions.subtasks,
      tags: suggestions.tags,
      status: 'organized',
    })
    onAccept?.()
    onClose()
  }

  const handleDismiss = () => {
    onClose()
  }

  const toggleSubtask = (id) => {
    setSuggestions(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s)
    }))
  }

  const removeSubtask = (id) => {
    setSuggestions(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }))
  }

  const addSubtask = (text) => {
    if (!text.trim()) return
    setSuggestions(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: `manual-${Date.now()}`, text: text.trim(), done: false }]
    }))
  }

  const removeTag = (tag) => {
    setSuggestions(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleProjectConfirm = () => {
    setSuggestions(prev => ({ ...prev, project: projectInput }))
    setEditingProject(false)
  }

  return (
    <Sheet onClose={onClose} title="AI Organize">
      <div className="ai-sheet">
        <div className="ai-sheet-header">
          <div className="ai-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
              <path d="M9 21h6"/>
              <path d="M12 17v4"/>
            </svg>
          </div>
          <div>
            <h2 className="ai-sheet-title">AI Organize</h2>
            <p className="ai-sheet-subtitle">
              {loading ? 'Thinking...' : done ? 'Done! Review below.' : 'Ready'}
            </p>
          </div>
          {loading && (
            <div className="ai-spinner" aria-hidden="true">
              <span className="spinner" />
            </div>
          )}
        </div>

        {llmError && (
          <div className="ai-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" y2="12"/>
              <line x1="12" y1="16" y2="16.01"/>
            </svg>
            {llmError}
          </div>
        )}

        <div className="ai-suggestions">
          {/* Project */}
          <div className="suggestion-row">
            <label className="suggestion-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/>
              </svg>
              Project
            </label>
            <div className="suggestion-value">
              {loading && !suggestions.project ? (
                <Skeleton width={100} height={20} />
              ) : editingProject ? (
                <div className="project-edit">
                  <input
                    autoFocus
                    value={projectInput}
                    onChange={e => setProjectInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleProjectConfirm()}
                    placeholder="Project name..."
                    aria-label="Project name"
                  />
                  <button onClick={handleProjectConfirm} className="confirm-btn">OK</button>
                </div>
              ) : (
                <button
                  className={`project-chip ${suggestions.project ? '' : 'empty'}`}
                  onClick={() => {
                    setProjectInput(suggestions.project)
                    setEditingProject(true)
                  }}
                >
                  {suggestions.project || '+ Set project'}
                </button>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="suggestion-row">
            <label className="suggestion-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Priority
            </label>
            <div className="priority-pills">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  className={`priority-pill ${suggestions.priority === p.value ? 'active' : ''}`}
                  style={suggestions.priority === p.value ? { borderColor: p.color, color: p.color } : {}}
                  onClick={() => setSuggestions(prev => ({ ...prev, priority: p.value }))}
                  aria-pressed={suggestions.priority === p.value}
                >
                  <span className="priority-dot" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          <div className="suggestion-row column">
            <label className="suggestion-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Subtasks
              {suggestions.subtasks.length > 0 && (
                <span className="pill-count">{suggestions.subtasks.length}</span>
              )}
            </label>
            {loading && suggestions.subtasks.length === 0 ? (
              <div className="subtask-skeletons">
                <Skeleton width="80%" height={20} />
                <Skeleton width="65%" height={20} />
                <Skeleton width="50%" height={20} />
              </div>
            ) : suggestions.subtasks.length === 0 && !loading ? (
              <p className="no-subtasks">No tasks detected</p>
            ) : (
              <ul className="subtask-suggestion-list">
                {suggestions.subtasks.map(st => (
                  <li key={st.id} className={`subtask-suggestion ${st.done ? 'done' : ''}`}>
                    <button
                      className={`subtask-check-btn ${st.done ? 'checked' : ''}`}
                      onClick={() => toggleSubtask(st.id)}
                      aria-label={st.done ? 'Uncheck' : 'Check'}
                    >
                      {st.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    <span>{st.text}</span>
                    <button className="remove-subtask" onClick={() => removeSubtask(st.id)} aria-label="Remove">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="add-subtask-row">
              <input
                type="text"
                placeholder="Add a subtask..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addSubtask(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="subtask-add-input"
                aria-label="Add subtask"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="suggestion-row column">
            <label className="suggestion-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12.7 2.7a1 1 0 0 0-1.41 0L12 2"/>
              </svg>
              Suggested tags
            </label>
            <div className="tags-row">
              {loading && suggestions.tags.length === 0 ? (
                <div className="tag-skeletons">
                  <Skeleton width={60} height={24} circle />
                  <Skeleton width={80} height={24} circle />
                </div>
              ) : suggestions.tags.length === 0 && !loading ? (
                <p className="no-tags">No tags suggested</p>
              ) : (
                suggestions.tags.map(tag => (
                  <button key={tag} className="tag-suggestion" onClick={() => removeTag(tag)}>
                    {tag}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ai-sheet-actions">
          <button className="ai-btn-secondary" onClick={handleDismiss}>
            Dismiss
          </button>
          <button
            className="ai-btn-primary"
            onClick={handleAccept}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Accept All
          </button>
        </div>
      </div>
    </Sheet>
  )
}
