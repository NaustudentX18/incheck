import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_SETTINGS = {
  // TTS
  defaultVoice: 'af_bella',
  defaultSpeed: 1,
  // Focus
  defaultDuration: 1,         // index into DURATIONS [15, 25, 50, 90]
  tickSound: false,
  focusCompanion: false,
  // Capture
  autoOrganize: false,
  // Appearance
  fontSize: 16,
  reducedMotion: false,
}

const useCaptureStore = create(
  persist(
    (set, get) => ({
      items: [],
      settings: { ...DEFAULT_SETTINGS },
      addItem: (item) => {
        const newItem = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'inbox',
          type: 'idea',
          priority: 2,
          tags: [],
          subtasks: [],
          ...item,
        }
        set(state => ({ items: [newItem, ...state.items] }))
        return newItem.id
      },
      updateItem: (id, updates) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        }))
      },
      deleteItem: (id) => {
        set(state => ({ items: state.items.filter(item => item.id !== id) }))
      },
      getItem: (id) => get().items.find(item => item.id === id),
      getInboxItems: () => get().items.filter(item => item.status === 'inbox'),
      getTodayItems: () => {
        const today = new Date().toDateString()
        return get().items.filter(item =>
          new Date(item.createdAt).toDateString() === today
        )
      },
      updateSettings: (updates) => {
        set(state => ({ settings: { ...state.settings, ...updates } }))
      },
      clearAll: () => {
        set({ items: [], settings: {} })
      },
    }),
    {
      name: 'incheck-captures',
      partialize: (state) => ({ items: state.items, settings: state.settings }),
    }
  )
)

export default useCaptureStore
