---
status: diagnosed
trigger: "Breadcrumb 'Back to [parent name]' missing when opening subtask directly from calendar/board view"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - breadcrumb relies entirely on in-modal navigation state (parentStack), never consults the task's own parentId field
test: traced all code paths that populate parentStack and render breadcrumb
expecting: parentStack is only populated via handleOpenSubtask drill-down within the modal
next_action: return diagnosis

## Symptoms

expected: When opening a subtask modal (from calendar or board view), a "Back to [parent name]" breadcrumb should appear allowing navigation to the parent task
actual: The breadcrumb only appears when navigating into a subtask from within a parent task's modal (via SubtaskList click). Opening a subtask directly from the calendar/board view shows no breadcrumb.
errors: None (silent missing UI element)
reproduction: 1) Create a parent task with subtasks. 2) Click a subtask directly in the calendar day cell. 3) Observe no breadcrumb. 4) Instead, open the parent task, then click into a subtask via the SubtaskList -- breadcrumb appears.
started: Since subtask feature was implemented (this is a design gap, not a regression)

## Eliminated

(none -- initial hypothesis was correct)

## Evidence

- timestamp: 2026-02-22T00:01:00Z
  checked: TaskModal.tsx breadcrumb rendering condition (line 157)
  found: Breadcrumb renders only when `parentStack.length > 0`. parentStack is a React state array initialized to `[]`.
  implication: Breadcrumb visibility depends entirely on parentStack having entries.

- timestamp: 2026-02-22T00:02:00Z
  checked: How parentStack gets populated (lines 100-106)
  found: parentStack is only modified in `handleOpenSubtask()`, which pushes the currentTask onto the stack when a subtask is clicked within the SubtaskList inside the modal. This is the ONLY code path that adds to parentStack.
  implication: parentStack is purely an in-modal navigation stack. It is never populated from external data.

- timestamp: 2026-02-22T00:03:00Z
  checked: TaskModal useEffect reset (lines 31-37)
  found: When the modal opens (isOpen/task changes), parentStack is explicitly reset to `[]` via `setParentStack([])`. So even if somehow populated, it would be cleared on open.
  implication: Every fresh modal open starts with empty parentStack, guaranteeing no breadcrumb.

- timestamp: 2026-02-22T00:04:00Z
  checked: App.tsx handleTaskClickCalendar (line 111-114)
  found: `handleTaskClickCalendar` passes the clicked task directly to modalState as `task`. No parent lookup occurs. The Task object has a `parentId` field but it is never consulted.
  implication: When a subtask is clicked in the calendar, it opens the modal with just that subtask -- no parent context.

- timestamp: 2026-02-22T00:05:00Z
  checked: Task type definition (types/index.ts lines 6-18)
  found: Task has `parentId?: number` field which links subtask to parent. This data IS available on every subtask object.
  implication: The parentId is available on the task itself -- it just isn't used by the modal to establish parent context.

- timestamp: 2026-02-22T00:06:00Z
  checked: useTasksByDate hook (db/hooks.ts lines 9-20)
  found: The hook queries ALL tasks for a date with no parentId filter. Subtasks appear alongside root tasks in the calendar day cell.
  implication: Subtasks ARE visible and clickable in the calendar view, confirming users can and will click them directly.

- timestamp: 2026-02-22T00:07:00Z
  checked: Breadcrumb text (line 163)
  found: Breadcrumb currently shows generic "Back to parent" text, not the actual parent task name. Even when it does appear (via drill-down), it doesn't show the parent's title.
  implication: Secondary issue -- even the existing breadcrumb could be improved to show the parent task name.

## Resolution

root_cause: |
  The breadcrumb in TaskModal relies entirely on `parentStack`, a React state array that is only
  populated when a user drills down from a parent task into a subtask via the SubtaskList component
  within the modal (handleOpenSubtask on line 100). When a subtask is opened directly from the
  calendar or board view, the modal opens fresh with parentStack reset to [] (line 33), so the
  breadcrumb condition `parentStack.length > 0` (line 157) is never satisfied.

  The task's own `parentId` field -- which IS present on every subtask -- is never consulted by
  the modal to establish parent context. This is a design gap: the modal only knows about
  parent-child relationships through runtime navigation state, not through the data model.

fix_direction: |
  1. In TaskModal, when the modal opens with a task that has a `parentId`, fetch the parent task
     from the database using `db.tasks.get(task.parentId)`.
  2. If a parent is found and parentStack is empty (i.e., not already navigating via drill-down),
     pre-populate parentStack with the fetched parent task, OR use a separate state/derived value
     for the breadcrumb.
  3. Update the breadcrumb text from generic "Back to parent" to include the parent task's title:
     "Back to {parentTask.title}".
  4. The handleBackToParent function should navigate to the parent task modal view when the
     breadcrumb is clicked (it already does this via parentStack).

  Recommended approach (using useLiveQuery for reactivity):
  ```tsx
  // Add near line 40 in TaskModal:
  const parentTask = useLiveQuery(
    () => (currentTask?.parentId ? db.tasks.get(currentTask.parentId) : undefined),
    [currentTask?.parentId],
  );

  // Update breadcrumb condition (line 157) from:
  //   {parentStack.length > 0 && (
  // to:
  //   {(parentStack.length > 0 || parentTask) && (

  // Update handleBackToParent to handle both cases:
  // - If parentStack has entries, pop from stack (existing behavior)
  // - If parentStack is empty but parentTask exists, navigate to parentTask

  // Update breadcrumb text (line 163) from:
  //   Back to parent
  // to:
  //   Back to {parentStack.length > 0 ? parentStack[parentStack.length - 1].title : parentTask?.title ?? 'parent'}
  ```

verification: not yet applied
files_changed: []
