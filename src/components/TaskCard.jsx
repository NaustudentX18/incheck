import { useState, useRef } from 'react'
import './TaskCard.css'
import useCaptureStore from '../stores/captureStore'

const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' }
const PRIORITY_COLORS = { 1: 'var(--error)', 2: 'var(--accent-primary)', 3: 'var(--success)' }

function formatRelative(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff/86400000)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function TaskCard({ item, onClick, onRead }) {
  const [swipeX, setSwipeX] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef(null)
  const updateItem = useCaptureStore(s => s.updateItem)
  const deleteItem = useCaptureStore(s => s.deleteItem)

  const handlePointerDown = (e) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const dx = e.clientX - startX
    if (dx < 0) setSwipeX(Math.max(dx, -80))
    else setSwipeX(Math.min(dx, 80))
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    if (swipeX < -60) {
      // Swipe left = defer / parking
      updateItem(item.id, { status: 'parking' })
    } else if (swipeX > 60) {
      // Swipe right = complete
      updateItem(item.id, { status: 'completed' })
    }
    setSwipeX(0)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteItem(item.id)
  }

  const handleToggleComplete = (e) => {
    e.stopPropagation()
    updateItem(item.id, {
      status: item.status === 'completed' ? 'inbox' : 'completed'
    })
  }

  const isCompleted = item.status === 'completed'
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !isCompleted

  return (
    <li
      ref={trackRef}
      className={`task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={onClick}
      style={{ '--swipe-x': `${swipeX}px` }}
      role="listitem"
    >
      {/* Swipe actions */}
      <div className="swipe-action left" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div className="swipe-action right" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9l6 6M15 9l-6 6"/>
        </svg>
      </div>

      <div className="card-body">
        <div className="card-priority" style={{ background: PRIORITY_COLORS[item.priority] || 'var(--text-tertiary)' }} aria-label={`Priority: ${PRIORITY_LABELS[item.priority] || 'none'}`} />

        <div className="card-content">
          <div className="card-header-row">
            {item.type !== 'idea' && (
              <span className="card-type-badge">{item.type}</span>
            )}
            <p className={`card-title ${isCompleted ? 'struck' : ''}`}>
              {item.title || item.content?.slice(0, 60) || 'Untitled'}
            </p>
          </div>

          {item.content && item.content.length > 60 && (
            <p className="card-preview">{item.content.slice(60, 140)}...</p>
          )}

          <div className="card-meta">
            <span className="card-time">{formatRelative(item.createdAt)}</span>
            {item.tasks?.length > 0 && (
              <span className="card-tasks">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                {item.tasks.length}
              </span>
            )}
            {item.tags?.length > 0 && (
              <div className="card-tags">
                {item.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="card-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className={`card-check ${isCompleted ? 'checked' : ''}`}
          onClick={handleToggleComplete}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>
        {onRead && (
          <button
            className="card-read-btn"
            onClick={(e) => { e.stopPropagation(); onRead(item) }}
            aria-label="Read aloud"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        )}
      </div>
    </li>
  )
}
