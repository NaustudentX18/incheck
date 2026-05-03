# ADHD Vibe App — Design System (ui-ux-pro-max)

## Product Profile
- **Type:** Productivity / Tool (ADHD-focused voice capture + TTS)
- **Audience:** ADHD developers who vibe code, think faster than they type
- **Style:** Dark, calm, low-stimulation, warm accents
- **Mood:** "Deep focus mode meets cozy cave"

## Design Pattern: Mobile-First Productivity Tool

### Layout
- Single-page app with bottom tab navigation (4 tabs max)
- Max content width: 430px (centered on larger screens)
- 8dp spacing rhythm throughout
- Touch targets: minimum 44×44px
- Safe area padding for notched devices

### Visual Style
- **Aesthetic:** Modern dark UI with subtle warmth
- **Surfaces:** Multi-layer depth (background → card → elevated)
- **Borders:** Subtle, low-contrast dividers
- **Shadows:** Soft glow for accent elements only

## Color Palette

### Surface Layers
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | #0a0a0f | App background |
| `--bg-surface` | #13131c | Cards, panels |
| `--bg-elevated` | #1a1a26 | Hover states, modals |
| `--bg-overlay` | #22222f | Highest elevation |

### Accent (Amber)
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | #f59e0b | Primary CTA, mic button |
| `--accent-glow` | #f59e0b33 | Glow shadows |
| `--accent-hover` | #fbbf24 | Hover states |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | #f4f4f5 | Body text, headings |
| `--text-secondary` | #a1a1aa | Supporting text |
| `--text-tertiary` | #71717a | Captions, timestamps |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | #34d399 | Completions, progress |
| `--focus` | #8b5cf6 | Focus ring, timers |
| `--error` | #f87171 | Errors (not used in MVP) |

## Typography

### Font Stack
- **Display:** Outfit (geometric, modern, friendly)
- **Body:** Inter (readable, clean)
- **Mono:** JetBrains Mono (code snippets)

### Type Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xs` | 12px | 400 | Timestamps |
| `--text-sm` | 14px | 400 | Meta text |
| `--text-base` | 16px | 400 | Body (prevents iOS zoom) |
| `--text-lg` | 18px | 500 | Subtitles |
| `--text-xl` | 20px | 600 | Section headers |
| `--text-2xl` | 24px | 600 | Page titles |
| `--text-3xl` | 30px | 700 | Hero text |

### Line Heights
- Tight: 1.25 (headings)
- Normal: 1.5 (body)
- Relaxed: 1.75 (reading content)

## Spacing (8dp System)
`4 → 8 → 12 → 16 → 20 → 24 → 32 → 40 → 48 → 64`

## Motion

### Durations (per ui-ux-pro-max)
| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Micro-interactions |
| `--duration-normal` | 150ms | Button feedback |
| `--duration-slow` | 250ms | Page transitions |
| `--duration-enter` | 200ms | Content entrance |
| `--duration-exit` | 150ms | Content exit (75% of enter) |

### Easing
- Enter: ease-out (decelerate in)
- Exit: ease-in (accelerate out)
- State changes: ease-in-out

## Components

### Voice Capture Button
- Size: 140×140px (exceeds 44px minimum for comfort)
- States: default (pulse), recording (solid + ring), processing (spinner)
- Touch feedback: scale 0.98 on press
- Glow animation: subtle pulse when idle

### Tab Bar
- Height: 64px + safe-area-bottom
- Items: 4 max (Capture, Library, Focus, Settings)
- Active indicator: accent color + filled icon
- Inactive: tertiary text + outline icon

### Cards
- Border radius: 14px (--radius-lg)
- Padding: 16px
- Background: --bg-surface
- Hover: --bg-elevated
- Press: scale 0.98

### Timer Display
- Circular progress ring: 200px diameter
- Stroke width: 6px
- Background stroke: --bg-elevated
- Fill stroke: --accent-primary (--success during break)

## Accessibility

### Touch Targets
- Minimum: 44×44px (Apple HIG)
- Recommended: 48×48px
- All buttons meet minimum

### Color Contrast
- All text pairs: 4.5:1+ (WCAG AA)
- Verified: --text-primary on --bg-base
- Verified: --text-secondary on --bg-surface

### Focus States
- Focus ring: 2px solid --focus
- Offset: 2px
- Visible on keyboard navigation

### Reduced Motion
- All animations respect `prefers-reduced-motion`
- Pulse animations reduce to opacity-only
- No motion on `reduce` preference

## Anti-Patterns Avoided
- ❌ Emoji as icons (using SVG)
- ❌ Horizontal scroll
- ❌ Text under 12px body
- ❌ Touch targets under 44px
- ❌ Instant state changes (no transitions)
- ❌ Color-only meaning (icons + text)
- ❌ Hover-only interactions (works on tap)