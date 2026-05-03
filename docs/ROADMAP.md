# InCheck — Implementation Roadmap

Sequential phases. Each phase is independently deployable and tested.

---

## Phase 1: Foundation & Shell

**Goal:** Shippable skeleton — app renders, navigates, looks correct.

### 1.1 Project Bootstrap
```
- [ ] Initialize Next.js 14 app (App Router, TypeScript strict)
- [ ] Install: zustand, lucide-react, next-pwa
- [ ] Configure: tsconfig strict, path aliases (@/ → src/), eslint
- [ ] Configure: CSS custom properties (design tokens from SPEC.md §2)
- [ ] Set up: CSS Modules + global.css with all token variables
- [ ] Create: app/layout.tsx with metadata, viewport, dark theme class
- [ ] Create: app/globals.css — reset, tokens, base typography, scrollbar
- [ ] Set up: next-pwa (service worker, manifest.json, icons)
- [ ] PWA test: manifest loads, "Add to Home Screen" works
```

### 1.2 App Shell & Navigation
```
- [ ] Create: src/components/BottomNavBar/
- [ ] Implement: 4-tab bar, Lucide icons, active state, safe-area padding
- [ ] Create: src/components/TopBar/
- [ ] Implement: logo left, context title center, actions right
- [ ] Create: src/app/(app)/layout.tsx — shell wraps all tab pages
- [ ] Set up: CSS Modules per component
- [ ] Verify: tab switching, safe area on notch + gesture bar
```

### 1.3 Design System Primitives
```
- [ ] Create: src/components/ui/Button/ (primary, secondary, ghost, danger)
- [ ] Create: src/components/ui/TextField/ (with label, error, helper)
- [ ] Create: src/components/ui/Toast/ (success, error, auto-dismiss)
- [ ] Create: src/components/ui/EmptyState/ (gradient blob, headline, CTA)
- [ ] Create: src/components/ui/Sheet/ (bottom sheet, drag-to-dismiss)
- [ ] Create: src/components/ui/Skeleton/ (shimmer loading placeholder)
- [ ] Create: src/components/ui/Badge/ (priority dots, status chips)
- [ ] Document: src/styles/tokens.css — all CSS variables documented
- [ ] Verify: all components ≥48x48px touch targets, ≥4.5:1 contrast
```

**Phase 1 Deliverable:** Empty shell app renders in browser + mobile. Tab nav works. Design tokens applied.

---

## Phase 2: Capture (Brain Dump)

**Goal:** Zero-friction idea capture — voice and text.

### 2.1 Brain Dump Screen
```
- [ ] Create: src/app/(app)/capture/page.tsx
- [ ] Build: BrainDumpInput — full-width textarea, no labels
- [ ] Implement: placeholder "Dump your brain..." muted color
- [ ] Implement: character count (subtle, bottom-right)
- [ ] Implement: send button appears when text >0, accent-primary
- [ ] Implement: keyboard-aware — input scrolls above keyboard
- [ ] Implement: auto-focus on mount
- [ ] Style: centered content, breathing room, fast feel
```

### 2.2 Voice Capture
```
- [ ] Create: src/components/VoiceRecorder/
- [ ] Build: mic FAB 56x56px, accent-primary bg, centered below textarea
- [ ] Implement: tap to start → request mic permission
- [ ] Implement: SpeechRecognition API integration (web speech)
- [ ] Implement: live transcription preview while recording
- [ ] Implement: pulsing violet ring animation during recording
- [ ] Implement: tap to stop → transcript fills textarea
- [ ] Implement: recording duration counter (mono font)
- [ ] Fallback: show toast if SpeechRecognition unavailable
- [ ] Verify: works on Safari iOS, Chrome Android
```

### 2.3 File Import
```
- [ ] Create: src/components/FileImporter/
- [ ] Implement: drag-and-drop (desktop) + tap-to-upload (mobile)
- [ ] Implement: accept PDF, ePub, TXT, DOCX
- [ ] Implement: PDF text extraction (pdf.js)
- [ ] Implement: ePub text extraction (epub.js)
- [ ] Implement: TXT/DOCX raw text read
- [ ] Implement: file size check (warn >10MB, reject >50MB)
- [ ] Implement: upload progress indicator
- [ ] Implement: extracted text preview before save
- [ ] Implement: error toast on parse failure
```

