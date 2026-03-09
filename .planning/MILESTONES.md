# Milestones

## v1.1 Deploy & Sync (Shipped: 2026-03-09)

**Phases completed:** 5 phases, 14 plans

**Key accomplishments:**
- Firebase project on Spark plan with deny-all Firestore security rules
- Google sign-in with auth gate, session persistence, and popup/redirect platform handling
- Bidirectional Dexie-Firestore sync with echo guard and last-write-wins conflict resolution
- Offline-first data migration preserving existing local tasks on first sign-in
- Deployed to taskpad-app.web.app with SPA routing and PWA cache headers
- Sync status indicator with silent retry, exponential backoff, and error recovery UX

**Stats:**
- Timeline: 3 days (2026-03-07 → 2026-03-09)
- Commits: 23
- Lines of code: 8,463 TypeScript (+1,558 from v1.0)
- Files changed: 18

---

## v1.0 MVP (Shipped: 2026-03-01)

**Phases completed:** 9 phases, 52 plans, 17 tasks

**Key accomplishments:**
- Calendar-based daily task management with drag-to-reschedule, inline editing, and category system
- AI-powered subtask generation with multi-provider support (Gemini/Claude/OpenAI) and recursive breakdown
- ADHD-optimized UX: energy tagging, AI time estimates, celebration animations, gentle reschedule prompts
- Cross-platform PWA with responsive mobile layout, swipe gestures, haptic feedback, and offline support
- Full celebration pipeline: swipe-complete triggers identical animation and haptic as checkbox completion
- Mobile Someday navigation, keyboard shortcuts toggle, and dead code cleanup

**Stats:**
- Timeline: 24 days (2026-02-05 → 2026-03-01)
- Commits: 234
- Lines of code: 6,945 TypeScript (62 files)
- Decimal phases: 01.1 (UI Polish), 02.1 (Gemini Model Selector)

---

