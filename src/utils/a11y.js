/**
 * Accessibility utilities for InCheck
 */

/**
 * Trap focus within a modal/overlay element.
 * Returns a ref to attach to the container.
 *
 * Usage:
 *   const { containerRef } = useFocusTrap()
 *   <div ref={containerRef}>...</div>
 */
export function useFocusTrap(isActive = true) {
  const { useRef, useEffect } = require('react')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const focusables = container.querySelectorAll(focusableSelector)
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    // Focus first element on open
    first?.focus()
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return { containerRef }
}

/**
 * Announce a message to screen readers via aria-live.
 * Injects a visually-hidden announcer div.
 */
let announcer = null
export function announce(message, priority = 'polite') {
  if (!announcer) {
    announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  }
  announcer.setAttribute('aria-live', priority)
  announcer.textContent = ''
  // Force reflow so screen reader picks up the change
  void announcer.offsetWidth
  announcer.textContent = message
}

/**
 * Check if an element is keyboard-visible (not display:none etc.)
 */
export function isVisible(el) {
  return !!(el && el.offsetWidth > 0 && el.offsetHeight > 0)
}

/**
 * Get all focusable elements within a container.
 */
export function getFocusable(container) {
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      'a[href], [tabindex]:not([tabindex="-1"])'
    )
  )
}
