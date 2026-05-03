# InCheck — SPEC.md

## 1. Concept & Vision

**What it does:** Voice-first capture + AI organization + TTS document reading for ADHD brains that think faster than they can type.

**Core experience:** Tap mic, ramble your chaotic thoughts. AI organizes into tasks. Feed it docs, listen hands-free. Built for brains that think faster than fingers can type.

**Personality:** Calm. Non-judgmental. No guilt spirals. Just vibes and getting things done.

---

## 2. Design Language

### Aesthetic Direction
"Deep focus mode meets cozy cave." Dark, warm, low-stimulation. Like coding at 2am with lo-fi on.

### Color Palette
```
--bg-deep:      #0d0d12      /* near-black, main background */
--bg-surface:   #16161d      /* card/surface background */
--bg-elevated:  #1e1e28      /* elevated elements, hover states */
--accent-warm:  #f59e0b      /* amber — primary accent, CTAs */
--accent-glow:  #fbbf24      /* lighter amber for glows */
--text-primary: #f4f4f5       /* warm white */
--text-muted:   #71717a       /* muted gray */
--success:      #10b981       /* green for completions */
--focus-ring:   #8b5cf6       /* purple focus indicators */
```

### Typography
- **Headings:** "Outfit" (Google Font) — geometric, modern, friendly
- **Body:** "Inter" — readable, clean
- **Mono:** "JetBrains Mono" — for code snippets

### Spatial System
- Base unit: 4px
- Card padding: 16-24px
- Section gaps: 32-48px
- Border radius: 12-16px (rounded, soft)

### Motion Philosophy
- Micro-interactions: 150ms ease-out
- Page transitions: 200ms ease-in-out
- Loading states: subtle pulse animation
- Voice recording: pulsing ring animation (breathing)
- No jarring movements — everything smooth

### Visual Assets
- Icons: Lucide React
- Decorative: subtle gradient orbs, grain texture overlay
- Voice waveform: animated bars during recording

---

## 3. Layout & Structure

### Mobile-First PWA
- Single-page app, tabbed navigation
- Bottom tab bar: Capture | Library | Focus | Settings
- Large touch targets (min 48px)
- Swipe gestures for common actions

### Core Screens

#### 1. Capture (Home)
- Giant mic button (center, pulsing when ready)
- Recent captures list (below)
- Quick actions: brain dump, task capture, idea note
- 2-tap max to start recording

#### 2. Library
- Documents tab: uploaded PDFs, EPUBs, txt files
- Notes tab: captured brain dumps + AI extractions
- Voice recordings tab: raw audio + transcripts
- Search across everything

#### 3. Focus
- Timer display (Pomodoro or custom)
- Current task context
- Voice coach toggle
- Minimal distractions

#### 4. Settings
- Voice model selection
- TTS voice/personality
- Theme toggle (dark only initially)
- Data export

---

## 4. Features & Interactions

### Voice Capture
- **Trigger:** Tap mic button or hold (hardware button on supported devices)
- **Recording states:** Ready (pulse), Recording (solid + waveform), Processing (spinner)
- **Output:** Auto-transcribe + AI extract into tasks/notes/ideas
- **Ramble time:** Up to 10 minutes continuous
- **Post-capture:** Show organized result, tap to expand details

### Document TTS (ElevenReader-inspired)
- **Upload:** Drag-drop or file picker (PDF, EPUB, TXT, MD)
- **Playback controls:** Play/Pause, Skip 15s, Speed (0.5x-3x), Skip chapter
- **Synced highlighting:** Current sentence/paragraph highlighted
- **Bookmark:** Tap to mark, easy navigation
- **Pronunciation dictionary:** Add custom pronunciations for tech terms
- **Background playback:** Continue listening with screen off

### AI Organization
- **Task extraction:** Pull actionable items from brain dumps
- **Auto-tagging:** Project, context, energy level
- **Priority ranking:** By deadline, importance, energy cost
- **Micro-step breakdown:** "organize garage" → 5 concrete steps

### ADHD-Specific UX
- **No daily streak punishment** — gentle nudges, no guilt
- **3-item daily focus** — pick top 3, everything else waits
- **Hyperfocus mode** — quick voice capture without breaking flow
- **Body doubling timer** — optional ambient presence

---

## 5. Component Inventory

### VoiceCaptureButton
- **Default:** Pulsing ring, mic icon, warm amber
- **Recording:** Solid fill, animated waveform, "Tap to stop"
- **Processing:** Spinner, "Thinking..."
- **Error:** Red outline, retry prompt

### DocumentCard
- **Default:** Cover thumbnail, title, progress bar (if in progress)
- **Hover/Press:** Slight lift, show play button overlay
- **Active:** Playing indicator, audio waveform mini

### TaskItem
- **Default:** Checkbox, title, project tag
- **Completed:** Strikethrough, muted color
- **Swipe actions:** Delete, edit, reschedule

### BrainDumpCard
- **Default:** Preview text, timestamp, extraction count
- **Expanded:** Full transcript, extracted tasks, action buttons

### TimerDisplay
- **Running:** Large time, pulse animation
- **Break:** Different color (green tint)
- **Completed:** Celebration micro-animation

---

## 6. Technical Approach

### Stack
- **Framework:** React 18 + Vite (PWA)
- **Styling:** CSS Modules or vanilla CSS with custom properties
- **State:** Zustand or React Context
- **Storage:** IndexedDB (local-first), optional cloud sync later
- **PWA:** Service worker for offline, manifest for install

### AI Integration (Phase 1)
- **STT:** Web Speech API (on-device) or external service
- **LLM:** Ollama direct API (localhost:11434) — mistral:7b primary, qwen3:8b for deep work
- **TTS:** Kokoro TTS (local Pi 5 server on :8080), fal.ai fallback, Web Speech API last resort

### Data Model
```
User
  - id, name, preferences

Capture
  - id, type (voice|text|doc), content, transcript?, ai_extraction?, created_at

Task
  - id, title, project?, energy_cost?, priority?, completed, capture_id?

Document
  - id, title, type (pdf|epub|txt), content, tts_position?, bookmarks[]

Settings
  - voice_model, tts_voice, theme, energy_peak_hours
```

### Key Technical Decisions
- **Offline-first:** All data in IndexedDB, sync when online
- **No account required for MVP:** LocalStorage/IndexedDB only
- **PWA installable:** Add to home screen, works offline
- **Privacy:** No data leaves device unless user explicitly shares

---

## 7. Phase 1 Scope (MVP)

### Must Have
- [ ] Voice capture with transcription
- [ ] Simple AI task extraction (basic keyword/NLP)
- [ ] Document upload (TXT, MD)
- [ ] TTS playback with speed control
- [ ] Local storage (IndexedDB)
- [ ] PWA manifest + service worker

### Nice to Have (Phase 2)
- [ ] PDF/EPUB parsing
- [ ] Advanced AI (LLM-powered extraction)
- [ ] Apple Watch / hardware button support
- [ ] Cloud sync
- [ ] Custom voice design (ElevenLabs)

---

## 8. Success Metrics (for later)

- Time from idea to captured: < 2 seconds
- Daily active users with 3+ captures
- Average session length
- Documents started vs completed
- Retention (day 7, day 30)