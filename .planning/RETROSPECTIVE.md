# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-01
**Phases:** 9 (7 integer + 2 decimal insertions) | **Plans:** 52 | **Sessions:** ~7

### What Was Built
- Calendar-based daily task management with drag-to-reschedule and category system
- AI-powered subtask generation with Gemini/Claude/OpenAI provider abstraction and 5 Gemini model options
- ADHD-optimized UX: energy tagging, AI time estimates, celebration animations, gentle reschedule prompts, Someday view
- Cross-platform PWA with responsive mobile layout, bottom sheet modals, swipe gestures, haptic feedback
- Full celebration pipeline unifying checkbox and swipe-complete paths

### What Worked
- Gap closure pattern: UAT after each major phase caught real issues; dedicated gap closure plans fixed them incrementally
- Decimal phase insertions (01.1, 02.1) handled urgent mid-milestone work cleanly without disrupting phase numbering
- Milestone audit before completion caught 5 integration gaps that became Phases 5-7 — prevented shipping with broken secondary paths
- Per-cell reactive queries (Dexie useLiveQuery) scaled well across calendar, list, and mobile views
- Departing state machine pattern gave smooth, cancellable completion animations

### What Was Inefficient
- Phase 3 required 17 plans (10 gap closures) — ADHD UX features had many subtle animation/timing interactions that only surfaced during manual testing
- Phase 4 plans 04-01 through 04-05 executed via quick path without SUMMARY.md files — lost execution history
- Some gap closure plans addressed single-line fixes that could have been batched more aggressively
- 3 requirements (AI-02, AI-03, AI-05) had checkbox lag in REQUIREMENTS.md despite being verified — doc maintenance fell behind

### Patterns Established
- Double-rAF for CSS transition sequencing (ring glow → opacity fade)
- onRegisterComplete callback pattern for parent-controlled child animation triggers
- displayStatus local state for optimistic UI during deferred DB writes
- closingRef pattern for modal backdrop/Escape → form submit → conditional close flow
- Custom DOM events (taskbreaker:inline-create) for decoupled component communication

### Key Lessons
1. Animation state machines need explicit phase transitions — CSS alone causes race conditions with React re-renders
2. Gap closure plans are most efficient when batched by subsystem rather than one-fix-per-plan
3. Milestone audit is essential before shipping — code-level verification misses cross-phase integration gaps
4. Provider abstraction pays off early — adding Gemini model selection was a 1-plan insertion because the interface was clean
5. Settling phases in animations (extra delay before removing component) cause more problems than they solve — direct transitions are cleaner

### Cost Observations
- Model mix: Primarily balanced profile (sonnet for agents, opus for orchestration)
- Sessions: ~7 active development days over 24 calendar days
- Notable: 52 plans in 9 phases completed efficiently; gap closure plans averaged ~2 min each

---

## Milestone: v1.1 — Deploy & Sync

**Shipped:** 2026-03-09
**Phases:** 5 | **Plans:** 14 | **Sessions:** ~3

### What Was Built
- Firebase project setup with Spark plan and deny-all security rules
- Google sign-in with auth gate, session persistence, and popup mode across all platforms
- Bidirectional Dexie-Firestore sync engine with echo guard and LWW conflict resolution
- Offline-first data migration preserving local tasks on first sign-in
- Firebase Hosting deployment at taskpad-app.web.app with SPA routing and PWA cache headers
- Sync status indicator with silent retry, exponential backoff, and error recovery UX

### What Worked
- Dexie-as-sole-UI-source architecture meant zero component changes for sync — all sync logic lives in one module
- Echo guard via `hasPendingWrites` metadata eliminated infinite sync loops without complex debouncing
- Milestone audit caught the orphaned `redirectResultPromise` and AUTH-06 concern — manual iOS test confirmed popup works everywhere
- Phase 10 gap closure (10-06) caught the `db.delete()` Dexie connection destruction before it shipped — per-table `clear()` was the right fix
- 3-day execution for 5 phases demonstrates that well-scoped phases with clear success criteria execute fast

### What Was Inefficient
- AUTH-06 redirect flow was built in auth.ts but never wired — the audit flagged it as a gap, but manual testing showed popup works on iOS Safari standalone, making the redirect code dead weight
- SETUP-01/SETUP-02 checkboxes weren't updated when implementation was verified — cosmetic doc maintenance still lags
- Phase 10 had 6 plans including a gap closure — the spike task pattern (10-01 for contracts) was valuable but 10-05 (manual verification checkpoint) could have been merged with 10-04

### Patterns Established
- `useSyncExternalStore` for external state subscriptions (sync status) — tear-safe, concurrent-mode ready
- Silent retry with exponential backoff before surfacing errors to users
- Firestore as sync transport only, not UI data source — keeps offline-first guarantee
- `String(task.id)` for Firestore doc IDs, `Number(doc.id)` on inbound — simple ID mapping

### Key Lessons
1. Popup auth works everywhere including iOS Safari standalone — redirect flow was unnecessary complexity
2. Sync architecture decisions (Dexie as sole read source) made in Phase 10 research prevented cascading component changes
3. 3-day milestone execution is possible when prior milestone established stable patterns and clear architecture
4. Milestone audit is still essential — even with clean execution, it caught cosmetic gaps and validated the iOS auth concern

### Cost Observations
- Model mix: Balanced profile (sonnet agents, opus orchestration)
- Sessions: 3 active development days
- Notable: 14 plans in 5 phases; entire sync engine from zero to production in 3 days

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~7 | 9 | Established gap closure + milestone audit pattern |
| v1.1 | ~3 | 5 | Confirmed audit pattern; 3-day execution with clear architecture |

### Cumulative Quality

| Milestone | Plans | LOC | Files |
|-----------|-------|-----|-------|
| v1.0 | 52 | 6,945 | 62 |
| v1.1 | 14 | 8,463 | 80 |

### Top Lessons (Verified Across Milestones)

1. Milestone audit catches integration gaps that phase-level verification misses (v1.0: 5 gaps, v1.1: AUTH-06 concern resolved)
2. Gap closure plans are most efficient when batched by subsystem
3. Architecture decisions in research phase prevent cascading changes during execution (v1.1: zero component changes for sync)
4. Doc maintenance (checkboxes, traceability) consistently lags behind implementation — build into phase completion checklist
