---
phase: 05-swipe-complete-celebration-pipeline
plan: "02"
subsystem: ui
tags: [react, animation, dexie, useCallback, departure-animation, swipe]

# Dependency graph
requires:
  - phase: 05-01
    provides: onRegisterComplete/triggerComplete wiring for swipe-complete

provides:
  - triggerComplete force-completes any task to done regardless of current status (todo, in-progress, done)
  - No settling phase -- flash-back eliminated; task fades once and stays gone
  - departingPhase type narrowed to 'ring' | 'fade' | null

affects:
  - Any future TaskListItem animation changes
  - swipe-complete behavior in DaySwipeView/SwipeableTaskRow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Force-complete pattern: triggerComplete skips getNextStatus entirely, always sets done
    - DB-write-before-unmount: setDepartingPhase(null) + db.tasks.update fires directly after 1500ms fade, no intermediate settling phase

key-files:
  created: []
  modified:
    - src/components/list/TaskListItem.tsx

key-decisions:
  - "triggerComplete no longer calls getNextStatus -- it force-completes to done regardless of current status, eliminating the silent no-op for todo tasks"
  - "Settling phase removed entirely -- after 1500ms fade (task at opacity-0), setDepartingPhase(null) and DB write fire immediately; no 400ms settling window where opacity restores and causes flash-back"
  - "settlingTimeout ref kept in unmount cleanup but never set in triggerComplete -- harmless no-op that preserves cleanup safety"

patterns-established:
  - "triggerComplete always means mark-done-with-celebration: no status condition guards"

requirements-completed: [TASK-07, ADHD-03]

# Metrics
duration: 1min
completed: 2026-03-01
---

# Phase 05 Plan 02: Fix triggerComplete -- Force-Complete and No Flash-Back Summary

**Force-complete any task to done (including todo status) and eliminate flash-back animation by removing the settling phase and writing DB immediately after 1500ms fade**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T18:49:45Z
- **Completed:** 2026-03-01T18:51:27Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed Bug 1: triggerComplete now force-completes to done for ANY task status (was silently no-op for todo tasks due to getNextStatus guard)
- Fixed Bug 2: Eliminated flash-back animation by removing the settling phase -- task fades out once and stays invisible until DB write unmounts it
- Narrowed departingPhase type union from 'ring' | 'fade' | 'settling' | null to 'ring' | 'fade' | null
- TypeScript compiles clean, production build passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix triggerComplete to force-complete any status and eliminate flash-back** - `638c2f7` (fix)

**Plan metadata:** _(docs commit pending)_

## Files Created/Modified
- `src/components/list/TaskListItem.tsx` - Removed getNextStatus guard from triggerComplete, removed settling phase, updated deps to [task.id, departing], removed 'settling' from type union and CSS clsx block

## Decisions Made
- Removed getNextStatus guard entirely from triggerComplete. The function's contract is "complete this task" so it should always go to done. handleStatusClick still uses getNextStatus for the non-done cycling (todo -> in-progress via else branch).
- Removed the settling phase entirely. The rationale: the ring is already invisible at opacity-0 after the 1500ms transition. There is nothing left to "settle" -- the ring glow has already faded. Settling was causing a visible 300ms flash-back as opacity restored before the DB write could unmount the component.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both UAT blockers from Phase 05 are resolved: swipe Done now works for todo tasks, flash-back eliminated
- UAT can be re-run to verify the fixes
- Phase 05 gap closure complete

## Self-Check: PASSED

- FOUND: src/components/list/TaskListItem.tsx
- FOUND: .planning/phases/05-swipe-complete-celebration-pipeline/05-02-SUMMARY.md
- FOUND commit: 638c2f7

---
*Phase: 05-swipe-complete-celebration-pipeline*
*Completed: 2026-03-01*