### 2.4 Capture Save Flow
```
- [ ] Create: src/stores/captureStore.ts (Zustand)
- [ ] Implement: save item → localStorage + IndexedDB
- [ ] Implement: generate item ID (uuid)
- [ ] Implement: type = 'idea' by default, status = 'inbox'
- [ ] Implement: timestamp createdAt/updatedAt
- [ ] Implement: after save → micro-animation → clear input
- [ ] Implement: success toast "Captured!" with undo 5s
- [ ] Implement: auto-scroll to Library tab (optional setting)
```

**Phase 2 Deliverable:** User can brain dump via text, voice, or file. Items appear in Library Inbox.

---

## Phase 3: Library

**Goal:** All captured content organized and accessible.

### 3.1 Library Screen
```
- [ ] Create: src/app/(app)/library/page.tsx
- [ ] Build: LibraryHeader (view switcher: Inbox/Today/Upcoming/All/Parking)
- [ ] Build: SearchBar — full-text search, sticky top
- [ ] Build: FilterBar — type chips, priority, project
- [ ] Build: ItemList — virtualized (react-window) for 50+ items
- [ ] Implement: pull-to-refresh
- [ ] Implement: swipe gestures (custom)
- [ ] Implement: empty state per view (different blob color per type)
- [ ] Implement: sort: newest first default
```

### 3.2 TaskCard Component
```
- [ ] Create: src/components/TaskCard/
- [ ] Implement: surface bg, 12px radius, subtle border
- [ ] Implement: priority dot (left edge — emerald/amber/red)
- [ ] Implement: title + optional subtitle
- [ ] Implement: subtask progress bar if subtasks exist
- [ ] Implement: due date chip (muted / warning / danger if overdue)
- [ ] Implement: swipe right → complete
- [ ] Implement: swipe left → defer sheet
- [ ] Implement: long press → context menu (Edit/Delete/Move/Share)
- [ ] Implement: completed state (strikethrough + muted)
- [ ] Implement: overdue state (danger border-left)
- [ ] Implement: hover: slight elevation lift
```

### 3.3 Item Detail View
```
- [ ] Create: src/app/(app)/library/[id]/page.tsx
- [ ] Build: full item content display
- [ ] Implement: edit title inline (tap to edit)
- [ ] Implement: edit content (textarea)
- [ ] Implement: subtask list (add/remove/toggle/reorder)
- [ ] Implement: project label picker (autocomplete from existing)
- [ ] Implement: priority selector (1-3 stars)
- [ ] Implement: due date picker (native date input, styled)
- [ ] Implement: tag input (chip input, autocomplete)
- [ ] Implement: "Open Reader" button if content is long-form
- [ ] Implement: delete item (with confirmation sheet)
- [ ] Implement: back navigation preserves scroll position
```

### 3.4 Data Persistence Layer
```
- [ ] Create: src/lib/storage.ts
- [ ] Implement: localStorage for preferences + small items
- [ ] Implement: IndexedDB for large documents (PDF/epub raw text)
- [ ] Implement: Zustand store for library items (hydrated on mount)
- [ ] Implement: optimistic updates
- [ ] Implement: data migration schema (version field)
- [ ] Implement: export all (JSON download)
- [ ] Implement: import (JSON upload + validation)
- [ ] Implement: clear all (two-step confirmation)
```

**Phase 3 Deliverable:** Library shows all items, searchable, filterable, swipeable. Item detail editing works.

---

## Phase 4: AI Organization

**Goal:** Make "Organize" feel magical, not tedious.

### 4.1 AI Organize Sheet
```
- [ ] Create: src/components/AIOrganizeSheet/
- [ ] Build: bottom sheet triggering after capture or from item detail
- [ ] Implement: "Organize" button on inbox items
- [ ] Implement: loading state: pulsing skeleton of suggestions
- [ ] Display: suggested project label (text input, editable)
- [ ] Display: priority stars (1-3, selectable)
- [ ] Display: subtask breakdown (collapsible list, add/remove/edit)
- [ ] Display: suggested tags (chip-style, removable)
- [ ] Implement: "Accept All" primary action
- [ ] Implement: "Edit First" → opens item detail
- [ ] Implement: "Dismiss" → item stays as-is in Inbox
```

### 4.2 Backend API Routes
```
- [ ] Create: src/app/api/organize/route.ts (Next.js Route Handler)
- [ ] Implement: OpenAI/Claude call for organization
- [ ] Prompt: extract project name, suggest priority, break into subtasks
- [ ] Implement: streaming response for perceived speed
- [ ] Implement: error handling + fallback mock response
- [ ] Implement: rate limiting (debounce rapid calls)
- [ ] Create: src/app/api/capture/route.ts
- [ ] Implement: receive text + optional file URL → return structured item
```

