import { useState, useEffect } from 'react'
import './OfflineBanner.css'

/**
 * Shows a banner when the app is offline or an update is available.
 */
export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    const handleOffline = () => setOffline(true)
    const handleOnline = () => setOffline(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // PWA update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          setUpdateAvailable(true)
        })
      })
    }

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (offline) {
    return (
      <div className="offline-banner" role="status" aria-live="polite">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
        <span>Offline — your captures are still saved locally</span>
      </div>
    )
  }

  if (updateAvailable) {
    return (
      <div className="offline-banner update" role="status" aria-live="polite">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-4.96"/>
        </svg>
        <span>Update ready</span>
        <button
          className="banner-update-btn"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    )
  }

  return null
}
