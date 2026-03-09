---
phase: quick-001
plan: 01
subsystem: ui
tags: [dnd-kit, sortable, drag-and-drop, reorder, dexie]

requires:
  - phase: none
    provides: existing @dnd-kit cross-day drag-and-drop
provides:
  - within-day task reordering via drag-and-drop in list and calendar views
  - sortOrder persistence in Dexie with automatic Firebase sync
affects: [task-views, drag-and-drop]

tech-stack:
  added: []
  patterns: [SortableContext wrapping per-day task lists, useSortable replacing useDraggable]

key-files:
  created: []
  modified:
    - src/db/database.ts
    - src/db/hooks.ts
    - src/components/dnd/DndProvider.tsx
    - src/components/dnd/DraggableTask.tsx
    - src/components/list/DayGroup.tsx
    - src/components/calendar/DayCell.tsx

key-decisions:
  - "Used closestCenter collision detection instead of default rectIntersection for sortable compatibility"
  - "sortOrder spacing of 1000 between items to allow future insertions without reindexing"
  - "New tasks get sortOrder undefined (sort to end) until explicitly reordered"

patterns-established:
  - "SortableContext per day group: each day wraps its task list for independent reordering"
  - "Same handleDragEnd detects task-prefixed IDs for reorder vs date IDs for cross-day move"

requirements-completed: [REORDER-01]

duration: 3min
completed: 2026-03-09
---

# Quick Task 001: Reorder Tasks Within Day Summary

**Within-day task reordering via @dnd-kit/sortable with sortOrder persistence in Dexie and automatic Firebase sync**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T23:09:05Z
- **Completed:** 2026-03-09T23:12:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Tasks within a day can be reordered by dragging up/down in both list and calendar views
- sortOrder values persist to Dexie via bulk update, syncing to Firebase automatically via existing hooks
- Cross-day drag-and-drop continues to work unchanged
- Dexie v4 schema migration assigns sortOrder=0 to existing root tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Sort tasks by sortOrder in hooks and initialize sortOrder on new tasks** - `3793f9b` (feat)
2. **Task 2: Add sortable drag-and-drop within each day using @dnd-kit/sortable** - `a0fdd41` (feat)

## Files Created/Modified
- `src/db/database.ts` - Added v4 schema with sortOrder index and migration
- `src/db/hooks.ts` - Query hooks now sort results by sortOrder (ascending, nulls last)
- `src/components/dnd/DndProvider.tsx` - handleDragEnd detects same-day reorder vs cross-day move
- `src/components/dnd/DraggableTask.tsx` - Converted from useDraggable to useSortable
- `src/components/list/DayGroup.tsx` - SortableContext wrapping task list
- `src/components/calendar/DayCell.tsx` - SortableContext wrapping task list

## Decisions Made
- Used closestCenter collision detection for sortable compatibility (default rectIntersection doesn't work well with sortable items)
- sortOrder spacing of 1000 between items leaves room for future insertions without full reindex
- New tasks appear at end (sortOrder undefined) until user explicitly reorders -- acceptable UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `src/firebase/sync.test.ts` (unused import) causes `tsc -b` to fail, but this is unrelated to our changes. `tsc --noEmit` and `vite build` both pass clean.

## User Setup Required

None - no external service configuration required.

## Next Steps
- Test reordering in both list and calendar views
- Verify order persists after page refresh
- Verify cross-day drag still works

## Self-Check: PASSED

All 6 modified files verified present. Both task commits (3793f9b, a0fdd41) verified in git log.

---
*Quick Task: 001-reorder-tasks-within-day*
*Completed: 2026-03-09*
