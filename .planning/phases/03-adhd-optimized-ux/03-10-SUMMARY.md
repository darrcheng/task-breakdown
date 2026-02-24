---
phase: 03-adhd-optimized-ux
plan: 10
subsystem: task-surfaces
tags: [someday, subtasks, ux, adhd, quick-actions]
dependency_graph:
  requires: [03-08, 03-09]
  provides: [someday-action-modal, someday-action-list, subtask-progress-card, subtask-progress-list]
  affects: [TaskModal, TaskListItem, TaskCard]
tech_stack:
  added: []
  patterns: [group-hover, liveQuery-reactive-count, isSomeday-pattern]
key_files:
  created: []
  modified:
    - src/components/task/TaskModal.tsx
    - src/components/list/TaskListItem.tsx
    - src/components/task/TaskCard.tsx
decisions:
  - "Someday button in modal placed between TaskForm and time estimate — visible for saved tasks only (isEditing)"
  - "List item Someday button uses group/group-hover for show-on-hover, stopPropagation prevents row click"
  - "useSubtasks(task.id ?? 0) — 0 fallback returns empty array safely when id undefined"
metrics:
  duration: "~2 min"
  completed: "2026-02-24"
  tasks: 2
  files: 3
---

# Phase 03 Plan 10: Someday Buttons and Subtask Progress Indicators Summary

Send-to-Someday quick actions on TaskModal and TaskListItem, plus reactive subtask count/progress badges on TaskCard and TaskListItem.

## What Was Built

### Task 1: Send to Someday — TaskModal and TaskListItem

**TaskModal.tsx:**
- Imported `Archive` from lucide-react
- Added `handleSendToSomeday` handler: `db.tasks.update(id, { isSomeday: true, updatedAt: new Date() })` then `onClose()`
- Rendered amber "Send to Someday" button between TaskForm and time estimate display, visible only for saved tasks (`isEditing`)

**TaskListItem.tsx:**
- Imported `Archive` from lucide-react
- Added `group` class to root div to enable group-hover pattern
- Added Archive button with `opacity-0 group-hover:opacity-100` after energy badge — `stopPropagation` prevents row click

### Task 2: Subtask Progress Indicators — TaskCard and TaskListItem

**TaskCard.tsx:**
- Imported `ListTree` from lucide-react, `useSubtasks` from db/hooks
- Queries `useSubtasks(task.id ?? 0)` — reactive via Dexie liveQuery
- Renders `done/total` badge with ListTree icon when `subtaskCount > 0`, after estimate and before ParentBadge

**TaskListItem.tsx:**
- Imported `ListTree` from lucide-react, `useSubtasks` from db/hooks
- Same query pattern — renders between energy badge and Someday button
- Slightly larger sizing (w-3.5 h-3.5, text-xs) compared to card (w-3 h-3, text-[10px])

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit`: 0 errors
- `npm run build`: success
- `isSomeday: true` confirmed in TaskModal.tsx and TaskListItem.tsx
- `useSubtasks` confirmed in TaskCard.tsx and TaskListItem.tsx

## Commits

- `0e82c43` feat(03-10): add Send to Someday buttons to TaskModal and TaskListItem
- `d963ffa` feat(03-10): add subtask count/progress indicators to TaskCard and TaskListItem

## Self-Check: PASSED
