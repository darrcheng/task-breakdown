---
phase: 03-adhd-optimized-ux
plan: 07
subsystem: ui
tags: [react, forwardRef, useImperativeHandle, datepicker, modal, autosave]

# Dependency graph
requires:
  - phase: 03-adhd-optimized-ux
    provides: OverdueQuickPicker, TaskModal, TaskForm, DatePicker components
provides:
  - DatePicker defaultOpen and inline props for always-visible calendar rendering
  - OverdueQuickPicker inline calendar (no extra click or scroll needed)
  - TaskForm forwardRef pattern exposing submit() via useImperativeHandle
  - TaskModal auto-save on Escape/backdrop + post-create edit view with BreakdownButton visible
affects: [any future work on TaskModal, TaskForm, DatePicker, OverdueQuickPicker]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - forwardRef + useImperativeHandle pattern for exposing form submit() to parent
    - inline calendar rendering pattern (skip absolute positioning for embedded use)
    - handleBackdropClick pattern for auto-save before modal close

key-files:
  created: []
  modified:
    - src/components/task/DatePicker.tsx
    - src/components/overdue/OverdueQuickPicker.tsx
    - src/components/task/TaskForm.tsx
    - src/components/task/TaskModal.tsx

key-decisions:
  - "TaskFormHandle.submit() returns boolean — true if saved, false if empty title (allows caller to handle onClose manually)"
  - "Post-create stays in modal: handleSubmit create branch sets setNavigationOverride(newTask) instead of onClose() — BreakdownButton immediately visible"
  - "Backdrop and Escape auto-save only on final close path; back-to-parent navigation skips auto-save"
  - "DatePicker inline mode skips trigger button entirely and renders calendar as normal flow element with shadow-sm (not shadow-lg)"
  - "Stale tsbuildinfo cache caused false build error for pre-existing useBreakdown.ts change — fixed by deleting .tmp/tsconfig.app.tsbuildinfo"

patterns-established:
  - "forwardRef + useImperativeHandle: expose submit() returning boolean from TaskForm to TaskModal via formRef"
  - "inline DatePicker: pass inline={true} defaultOpen={true} for always-visible calendar grid with no trigger button"

requirements-completed: [ADHD-04, AI-01, TASK-04]

# Metrics
duration: 4min
completed: 2026-02-23
---

# Phase 03 Plan 07: UX Polish Gap Closure Summary

**Inline quick-picker calendar, post-create edit view showing BreakdownButton, and autosave on Escape/backdrop via forwardRef form handle**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-23T23:10:14Z
- **Completed:** 2026-02-23T23:13:28Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Quick picker calendar now renders inline in task row — no extra click or scroll needed
- Creating a new task keeps modal open in edit view with BreakdownButton immediately visible
- Pressing Escape or clicking backdrop outside modal saves unsaved form data before closing
- All existing TaskForm behavior preserved (button submit, validation, delete flow)

## Task Commits

1. **Task 1: Fix quick picker calendar UX and add autosave on modal close** - `79e03ac` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/task/DatePicker.tsx` - Added `defaultOpen` and `inline` props; inline mode renders calendar grid as flow element without trigger button
- `src/components/overdue/OverdueQuickPicker.tsx` - Uses `inline={true} defaultOpen={true}` DatePicker props so calendar appears immediately on click
- `src/components/task/TaskForm.tsx` - Converted to `forwardRef` exposing `submit(): boolean` via `useImperativeHandle`; returns false for empty title, true if saved
- `src/components/task/TaskModal.tsx` - Added `formRef`, `handleBackdropClick` (auto-save before close), post-create `setNavigationOverride(newTask)` stays in edit view

## Decisions Made
- `TaskFormHandle.submit()` returns `boolean` so callers know whether save occurred — if false, caller manually calls `onClose()`
- Post-create flow: `handleSubmit` create branch no longer calls `onClose()`, instead fetches newly created task and sets `navigationOverride` so BreakdownButton appears
- Auto-save applies only to the final close path; back-to-parent navigation (Escape when there is a parent) skips auto-save intentionally
- `inline` DatePicker uses `shadow-sm` (not `shadow-lg`) to feel embedded, not floating

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared stale tsbuildinfo cache causing false build failure**
- **Found during:** Task 1 verification
- **Issue:** `npm run build` (uses `tsc -b`) reported `isConfigured` unused in `useBreakdown.ts` even though that variable was already removed — stale `.tmp/tsconfig.app.tsbuildinfo` from prior working-tree changes
- **Fix:** Deleted `node_modules/.tmp/tsconfig.app.tsbuildinfo` to force full recheck
- **Files modified:** None (cache file only)
- **Verification:** `npm run build` succeeded cleanly after cache clear
- **Committed in:** n/a (cache is not tracked in git)

---

**Total deviations:** 1 auto-fixed (1 blocking — stale cache)
**Impact on plan:** No scope creep; cache fix was required for build verification to pass.

## Issues Encountered
- `tsc -b` used by `npm run build` was reading stale build info; `npx tsc --noEmit` passed cleanly because it bypasses the incremental cache. Cleared by deleting tsbuildinfo.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 minor UAT gaps (tests 9 and 12 from Phase 03 UAT) are now closed
- Phase 3 gap closure work complete — ready for Phase 4 or further UAT verification

---
*Phase: 03-adhd-optimized-ux*
*Completed: 2026-02-23*
