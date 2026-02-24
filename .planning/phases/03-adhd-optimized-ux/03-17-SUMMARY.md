---
phase: 03-adhd-optimized-ux
plan: 17
subsystem: database
tags: [dexie, hooks, livequery, subtasks, calendar, list-view]

# Dependency graph
requires:
  - phase: 03-adhd-optimized-ux
    provides: AI breakdown producing subtasks with parentId set and same date as parent
provides:
  - Subtasks visible as independent task rows in calendar and list views
affects:
  - calendar view DayCell rendering
  - list view DayGroup rendering
  - useTasksByDate consumers
  - useTasksByDateRange consumers

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "!t.parentId preserved only in overdue/someday hooks where subtask independence is not desired"
    - "Date-based hooks (useTasksByDate, useTasksByDateRange) include subtasks so they display alongside parents"

key-files:
  created: []
  modified:
    - src/db/hooks.ts

key-decisions:
  - "Removed !t.parentId from useTasksByDate and useTasksByDateRange — subtasks with a date should appear as calendar/list rows alongside parent tasks"
  - "Preserved !t.parentId in useOverdueTasks — subtasks inherit parent's date and should not independently surface as overdue"
  - "Preserved !t.parentId in useSomedayTasks — subtasks are not independently someday-able"

patterns-established: []

requirements-completed: [TASK-07]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 03 Plan 17: Restore Subtask Calendar/List Visibility Summary

**Removed !t.parentId from date-query hooks so AI-generated subtasks appear as independent task rows in calendar and list views, restoring the feature incorrectly suppressed in commit 6cf4e30**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T08:02:29Z
- **Completed:** 2026-02-24T08:04:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Removed `!t.parentId` from `useTasksByDate` (showCompleted=false and showCompleted=true branches)
- Removed `!t.parentId` from `useTasksByDateRange` (showCompleted=false and showCompleted=true branches)
- Subtasks now appear as independent task rows in calendar day cells and list view DayGroups
- `useOverdueTasks` and `useSomedayTasks` retain `!t.parentId` — correct behavior preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove parentId filter from date query hooks** - `359df01` (fix)

**Plan metadata:** *(docs commit follows)*

## Files Created/Modified
- `src/db/hooks.ts` - Removed !t.parentId from useTasksByDate and useTasksByDateRange filter predicates (4 occurrences)

## Decisions Made
- Subtasks should appear in calendar and list views because they have their own date (inherited from parent during AI breakdown) and the user explicitly requested this feature
- Overdue and Someday views remain root-task-only to prevent subtask duplication in those specialized views

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Subtask visibility feature fully restored
- All 4 filter predicate changes verified with TypeScript and production build
- No further work needed for this gap closure

---
*Phase: 03-adhd-optimized-ux*
*Completed: 2026-02-24*