### 4.3 Smart Suggestions
```
- [ ] Implement: entity extraction (names, dates, topics) from content
- [ ] Implement: project suggestion based on existing projects + content similarity
- [ ] Implement: priority suggestion based on urgency keywords
- [ ] Implement: subtask generation for verbs + complex phrases
- [ ] Implement: auto-tagging based on content analysis
- [ ] Implement: "Inbox Zero" encouragement when all inbox items processed
```

**Phase 4 Deliverable:** Tapping "Organize" shows AI suggestions. Accepting them structures inbox items into proper tasks.

---

## Phase 5: Focus Mode

**Goal:** One task, one timer, dopamine on completion.

### 5.1 Focus Screen
```
- [ ] Create: src/app/(app)/focus/page.tsx
- [ ] Build: Morning Ritual → "Pick Your 3 Focuses"
- [ ] Build: item picker — scrollable list of today's + inbox tasks
- [ ] Build: 3 focus slots — tap to assign, X to remove
- [ ] Implement: overflow protection sheet (>3 items → suggest deferral)
- [ ] Implement: "Defer to Parking Lot" suggestion
- [ ] Implement: persist daily focus selection
```

### 5.2 Active Focus View
```
- [ ] Create: src/components/FocusCard/
- [ ] Build: single task centered, 24px heading, 1.6 line-height
- [ ] Build: resistance picker (5 faces, subtle, above task)
- [ ] Build: Pomodoro timer (48px JetBrains Mono, countdown)
- [ ] Implement: timer controls — play/pause, skip break, abandon
- [ ] Implement: customizable intervals (15/5, 25/5, 50/10, custom)
- [ ] Implement: tick sound option (subtle, toggleable)
- [ ] Implement: break screen — breathing prompt + next session preview
- [ ] Implement: abandon → confirm sheet
```

### 5.3 Celebration & Completion
```
- [ ] Create: src/components/Confetti/
- [ ] Implement: canvas confetti burst on task complete
- [ ] Implement: "Ta-Da!" headline (large, accent-warm)
- [ ] Implement: accomplishment log → "Ta-Da Journal" entry saved
- [ ] Implement: daily Ta-Da count on Focus screen
- [ ] Implement: streak counter (days with ≥1 Ta-Da, no punishment)
- [ ] Implement: after celebration → next focus or session summary
```

### 5.4 Focus Companion (Voice)
```
- [ ] Create: src/components/FocusCompanion/
- [ ] Implement: optional AI voice encouragement between sessions
- [ ] Implement: gentle rotating messages
- [ ] Implement: breathing mode (4-7-8: expand circle animation)
- [ ] Implement: toggle on/off in Focus screen
```

### 5.5 Parking Lot
```
- [ ] Implement: Parking Lot view in Library tabs
- [ ] Implement: items here have no due date pressure
- [ ] Implement: "Rescue from Parking Lot" on overflow
- [ ] Implement: "Stale?" section for 30+ day parked items
```

**Phase 5 Deliverable:** Focus mode works end-to-end. Timer runs, resistance tracked, confetti fires on completion.

---

## Phase 6: Reader & TTS

**Goal:** Consume long documents by listening.

### 6.1 Reader Screen
```
- [ ] Create: src/app/(app)/library/read/[id]/page.tsx
- [ ] Build: content area — max 65ch, 18px, centered
- [ ] Build: top bar — back, title, bookmark, share
- [ ] Build: bottom TTS bar (glass bg, blur backdrop, fixed)
- [ ] Implement: Web Speech API SpeechSynthesis integration
- [ ] Implement: play/pause button (56px touch target)
- [ ] Implement: speed selector pill buttons (0.5x → 2x)
- [ ] Implement: voice selector → opens VoiceSelectorSheet
- [ ] Implement: progress bar — thin line at top of content
```

### 6.2 Text-Audio Sync
```
- [ ] Implement: current word highlight (accent-primary bg, animated)
- [ ] Implement: auto-scroll to keep current word in view
- [ ] Implement: tap highlighted word → pause playback
- [ ] Implement: clickable words → jump to that position
- [ ] Implement: smooth scroll
- [ ] Implement: save ttsPosition per item on pause/background
- [ ] Implement: resume from last position on re-open
```

### 6.3 Voice Selector Sheet
```
- [ ] Create: src/components/VoiceSelectorSheet/
- [ ] Implement: bottom sheet, grouped list (Recent / All Voices)
- [ ] Implement: voice preview button (tap → plays 3s sample)
- [ ] Implement: "Create Custom Narrator" CTA → ElevenLabs voice design
- [ ] Implement: search/filter by language, gender, accent
- [ ] Implement: selected voice → saved to item + user preferences
```

