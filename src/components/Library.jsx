import { useState, useMemo } from 'react'
import './Library.css'
import TaskCard from './TaskCard'
import ItemDetail from './ItemDetail'
import EmptyState from './EmptyState'
import AISuggest from './AISuggest'

const TABS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All' },
  { id: 'parking', label: 'Parking' },
]

const TYPE_FILTERS = ['idea', 'voice', 'document']

export default function Library({ items, openReader }) {
  const [activeTab, setActiveTab] = useState('inbox')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(() => {
    let result = [...items]
    const today = new Date().toDateString()

    switch (activeTab) {
      case 'inbox':
        result = result.filter(i => i.status === 'inbox')
        break
      case 'today':
        result = result.filter(i => new Date(i.createdAt).toDateString() === today)
        break
      case 'upcoming':
        result = result.filter(i => i.dueDate && new Date(i.dueDate) >= new Date())
        break
      case 'parking':
        result = result.filter(i => i.status === 'parking')
        break
      case 'all':
      default:
        break
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        (i.content || '').toLowerCase().includes(q) ||
        (i.title || '').toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }

    if (typeFilter) {
      result = result.filter(i => i.type === typeFilter)
    }

    return result
  }, [items, activeTab, search, typeFilter])

  const selectedItem = useMemo(() =>
    items.find(i => i.id === selectedId), [items, selectedId])

  const countFor = (tabId) => {
    const today = new Date().toDateString()
    switch (tabId) {
      case 'inbox': return items.filter(i => i.status === 'inbox').length
      case 'today': return items.filter(i => new Date(i.createdAt).toDateString() === today).length
      case 'upcoming': return items.filter(i => i.dueDate && new Date(i.dueDate) >= new Date()).length
      case 'parking': return items.filter(i => i.status === 'parking').length
      default: return items.length
    }
  }

  if (selectedId && selectedItem) {
    return <ItemDetail item={selectedItem} onBack={() => setSelectedId(null)} onRead={openReader} />
  }

  return (
    <div className="library">
      <header className="library-header">
        <h1>Library</h1>
      </header>

      <div className="section-tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`section-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {countFor(tab.id) > 0 && (
              <span className="tab-count">{countFor(tab.id)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="search"
          placeholder="Search captures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search captures"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      <div className="filter-chips">
        {TYPE_FILTERS.map(type => (
          <button
            key={type}
            className={`filter-chip ${typeFilter === type ? 'active' : ''}`}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
          >
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          headline={search ? 'No results' : activeTab === 'inbox' ? 'Inbox zero!' : 'Nothing here'}
          subtext={search ? `No captures match "${search}"` : activeTab === 'inbox' ? 'All caught up. Go capture something.' : 'This list is empty.'}
        />
      ) : (
        <>
          {activeTab === 'inbox' && (
            <AISuggest
              items={items}
              onSelect={(itemId) => setSelectedId(itemId)}
            />
          )}
          <ul className="task-list" role="list">
            {filtered.map(item => (
              <TaskCard
                key={item.id}
                item={item}
                onClick={() => setSelectedId(item.id)}
                onRead={openReader}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
