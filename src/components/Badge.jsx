import "./Badge.css"

export default function Badge({ children, variant = "default", size = "md", dot = false, className = "" }) {
  const classes = ["badge", `badge-${variant}`, `badge-${size}`, dot ? "badge-dot" : "", className].filter(Boolean).join(" ")
  return (
    <span className={classes}>
      {dot && <span className="badge-dot-indicator" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function PriorityDot({ priority }) {
  const colors = { 1: "danger", 2: "warning", 3: "default" }
  return (
    <span
      className={`priority-dot priority-dot-${colors[priority] || "default"}`}
      aria-label={`Priority ${priority}`}
      role="img"
    />
  )
}
