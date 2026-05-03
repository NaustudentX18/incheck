import { useEffect, useRef } from "react"
import "./Sheet.css"

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export default function Sheet({ isOpen, onClose, title, children, height = "auto" }) {
  const sheetRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return }
      if (e.key !== "Tab" || !sheetRef.current) return
      const focusable = Array.from(sheetRef.current.querySelectorAll(FOCUSABLE))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
      // Focus first element
      setTimeout(() => {
        const first = sheetRef.current?.querySelector(FOCUSABLE)
        first?.focus()
      }, 50)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const titleId = "sheet-title"

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div ref={sheetRef} className="sheet" style={{ maxHeight: height === "full" ? "90dvh" : height }}>
        <div className="sheet-handle" aria-hidden="true" />
        {title && <h2 id={titleId} className="sheet-title">{title}</h2>}
        <button
          className="sheet-close"
          onClick={onClose}
          aria-label="Close sheet"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        <div className="sheet-content">{children}</div>
      </div>
    </div>
  )
}
