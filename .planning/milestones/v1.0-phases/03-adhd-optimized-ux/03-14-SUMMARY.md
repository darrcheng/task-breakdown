---
phase: 03-adhd-optimized-ux
plan: 14
subsystem: list-view
tags: [list-view, task-modal, feature-parity, ux]
dependency_graph:
  requires: []
  provides: [list-view-task-modal-parity]
  affects: [src/App.tsx, src/components/list/DayGroup.tsx]
tech_stack:
  added: []
  patterns: [prop-delegation, centered-modal-positioning]
key_files:
  created: []
  modified:
    - src/App.tsx
    - src/components/list/DayGroup.tsx
decisions:
  - "handleTaskClickList calls setModalState without clickPosition — uses centered modal positioning (else branch)"
  - "DayGroup delegates onTaskClick prop directly to TaskListItem.onClick — no intermediate state"
  - "TaskInlineEdit removed from DayGroup — dead code left in place per plan (cleanup is separate task)"
metrics:
  duration: ~1 min
  completed: 2026-02-24
  tasks_completed: 1
  files_modified: 2
requirements: [TASK-07, ADHD-01]
---

# Phase 03 Plan 14: List View Task Modal Parity Summary

**One-liner:** List view task clicks now open TaskModal with full features (subtask tree, AI breakdown, time estimates) by delegating to the same setModalState handler used by calendar view.

## What Was Built

Connected list view task clicks to the full TaskModal — previously clicking a task in list view opened a bare 46-line TaskInlineEdit wrapper with no subtask tree, no AI breakdown, and no time estimates. Now it opens the same TaskModal used by calendar view, giving instant feature parity.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Wire list view task click to open TaskModal | 45c0c43 | src/App.tsx, src/components/list/DayGroup.tsx |

## Changes Made

### src/App.tsx

Replaced the no-op `handleTaskClickList` handler:

```typescript
// Before — no-op
const handleTaskClickList = (_task: Task) => {
  // List view: handled inline by DayGroup/TaskInlineEdit
  // This is a no-op at App level for list view
};

// After — opens centered TaskModal
const handleTaskClickList = (task: Task) => {
  setModalState({ isOpen: true, date: task.date, task });
};
```

No `clickPosition` is passed — this means TaskModal uses its centered positioning (the else branch in positionStyle). Calendar view tasks open near the click; list view tasks open centered.

### src/components/list/DayGroup.tsx

Three changes:
1. Removed `TaskInlineEdit` import (line 7)
2. Added `onTaskClick` to destructured props (was declared in interface but not destructured)
3. Removed `editingTaskId` state and the conditional rendering branch — all tasks now render via `DraggableTask > TaskListItem` with `onClick={onTaskClick}`

```tsx
// Before — conditional branch with inline edit
tasks.map((task) =>
  editingTaskId === task.id ? (
    <TaskInlineEdit key={task.id} task={task} onClose={() => setEditingTaskId(null)} />
  ) : (
    <DraggableTask key={task.id} task={task}>
      <TaskListItem task={task} categoryMap={categoryMap} onClick={(t) => setEditingTaskId(t.id ?? null)} />
    </DraggableTask>
  )
)

// After — always DraggableTask with onTaskClick delegation
tasks.map((task) => (
  <DraggableTask key={task.id} task={task}>
    <TaskListItem task={task} categoryMap={categoryMap} onClick={onTaskClick} />
  </DraggableTask>
))
```

## Verification

- `npx tsc --noEmit` — passed, 0 errors
- `npm run build` — succeeded (3.36s, existing chunk size warning unrelated to this change)
- App.tsx: handleTaskClickList calls setModalState (not a no-op)
- DayGroup.tsx: no editingTaskId state, no TaskInlineEdit import, onTaskClick prop destructured and passed to TaskListItem

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- src/App.tsx modified: FOUND
- src/components/list/DayGroup.tsx modified: FOUND
- Commit 45c0c43: FOUND
