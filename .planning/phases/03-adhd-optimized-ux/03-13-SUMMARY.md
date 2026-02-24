---
phase: 03-adhd-optimized-ux
plan: 13
subsystem: ui
tags: [react, taskform, taskmodal, ux, lucide-react]

# Dependency graph
requires:
  - phase: 03-adhd-optimized-ux
    provides: TaskForm and TaskModal with auto-save on Escape/backdrop, Someday button in modal body
provides:
  - TaskForm isEditing prop conditionally hides Save/Cancel buttons in edit mode
  - TaskForm onSendToSomeday prop renders compact Someday button below DatePicker
  - TaskForm Enter-to-create onKeyDown on title input (create mode only)
  - TaskModal passes isEditing and onSendToSomeday to TaskForm; old modal Someday button removed
affects: [future TaskForm consumers, TaskModal UX]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - isEditing prop pattern to differentiate create vs edit rendering in shared form component
    - Compact inline action button (Someday) co-located with related form field (DatePicker)

key-files:
  created: []
  modified:
    - src/components/task/TaskForm.tsx
    - src/components/task/TaskModal.tsx

key-decisions:
  - "Actions bar hidden entirely in edit mode when onDelete is not provided (no empty sticky bar)"
  - "Someday button moved inside TaskForm near DatePicker — shorter label 'Someday' vs 'Send to Someday'"
  - "Enter-to-create only fires in create mode (!isEditing) to prevent accidental submission while editing"
  - "Archive icon imported into TaskForm; removed from TaskModal (no longer used in modal body)"

patterns-established:
  - "isEditing prop on TaskForm: controls visibility of Cancel/Save buttons and Enter-to-create behavior"
  - "onSendToSomeday optional prop on TaskForm: co-locates Someday action with DatePicker for spatial proximity"

requirements-completed: [ADHD-01, ADHD-04]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 03 Plan 13: Remove Save/Cancel in Edit Mode and Move Someday Button Summary

**Save/Cancel buttons hidden in edit mode (auto-save handles persistence), Enter-to-create added for new tasks, and Someday button moved from modal footer to below DatePicker with shorter "Someday" label**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-23T00:12:27Z
- **Completed:** 2026-02-23T00:14:18Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Edit mode now shows only the Delete button in the sticky actions bar — no redundant Save/Cancel since auto-save on Escape/backdrop already persists changes
- New task mode retains the Create button and adds Enter-to-create on the title input for faster keyboard-only task creation
- Someday button relocated from TaskModal body to TaskForm, rendered immediately below the DatePicker with compact "Someday" label (was "Send to Someday")

## Task Commits

Each task was committed atomically:

1. **Task 1: Hide Save/Cancel in edit mode, add Enter-to-create, move Someday button** - `8d2161f` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/task/TaskForm.tsx` - Added `isEditing` and `onSendToSomeday` props; conditional actions bar; Enter-to-create; Someday button after DatePicker; Archive icon import
- `src/components/task/TaskModal.tsx` - Passes `isEditing` and `onSendToSomeday` to TaskForm; removed old Someday button block; removed Archive import

## Decisions Made
- Actions div hidden entirely in edit mode when `onDelete` is not provided — avoids an empty sticky bar at the bottom of the form
- When `isEditing && onDelete`, the sticky bar still renders (with only Delete on the left, no right-side buttons) so the Delete action remains accessible
- Someday button label shortened to "Someday" (from "Send to Someday") for compactness near the DatePicker
- Archive icon moved from TaskModal to TaskForm imports since it is now only used in TaskForm
- Enter-to-create guard: `!isEditing` prevents accidental form submission when the user presses Enter while editing an existing task

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Edit modal UX is cleaner: auto-save is the only save mechanism in edit mode
- Create modal has keyboard-friendly Enter-to-create shortcut
- Someday button is spatially co-located with DatePicker for intuitive discovery

---
*Phase: 03-adhd-optimized-ux*
*Completed: 2026-02-23*

## Self-Check: PASSED

- src/components/task/TaskForm.tsx - FOUND
- src/components/task/TaskModal.tsx - FOUND
- .planning/phases/03-adhd-optimized-ux/03-13-SUMMARY.md - FOUND
- Commit 8d2161f - FOUND
