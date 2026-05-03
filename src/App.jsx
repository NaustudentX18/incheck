import { useState } from 'react'
import BrainDumpInput from './components/BrainDumpInput'
import Library from './components/Library'
import Focus from './components/Focus'
import Settings from './components/Settings'
import TTSReader from './components/TTSReader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineIndicator } from './components/OfflineIndicator'
import { useReducedMotion } from './hooks/useReducedMotion'
import useCaptureStore from './stores/captureStore'
import './App.css'

const TABS = [
  { id: 'capture', label: 'Capture', icon: 'mic' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'focus', label: 'Focus', icon: 'timer' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

function App() {
  const [activeTab, setActiveTab] = useState('capture')
  const [readerItem, setReaderItem] = useState(null)
  const items = useCaptureStore(s => s.items)

  // Propagate reduced-motion setting to <html> when it changes
  useReducedMotion()

  return (
    <div className="app grain">
      <OfflineIndicator />
      <ErrorBoundary>
        <main className="app-content">
          {activeTab === 'capture' && <BrainDumpInput />}
          {activeTab === 'library' && <Library items={items} openReader={setReaderItem} />}
          {activeTab === 'focus' && <Focus items={items} />}
          {activeTab === 'settings' && <Settings />}
        </main>

        <nav className="tab-bar" aria-label="Main navigation">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <TabIcon name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {readerItem && (
          <ErrorBoundary>
            <TTSReader item={readerItem} onClose={() => setReaderItem(null)} />
          </ErrorBoundary>
        )}
      </ErrorBoundary>
    </div>
  )
}

function TabIcon({ name }) {
  const icons = {
    mic: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    ),
    library: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 6 4 14"/>
        <path d="M12 6v14"/>
        <path d="M8 8v12"/>
        <path d="M4 4v16"/>
      </svg>
    ),
    timer: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8"/>
        <path d="M12 9v4l2 2"/>
        <path d="M5 3 2 6"/>
        <path d="M22 6 19 3"/>
        <path d="M12 2v2"/>
      </svg>
    ),
    settings: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  }
  return icons[name] || null
}

export default App
