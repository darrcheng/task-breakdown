---
phase: quick
plan: "003"
subsystem: list-view
tags: [multiselect, batch-operations, ux]
dependency_graph:
  requires: [DatePicker, db.tasks, DayGroup, TaskListItem, ListView]
  provides: [useMultiSelect, MultiSelectBar]
  affects: [list-view]
tech_stack:
  added: []
  patterns: [custom-hook-for-selection-state, floating-action-bar, batch-db-updates]
key_files:
  created:
    - src/hooks/useMultiSelect.ts
    - src/components/list/MultiSelectBar.tsx
  modified:
    - src/components/list/ListView.tsx
    - src/components/list/DayGroup.tsx
    - src/components/list/TaskListItem.tsx
decisions:
  - "Used useState-based hook instead of context since ListView is the single consumer"
  - "Select-all uses dedicated selectAll method with toggle-all semantics (all selected -> deselect all, otherwise select all)"
  - "Multiselect toggle button hidden on mobile to avoid touch UX conflicts with swipe gestures"
metrics:
  duration: "3m"
  completed: "2026-03-14"
---

# Quick Task 003: Multiselect and Batch Move Tasks Summary

Multiselect mode with floating action bar for batch move-to-date and mark-done across day groups in list view, using useMultiSelect hook and inline DatePicker.

## What Was Built

### useMultiSelect Hook (`src/hooks/useMultiSelect.ts`)
- Manages `selectedIds: Set<number>` and `isMultiSelectActive` state
- Provides `toggleSelect`, `selectAll`, `clearSelection`, `enterMultiSelect`, `exitMultiSelect`
- `selectAll` implements toggle-all semantics: if all provided IDs are already selected, deselects them; otherwise selects all

### MultiSelectBar (`src/components/list/MultiSelectBar.tsx`)
- Fixed bottom bar (z-40) that appears when `selectedIds.size > 0`
- Shows "{N} selected" count with Clear button on the left
- "Mark done" secondary action button (batch status update to 'done')
- "Move to..." primary button that toggles an inline DatePicker popover above the bar
- On date selection: batch updates all selected tasks' date via `Promise.all` on `db.tasks.update`, then calls `onComplete` to exit multiselect

### ListView Changes (`src/components/list/ListView.tsx`)
- Integrates `useMultiSelect` hook
- Renders `CheckSquare` toggle button (bottom-left, desktop only) to enter/exit multiselect mode
- Threads `isMultiSelectActive`, `selectedIds`, `toggleSelect`, `selectAll` to DayGroup components
- Renders `MultiSelectBar` when multiselect is active
- Hides Today floating button when multiselect bar is showing (prevents overlap)

### DayGroup Changes (`src/components/list/DayGroup.tsx`)
- Accepts `isMultiSelectActive`, `selectedIds`, `onToggleSelect`, `onSelectAll` props
- Renders select-all checkbox in sticky day header when multiselect is active and day has tasks
- Threads multiselect props down to each TaskListItem (both mobile and desktop variants)

### TaskListItem Changes (`src/components/list/TaskListItem.tsx`)
- Accepts `isMultiSelectActive`, `isSelected`, `onToggleSelect` props
- Renders blue checkbox (rounded-sm, Check icon) as first element when multiselect active
- Selected rows get `bg-blue-50 border-blue-200` highlight
- Row click toggles selection instead of opening task modal when multiselect is active
- Checkbox click uses `stopPropagation` to prevent double-toggle

## Deviations from Plan

### Auto-added (Rule 2)
**1. Added `onSelectAll` prop to DayGroup**
- **Found during:** Task 2
- **Issue:** Plan specified using `onToggleSelect` for each ID in select-all, but calling toggle individually doesn't handle mixed selection state correctly
- **Fix:** Added `onSelectAll` prop that maps to `useMultiSelect.selectAll()` which has proper toggle-all semantics
- **Files modified:** `src/components/list/DayGroup.tsx`, `src/components/list/ListView.tsx`

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 992bb7e | feat(quick-003): add useMultiSelect hook and MultiSelectBar component |
| 2 | 42a020c | feat(quick-003): wire multiselect into ListView, DayGroup, and TaskListItem |

## Verification

- `npm run build` passes clean
- TypeScript compiles with no errors
