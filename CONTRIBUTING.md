# Contributing to VibeFlow

Thank you for your interest in contributing! VibeFlow is an open-source project, and contributions are welcome.

## Quick Start

```bash
git clone https://github.com/vibeflow/vibeflow.git
cd vibeflow
npm install
npm run dev
```

## Development Guidelines

### Code Style
- Use functional React components with hooks
- CSS variables for all design tokens (no hardcoded colors)
- Accessible by default — ARIA labels, keyboard navigation, focus states

### Commit Messages
```
feat: add voice transcription
fix: correct timer pause logic
docs: update README
refactor: extract llmService
```

### Pull Request Checklist
- [ ] `npm run build` passes
- [ ] No console errors in browser
- [ ] Touch targets ≥ 48×48px
- [ ] Color contrast ≥ 4.5:1

## Areas to Contribute

| Priority | Area | Description |
|----------|------|-------------|
| 🔴 High | AI Features | Better prompts, smarter suggestions |
| 🔴 High | TTS | Additional voices, pronunciation dictionary |
| 🟡 Medium | UI/UX | Animations, micro-interactions |
| 🟡 Medium | Accessibility | Screen reader testing, WCAG audit |
| 🟢 Low | Docs | Guides, tutorials, videos |

## Getting Help

Open an issue for bugs or feature requests. For questions, start a GitHub Discussion.

---

*Built with ❤️ for ADHD brains*