---
status: resolved
trigger: "SubtaskList status checkbox changes color but TaskModal still shows old status"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED -- TaskForm uses useState to initialize from initialData but never syncs when initialData changes; the DB write IS succeeding but the form ignores updated props
test: Code trace through SubtaskRow.handleStatusClick -> db.tasks.update -> useLiveQuery -> TaskModal -> TaskForm
expecting: N/A -- root cause confirmed
next_action: Report findings

## Symptoms

expected: Clicking subtask status checkbox in SubtaskList persists the new status; opening subtask modal reflects the updated status
actual: Checkbox visually changes color (e.g. to in-progress amber) but opening the subtask's own modal still shows "to-do"
errors: None (silent data display mismatch)
reproduction: 1) Open a parent task modal that has subtasks. 2) Click a subtask's status checkbox (changes color to amber/in-progress). 3) Click the subtask title to open it in the modal. 4) Observe status field still shows "To do".
started: Since SubtaskList was implemented

## Eliminated

- hypothesis: "db.tasks.update() is never called for non-done status transitions"
  evidence: Line 158-161 of SubtaskList.tsx clearly calls `await db.tasks.update(subtask.id, { status: nextStatus, updatedAt: new Date() })` in the else branch (non-done transitions). The DB write IS happening.
  timestamp: 2026-02-22

- hypothesis: "The status field name or format differs between write and read"
  evidence: Both SubtaskList (write) and TaskForm (read) use the same `TaskStatus` type ('todo' | 'in-progress' | 'done'). The field is named `status` in both places. No format mismatch.
  timestamp: 2026-02-22

- hypothesis: "useLiveQuery doesn't detect the status update"
  evidence: Dexie's useLiveQuery detects any mutation to observed tables. The useSubtasks hook (hooks.ts:79-86) and the liveTask query in TaskModal (lines 40-43) both use useLiveQuery. When db.tasks.update() runs, both queries re-fire and return fresh data. The issue is downstream -- TaskForm ignores the fresh data.
  timestamp: 2026-02-22

## Evidence

- timestamp: 2026-02-22
  checked: SubtaskRow.handleStatusClick (SubtaskList.tsx lines 119-163)
  found: |
    The status cycling logic correctly computes the next status via nextMap (line 138-142).
    For non-done transitions (todo->in-progress), the else branch (lines 156-162) calls:
      1. setDisplayStatus(nextStatus) -- local visual update
      2. await db.tasks.update(subtask.id, { status: nextStatus, updatedAt: new Date() }) -- DB persist
    For done transitions, the DB write happens after a 1500ms timeout (line 148-155).
    The DB write IS present and IS awaited. The status IS persisting to Dexie.
  implication: The bug is NOT about the write side. The status change does persist to the database.

- timestamp: 2026-02-22
  checked: TaskModal.handleOpenSubtask (TaskModal.tsx lines 100-106)
  found: |
    When user clicks a subtask title, handleOpenSubtask receives the subtask object from
    SubtaskList's render. It calls setViewingTask(subtask). The subtask object may be stale
    if useLiveQuery hasn't re-rendered SubtaskList yet after the DB update. However, TaskModal
    also has its own useLiveQuery (line 40-43) that fetches liveTask by ID, which should return
    fresh DB data. currentTask = liveTask ?? viewingTask (line 46).
  implication: Even if viewingTask is stale, liveTask should resolve with correct data on the next render tick.

- timestamp: 2026-02-22
  checked: TaskForm state initialization (TaskForm.tsx lines 33-43)
  found: |
    TaskForm initializes ALL form fields from initialData using useState:
      - title: useState(initialData?.title ?? '')
      - description: useState(initialData?.description ?? '')
      - status: useState<TaskStatus>(initialData?.status ?? 'todo')
      - categoryId: useState<number>(initialData?.categoryId ?? 0)
      - date: useState(initialData?.date ?? initialDate ?? '')

    There is NO useEffect to sync these local state values when initialData prop changes.
    React's useState only uses the initializer argument on the FIRST render of a component instance.
  implication: THIS IS THE ROOT CAUSE. When initialData changes (e.g., liveTask resolves with updated status, or user navigates from parent to subtask), TaskForm's local state is NOT updated.

- timestamp: 2026-02-22
  checked: TaskForm key prop in TaskModal (TaskModal.tsx line 171)
  found: |
    <TaskForm initialData={currentTask} ...> has NO key prop.
    When viewingTask changes (parent -> subtask navigation), React sees the same component type
    in the same tree position. It REUSES the existing TaskForm instance rather than unmounting
    and remounting. This means useState initializers don't re-run.
  implication: Without a key prop tied to the task ID, React never remounts TaskForm, so stale state persists across task navigation.

## Resolution

root_cause: |
  The bug is NOT about the database write -- SubtaskList.tsx DOES correctly call
  db.tasks.update() to persist status changes to Dexie (line 158-161).

  The bug is in TaskForm.tsx: it initializes all form fields (including status) via
  useState(initialData?.prop) on lines 33-43, but has NO useEffect to sync when
  initialData changes. React's useState only reads the initializer on first mount.

  When the user navigates into a subtask (or when liveTask resolves with updated data),
  currentTask changes, which changes the initialData prop passed to TaskForm -- but
  TaskForm's local state retains the stale values from its initial mount.

  Additionally, TaskForm has no `key` prop in TaskModal (line 171), so React reuses
  the same component instance when switching between tasks, compounding the issue.

fix: |
  Two possible fixes (either alone would work, both together is ideal):

  **Fix 1 (Simple, recommended): Add key prop to TaskForm**
  In TaskModal.tsx line 171, add a key tied to the task ID:
    <TaskForm key={currentTask?.id ?? 'new'} initialData={currentTask} ...>
  This forces React to unmount/remount TaskForm when the task changes,
  causing useState to re-initialize with fresh data.

  **Fix 2 (Belt-and-suspenders): Add useEffect sync in TaskForm**
  In TaskForm.tsx, add an effect after the useState declarations:
    useEffect(() => {
      setTitle(initialData?.title ?? '');
      setDescription(initialData?.description ?? '');
      setStatus(initialData?.status ?? 'todo');
      setCategoryId(initialData?.categoryId ?? 0);
      setDate(initialData?.date ?? initialDate ?? '');
    }, [initialData?.id]);
  This syncs form state whenever the underlying task identity changes.

verification: Code trace confirms db.tasks.update() is called and persists. The gap is purely on the read/display side in TaskForm.

files_changed: []
