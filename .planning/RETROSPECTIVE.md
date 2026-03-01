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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~7 | 9 | Established gap closure + milestone audit pattern |

### Cumulative Quality

| Milestone | Plans | LOC | Files |
|-----------|-------|-----|-------|
| v1.0 | 52 | 6,945 | 62 |

### Top Lessons (Verified Across Milestones)

1. Milestone audit catches integration gaps that phase-level verification misses
2. Gap closure plans are most efficient when batched by subsystem
