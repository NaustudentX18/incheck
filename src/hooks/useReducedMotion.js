import { useState, useEffect } from 'react'
import useCaptureStore from '../stores/captureStore'

/**
 * Hook: respects manual reduced-motion setting + system preference.
 * Returns true if motion should be reduced.
 */
export function useReducedMotion() {
  const storeMotion = useCaptureStore(s => s.settings?.reducedMotion)
  const [systemPrefers, setSystemPrefers] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setSystemPrefers(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Manual setting overrides system pref
  if (typeof storeMotion === 'boolean') return storeMotion
  return systemPrefers
}

/**
 * Hook: applies reduced motion to document root.
 * Call once at App root to propagate setting.
 */
export function ReducedMotionProvider({ children }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced)
  }, [reduced])

  return children
}
