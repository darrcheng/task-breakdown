---
phase: quick
plan: "003"
subsystem: multiselect-dnd
tags: [multiselect, drag-and-drop, desktop-selection, ux]
dependency_graph:
  requires: [DndProvider, DraggableTask, TaskCard, TaskListItem, DayCell, DayGroup]
  provides: [MultiSelectProvider, useMultiSelectContext]
  affects: [calendar-view, list-view, dnd]
tech_stack:
  added: []
  patterns: [react-context-for-shared-selection, modifier-key-detection, group-drag-and-drop]
key_files:
  created: []
  modified:
    - src/hooks/useMultiSelect.ts
    - src/components/dnd/DndProvider.tsx
    - src/components/task/TaskCard.tsx
    - src/components/list/TaskListItem.tsx
    - src/components/list/DayGroup.tsx
    - src/components/calendar/DayCell.tsx
  deleted:
    - src/components/list/MultiSelectBar.tsx
decisions:
  - "Context provider instead of plain hook: both calendar/list views and DndProvider need shared selection state"
  - "Shift+click range restricted to same day: cross-day ranges are ambiguous with multiple day groups"
  - "Group drag skips same-day reorder: reordering multiple selected tasks within a day is ambiguous"
  - "No mode toggle: selection is always available via modifier keys (standard desktop UX)"
metrics:
  duration: "3m"
  completed: "2026-03-14"
---

# Quick Task 003: Multiselect and Batch Move Tasks Summary

Standard desktop multiselect (Ctrl+click toggle, Shift+click range) with group drag-and-drop across both calendar and list views, replacing the previous checkbox-based multiselect mode.

## What Was Built

### MultiSelectProvider (`src/hooks/useMultiSelect.ts`)
- React context-based provider exporting `MultiSelectProvider` and `useMultiSelectContext`
- Tracks `selectedIds: Set<number>`, `lastClickedId`, and `lastClickedDate` for range selection
- `handleTaskClick(task, event, dayTaskIds)` detects modifier keys:
  - **Ctrl/Cmd+click:** toggles individual task selection, returns `true` (prevent modal open)
  - **Shift+click (same day):** selects range between anchor and current task within `dayTaskIds`
  - **Shift+click (cross-day):** falls back to toggle behavior
  - **Plain click:** clears all selection, returns `false` (allow normal modal open)
  - **Escape key:** clears all selection via global keydown listener
- Deleted `MultiSelectBar.tsx` - checkbox UI replaced by modifier-key selection

### DndProvider Group Drag (`src/components/dnd/DndProvider.tsx`)
- Wraps children with `<MultiSelectProvider>` via inner `DndInner` component pattern
- `handleDragEnd`: when dragged task is in `selectedIds`, batch-moves ALL selected tasks to target date
- Same-day reorder skipped when dragging multiple selected tasks (ambiguous ordering)
- `DragOverlay` shows count badge (blue pill) when dragging multiple selected tasks

### TaskCard Selection (`src/components/task/TaskCard.tsx`)
- New `dayTaskIds` prop for shift+click range calculation
- Calls `handleTaskClick` before parent `onClick` - modifier clicks prevent modal open
- Selected tasks show `ring-2 ring-blue-400 bg-blue-50 border-blue-300` highlight

### TaskListItem Selection (`src/components/list/TaskListItem.tsx`)
- New `dayTaskIds` prop for shift+click range calculation
- Calls `handleMultiSelectClick` before parent `onClick` - same modifier key logic
- Selected tasks show identical blue ring highlight, overriding status-based colors

### DayCell & DayGroup Updates
- `DayCell` computes `dayTaskIds` from tasks array, passes to each `TaskCard`
- `DayGroup` computes `dayTaskIds` from tasks array, passes to each `TaskListItem`

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 87498db | feat(quick-003): rewrite useMultiSelect as context provider with Ctrl+click and Shift+click |
| 2 | 54503e4 | feat(quick-003): wire multiselect into both views with group drag support |
| 3 | cfea86e | feat: Escape key clears multiselect |

## Verification

- `npm run build` passes clean with no errors
- TypeScript compiles with no type errors
- No checkboxes, no toggle button, no MultiSelectBar visible
- Selection state shared across calendar view, list view, and DndProvider via context
