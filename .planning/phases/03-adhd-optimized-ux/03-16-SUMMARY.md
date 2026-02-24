---
phase: 03-adhd-optimized-ux
plan: 16
subsystem: ui
tags: [react, typescript, combobox, modal, task-form]

# Dependency graph
requires:
  - phase: 03-adhd-optimized-ux
    provides: TaskInlineCreate with CategoryCombobox, TaskForm with Someday button, TaskModal with closingRef pattern
provides:
  - CategoryCombobox resets to placeholder after each inline task creation
  - Someday button labeled "Save for Someday" in TaskForm
  - closingRef pattern in TaskModal differentiates dismiss-triggered vs explicit submit
affects: [03-adhd-optimized-ux]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "closingRef flag: useRef(false) to distinguish dismiss-triggered vs explicit submit paths in async handlers"
    - "setCategoryId(0) after rapid-entry: reset controlled combobox state after each inline creation"

key-files:
  created: []
  modified:
    - src/components/task/TaskInlineCreate.tsx
    - src/components/task/TaskForm.tsx
    - src/components/task/TaskModal.tsx

key-decisions:
  - "closingRef.current set true BEFORE formRef.current?.submit() in backdrop/Escape handlers — async handleSubmit checks it after await to decide close vs stay"
  - "setCategoryId(0) added after setTitle('') in handleSubmit — resets CategoryCombobox to 'Select category...' placeholder for rapid entry"
  - "Someday button text changed from 'Someday' to 'Save for Someday' — matches UAT test expectation for clarity"

patterns-established:
  - "closingRef pattern: set flag before calling imperative form submit, check flag after async DB write to branch close vs stay"

requirements-completed: [TASK-07, ADHD-04]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 03 Plan 16: UAT Gap Closure — Category Reset, Someday Label, Modal Auto-Close Summary

**Three targeted UAT gap fixes: category combobox resets after inline create, Someday button renamed to "Save for Someday", and backdrop/Escape on new-task modal now creates task and closes modal**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T05:42:25Z
- **Completed:** 2026-02-24T05:43:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Category dropdown resets to "Select category..." placeholder after each inline task creation, enabling rapid multi-task entry
- Someday button label updated to "Save for Someday" for clarity (UAT test 5)
- Backdrop click or Escape on new-task modal creates the task AND closes the modal (UAT test 6)
- Explicit Enter/Create button still stays in modal to show BreakdownButton (existing behavior preserved)

## Task Commits

Each task was committed atomically:

1. **Task 1: Reset category dropdown after inline create** - `04952dc` (fix)
2. **Task 2: Rename Someday button and auto-close modal on dismiss-create** - `e91ab87` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/task/TaskInlineCreate.tsx` - Added `setCategoryId(0)` after `setTitle('')` in handleSubmit
- `src/components/task/TaskForm.tsx` - Changed Someday button text from "Someday" to "Save for Someday"
- `src/components/task/TaskModal.tsx` - Added closingRef pattern to differentiate dismiss-triggered vs explicit submit

## Decisions Made
- Used `closingRef` (`useRef(false)`) flag set before calling `formRef.current?.submit()` so the async `handleSubmit` function can check it after the DB write to decide whether to close or stay in modal.
- Reset of `closingRef.current = false` in both the `!saved` path (no title, just close) and in the async handler's close branch — prevents stale flag from affecting subsequent interactions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three UAT gaps from tests 3, 5, and 6 are resolved
- Phase 03 gap closure complete — application is ready for final UAT verification

## Self-Check: PASSED

- FOUND: src/components/task/TaskInlineCreate.tsx
- FOUND: src/components/task/TaskForm.tsx
- FOUND: src/components/task/TaskModal.tsx
- FOUND: .planning/phases/03-adhd-optimized-ux/03-16-SUMMARY.md
- FOUND commit: 04952dc (Task 1)
- FOUND commit: e91ab87 (Task 2)

---
*Phase: 03-adhd-optimized-ux*
*Completed: 2026-02-24*
