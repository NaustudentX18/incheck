import "./EmptyState.css"

export default function EmptyState({ headline, subtext, action, color = "warm" }) {
  return (
    <div className="empty-state" role="status">
      <div className={`empty-blob empty-blob-${color}`} aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke={color === "warm" ? "var(--accent-warm)" : color === "success" ? "var(--success)" : "var(--text-muted)"}
          strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <h3 className="empty-headline">{headline}</h3>
      {subtext && <p className="empty-subtext">{subtext}</p>}
      {action && (
        <button className="empty-cta btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