### 6.4 Sleep Timer & Bookmarks
```
- [ ] Implement: sleep timer sheet (5/15/30/60 min / End of chapter)
- [ ] Implement: visual countdown on timer chip
- [ ] Implement: auto-stop + "Shutting down..." toast
- [ ] Implement: bookmark → saves current ttsPosition
- [ ] Implement: bookmark list in item detail (jump to any)
```

### 6.5 ElevenLabs Integration (Premium)
```
- [ ] Create: src/app/api/tts/route.ts
- [ ] Implement: ElevenLabs API call for premium voices
- [ ] Implement: audio streaming (or blob URL)
- [ ] Implement: fallback to Web Speech API if ElevenLabs unavailable
- [ ] Implement: voice caching (IndexedDB)
- [ ] Implement: offline mode — play cached audio if available
```

### 6.6 Document Import to Reader
```
- [ ] Implement: PDF rendering (pdf.js) in ReaderView
- [ ] Implement: ePub rendering (epub.js) in ReaderView
- [ ] Implement: URL import → fetch + extract readable text
- [ ] Implement: paste text → direct to ReaderView
- [ ] Implement: article extraction (readability) for URLs
```

**Phase 6 Deliverable:** Any long document or idea can be read aloud with synced highlighting. Voice and speed customizable.

---

## Phase 7: Profile & Settings

**Goal:** App adapts to the user, not the other way around.

### 7.1 Profile Screen
- [x] Settings screen with organized sections
- [x] SettingsRow component (label + control, with hints)
- [x] Voice settings: default voice, reading speed slider
- [x] Focus settings: default timer (pill buttons), tick sound toggle, Focus Companion toggle
- [x] Capture settings: auto-organize toggle
- [x] Appearance: font size slider, dark mode badge, reduced motion toggle

### 7.2 Appearance Settings
- [x] Font size slider (14-20px)
- [x] Reduced motion toggle (respects system + manual)
- [x] Dark mode badge (always on, v1)

### 7.3 Data Management
- [x] Export all data (JSON download)
- [x] Import data (JSON upload with preview, merge duplicates)
- [x] Clear all data (two-step: confirm → type "delete")
- [x] fal.ai API key input for Kokoro cloud fallback

### 7.4 Onboarding Tour
- [x] 4-step swipeable tour (mic / library / timer / speaker)
- [x] Progress dots, skip button, next button
- [x] Only shown once (localStorage flag)

**Phase 7 Deliverable:** Settings fully configurable. Onboarding complete. Data portable.

---

## Phase 8: Polish & Performance

**Goal:** Ship-quality. No jank, no layout shift, no dead buttons.

### 8.1 Performance
- [x] Build target set to `esnext` (vite.config.js)
- [x] PWA with service worker, offline-first precaching (12 assets)
- [x] Fonts cached via workbox runtimeCaching (Google Fonts)

### 8.2 Accessibility Audit
- [x] Tab bar: `aria-label="Main navigation"`, `aria-current="page"`
- [x] ErrorBoundary class component wrapping App content + TTSReader
- [x] OfflineIndicator: `role="status"`, `aria-live="polite"`
- [x] Sheet: focus trap, Escape key, `aria-modal`, `aria-labelledby`, auto-focus on open, close button
- [x] `useFocusTrap` utility ready for VoiceSelectorSheet

### 8.3 Animation Polish
- [x] Manual `reducedMotion` setting synced with system `prefers-reduced-motion`
- [x] `useReducedMotion` hook propagates `.reduce-motion` class to `<html>`
- [x] `.reduce-motion .sheet-backdrop`, `.reduce-motion .sheet` animations disabled
- [x] `.reduce-motion .confetti-canvas` hidden when motion is reduced

### 8.4 Offline + PWA
- [x] `OfflineIndicator` component: offline banner, update-ready banner
- [x] PWA manifest correct, icons render (192x192, 512x512 maskable)
- [x] Service worker auto-update with "Update ready" banner

### 8.5 Error Handling
- [x] `ErrorBoundary` class component: catches render errors, shows recovery UI
- [x] `useReducedMotion` hook handles SSR-safe `window.matchMedia`
- [x] `OfflineIndicator` PWA update detection via `controllerchange` event

