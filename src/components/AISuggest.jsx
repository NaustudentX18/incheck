import { useState, useEffect, useCallback } from 'react'
import './AISuggest.css'
import { llmService } from '../lib/llmService'

export default function AISuggest({ items, onSelect }) {
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchSuggestion = useCallback(async () => {
    if (!items?.length) return
    setLoading(true)
    setExpanded(false)
    try {
      const result = await llmService.suggest({ items })
      if (result?.suggestion) {
        setSuggestion(result.suggestion)
        setExpanded(true)
      }
    } catch (err) {
      console.warn('[AISuggest] Failed:', err)
    } finally {
      setLoading(false)
    }
  }, [items])

  useEffect(() => {
    // Auto-fetch on mount if there are inbox items
    const inboxItems = items?.filter(i => i.status === 'inbox') || []
    if (inboxItems.length > 0 && !suggestion) {
      fetchSuggestion()
    }
  }, [items, suggestion, fetchSuggestion])

  if (!items?.length) return null

  const inboxCount = items.filter(i => i.status === 'inbox').length
  if (inboxCount === 0 && !suggestion) return null

  return (
    <div className="ai-suggest">
      <div className="suggest-header">
        <div className="suggest-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
            <path d="M9 21h6"/><path d="M12 17v4"/>
          </svg>
        </div>
        <span className="suggest-label">AI Suggest</span>
        <button
          className="suggest-refresh"
          onClick={fetchSuggestion}
          aria-label="Get new suggestion"
          disabled={loading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
        </button>
      </div>

      {loading && !suggestion && (
        <div className="suggest-loading">
          <div className="suggest-skeleton" />
        </div>
      )}

      {suggestion && (
        <div className={`suggest-card ${expanded ? 'expanded' : ''}`}>
          {loading && <div className="suggest-spinner" aria-hidden="true"><span className="spinner" /></div>}
          <p className="suggest-reason">{suggestion.reason}</p>
          <button
            className="suggest-action"
            onClick={() => onSelect?.(suggestion.itemId)}
            aria-label={`Focus on: ${suggestion.title}`}
          >
            <span className="suggest-title">{suggestion.title}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
        </div>
      )}

      {!loading && !suggestion && inboxCount > 0 && (
        <button className="suggest-get-btn" onClick={fetchSuggestion}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/>
          </svg>
          Get AI suggestion
        </button>
      )}
    </div>
  )
}