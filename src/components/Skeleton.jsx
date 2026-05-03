import "./Skeleton.css"

export function Skeleton({ width = "100%", height = "16px", radius = "8px", className = "" }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, lastLineWidth = "60%" }) {
  return (
    <div className="skeleton-text" aria-label="Loading..." role="status">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? lastLineWidth : "100%"} height="14px" />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-label="Loading item..." role="status">
      <div className="skeleton-card-row">
        <Skeleton width="44px" height="44px" radius="8px" />
        <div className="skeleton-card-content">
          <Skeleton width="70%" height="14px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
    </div>
  )
}
