import { useState, useEffect } from 'react'
import './ItemDetail.css'
import useCaptureStore from '../stores/captureStore'
import Badge from './Badge'
import AIOrganizeSheet from './AIOrganizeSheet'
import Toast from './Toast'

const PRIORITIES = [
  { value: 1, label: 'High', color: 'var(--error)' },
  { value: 2, label: 'Medium', color: 'var(--accent-primary)' },
  { value: 3, label: 'Low', color: 'var(--success)' },
]

export default function ItemDetail({ item, onBack, onRead }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title || '')
  const [content, setContent] = useState(item.content || '')
  const [priority, setPriority] = useState(item.priority || 2)
  const [dueDate, setDueDate] = useState(item.dueDate || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(item.tags || [])
  const [subtasks, setSubtasks] = useState(item.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')
  const [showOrganize, setShowOrganize] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const updateItem = useCaptureStore(s => s.updateItem)
  const deleteItem = useCaptureStore(s => s.deleteItem)

  useEffect(() => {
    setTitle(item.title || '')
    setContent(item.content || '')
    setPriority(item.priority || 2)
    setDueDate(item.dueDate || '')
    setTags(item.tags || [])
    setSubtasks(item.subtasks || [])
  }, [item.id])

  const handleSave = () => {
    updateItem(item.id, { title, content, priority, dueDate, tags, subtasks })
    setEditing(false)
  }

  const handleDelete = () => {
    deleteItem(item.id)
    onBack()
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput('')
  }

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag))

  const addSubtask = () => {
    const s = newSubtask.trim()
    if (s) {
      setSubtasks([...subtasks, { id: Date.now(), text: s, done: false }])
      setNewSubtask('')
    }
  }

  const toggleSubtask = (id) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, done: !st.done } : st))
  }

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id))
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="item-detail">
      <header className="detail-header">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back
        </button>
        <div className="detail-actions">
          {editing ? (
            <>
              <button className="action-btn cancel" onClick={() => setEditing(false)}>Cancel</button>
              <button className="action-btn save" onClick={handleSave}>Save</button>
            </>
          ) : (
            <>
              <button className="action-btn ai-organize" onClick={() => setShowOrganize(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                  <path d="M9 21h6"/><path d="M12 17v4"/>
                </svg>
                AI Organize
              </button>
              <button className="action-btn" onClick={() => onRead && onRead(item)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Read
              </button>
              <button className="action-btn edit" onClick={() => setEditing(true)}>Edit</button>
            </>
          )}
        </div>
      </header>

      <div className="detail-content">
        {editing ? (
          <>
            <input
              className="detail-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              aria-label="Title"
            />
            <textarea
              className="detail-body-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={8}
              aria-label="Content"
            />
          </>
        ) : (
          <>
            {title && <h2 className="detail-title">{title}</h2>}
            {content && <p className="detail-body">{content}</p>}
          </>
        )}

        {/* Priority */}
        <div className="detail-section">
          <label className="detail-label">Priority</label>
          <div className="priority-picker">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                className={`priority-btn ${priority === p.value ? 'active' : ''}`}
                style={priority === p.value ? { borderColor: p.color, color: p.color } : {}}
                onClick={() => editing && setPriority(p.value)}
                disabled={!editing}
                aria-pressed={priority === p.value}
              >
                <span className="priority-dot" style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div className="detail-section">
          <label className="detail-label" htmlFor="due-date">Due date</label>
          <input
            id="due-date"
            type="date"
            className="date-input"
            value={dueDate ? dueDate.split('T')[0] : ''}
            onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
            disabled={!editing}
            aria-label="Due date"
          />
        </div>

        {/* Tags */}
        <div className="detail-section">
          <label className="detail-label">Tags</label>
          <div className="tags-area">
            {tags.map(tag => (
              <span key={tag} className="tag-chip">
                {tag}
                {editing && (
                  <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {editing && (
              <div className="tag-input-row">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className="tag-input"
                  aria-label="New tag"
                />
                <button onClick={addTag} className="add-tag-btn">Add</button>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks */}
        <div className="detail-section">
          <label className="detail-label">Subtasks {subtasks.length > 0 && <span className="subtask-progress">{subtasks.filter(s=>s.done).length}/{subtasks.length}</span>}</label>
          {subtasks.length > 0 && (
            <div className="subtask-progress-bar">
              <div className="subtask-fill" style={{ width: `${(subtasks.filter(s=>s.done).length / subtasks.length) * 100}%` }} />
            </div>
          )}
          <ul className="subtask-list">
            {subtasks.map(st => (
              <li key={st.id} className={`subtask-item ${st.done ? 'done' : ''}`}>
                <button
                  className={`subtask-check ${st.done ? 'checked' : ''}`}
                  onClick={() => toggleSubtask(st.id)}
                  aria-label={st.done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {st.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
                <span>{st.text}</span>
                {editing && (
                  <button className="subtask-remove" onClick={() => removeSubtask(st.id)} aria-label="Remove subtask">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="subtask-input-row">
              <input
                type="text"
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                className="subtask-input"
                aria-label="New subtask"
              />
              <button onClick={addSubtask} className="add-subtask-btn">Add</button>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="detail-meta">
          <span>Created {formatDate(item.createdAt)}</span>
          {item.updatedAt !== item.createdAt && <span>· Updated {formatDate(item.updatedAt)}</span>}
          <span>· <Badge variant="default" size="sm">{item.type}</Badge></span>
          <span>· <Badge variant={item.status === 'inbox' ? 'warm' : 'default'} size="sm">{item.status}</Badge></span>
        </div>

        {/* Delete */}
        <button className="delete-btn" onClick={handleDelete} aria-label="Delete item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete this capture
        </button>
      </div>

      {showToast && <Toast message="Saved!" variant="success" onClose={() => setShowToast(false)} />}
        {showOrganize && (
          <AIOrganizeSheet
            item={item}
            onClose={() => setShowOrganize(false)}
            onAccept={() => setShowToast(true)}
          />
        )}
    </div>
  )
}