### 8.6 Pre-Launch Checklist
```
- [x] Build target set to `esnext` (vite.config.js)
- [x] PWA with service worker, offline-first precaching
- [x] Fonts cached via workbox runtimeCaching (Google Fonts)
- [x] ErrorBoundary class component wrapping App content + TTSReader
- [x] `useReducedMotion` hook propagates `.reduce-motion` class to `<html>`
- [x] `OfflineIndicator` PWA update detection via `controllerchange` event
- [ ] Test on: iOS Safari (iPhone — BrowserStack or real)
- [ ] Test on: Android Chrome (Pixel — BrowserStack or real)
- [ ] Verify: TTS works on both iOS and Android
- [ ] Verify: voice recording works on both iOS and Android
- [ ] Verify: LLM connection (Ollama) works on mobile browser
- [ ] Run: final axe scan → 0 violations
```

---

## Phase 9: AI Intelligence

**Goal:** Make VibeFlow genuinely AI-driven — not just features with AI in the name, but AI that meaningfully reduces cognitive load.

### 9.1 LLM Service (`src/lib/llmService.js`)
- [x] Ollama direct API integration (localhost:11434)
- [x] Streaming chat with async generator interface
- [x] `organize()` — streaming JSON extraction (project, priority, subtasks, tags)
- [x] `getCompanionMessage()` — brief ADHD-friendly encouragement
- [x] `suggest()` — smart next action from task list
- [x] `embed()` — semantic embeddings for future search
- [x] `ping()` — health check for connection status
- [x] Fallback static messages when LLM is unavailable

### 9.2 AI Organize Sheet (wired to real LLM)
- [x] Rewired from mock `doOrganize()` to `llmService.organize()`
- [x] Rate-limited state updates (200ms) to prevent React thrashing
- [x] Live suggestion display as tokens stream in
- [x] Skeleton loading states during AI processing
- [x] Error state with retry option

### 9.3 AI Smart Suggester (`src/components/AISuggest.jsx`)
- [x] Shows in Library Inbox tab
- [x] Calls `llmService.suggest()` with current items
- [x] Displays picked task + reason + energy level
- [x] Tap to open suggested item in detail view
- [x] Refresh button to get new suggestion

### 9.4 Focus Companion (wired to LLM)
- [x] `settings.focusCompanion` toggle in Settings
- [x] When enabled, AI message appears 3 seconds after starting focus session
- [x] Fetches `getCompanionMessage('work')` with session count, resistance, task title
- [x] Dismissible with X button
- [x] Refresh button for new message
- [x] Purple gradient glow animation (reduced motion safe)
- [x] Fallback to static messages when LLM unavailable

### 9.5 Settings AI Panel
- [x] Ollama connection status indicator (connected/offline/checking)
- [x] Model count display
- [x] Retry button to re-check connection
- [x] Ollama URL configuration field
- [x] Model selector dropdown (populated from `/api/tags`)
- [x] LLM status synced to component via `onStatusChange` listener

**Phase 9 Deliverable:** VibeFlow is fully AI-connected. LLM organizes captures, suggests next actions, and provides focus encouragement — all routed through a single `llmService.js` singleton.

**Phase 8 Deliverable:** Production-ready. 60fps, accessible, offline-capable, installs like native app.

---

## Phase 9: Growth & v2 Backlog

```
- ElevenLabs premium voice library (in-app purchase)
- Custom voice design (Voice Design v3)
- Iconic voices (licensed narrators)
- Collaborative "Patch" shared spaces
- Weekly digest email → audio summary
- Widgets (iOS/Android home screen)
- Apple Watch / WearOS companion
- Smart recurrence (learns from patterns)
- Energy matching (time-of-day task suggestion)
- "Why matters TODAY?" consequence framing
- If-Then planning rules
- Repair plans for missed tasks
```

---

## Execution Order Summary

| Phase | Focus | Key Files / Components | Status |
|-------|-------|-----------------------|--------|
| 1 | Foundation & Shell | layout, BottomNavBar, TopBar, Button, Toast, tokens | ✅ Done |
| 2 | Capture | capture/page, BrainDumpInput, VoiceRecorder, FileImporter | ✅ Done |
| 3 | Library | library/page, TaskCard, ItemList, storage | ✅ Done |
| 4 | AI Organization | AIOrganizeSheet, api/organize, api/capture | ✅ Done |
| 5 | Focus Mode | focus/page, FocusCard, Confetti, FocusCompanion | ✅ Done |
| 6 | Reader & TTS | read/page, ReaderView, VoiceSelectorSheet, TTSBar | ✅ Done |
| 7 | Profile & Settings | profile/page, onboarding, SettingsRow | ✅ Done |
| 8 | Polish & Performance | performance audit, a11y audit, PWA, error boundaries | ✅ Done |
| 9 | AI Intelligence | llmService, AISuggest, FocusCompanion wiring, Settings LLM config | ✅ Done |
