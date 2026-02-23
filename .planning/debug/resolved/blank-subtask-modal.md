---
status: resolved
trigger: "Subtasks show title in calendar/board but modal content is blank when opened directly"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: TaskForm uses useState initializers that only run on mount; due to useEffect timing, currentTask is undefined on the render where TaskForm first mounts, so all form fields initialize blank and never update
test: Trace the render cycle from modal-open to TaskForm mount
expecting: First render has currentTask=undefined, confirming blank fields
next_action: Confirmed -- document root cause and suggest fix

## Symptoms

expected: Clicking a subtask card in calendar/board view opens the TaskModal with the subtask's title, description, status, category, and date pre-populated
actual: Modal opens but all form fields are blank (no title, no description, no status/category selection)
errors: No console errors reported
reproduction: 1) Create a task and break it into subtasks. 2) Subtasks appear in the calendar day cell. 3) Click a subtask card directly in the calendar. 4) Modal opens with blank form fields.
started: Since subtask feature was added (subtasks appear in calendar via useTasksByDate which has no parentId filter)

## Eliminated

- hypothesis: Subtasks are not returned by useTasksByDate
  evidence: useTasksByDate (hooks.ts:9-20) queries db.tasks.where('date').equals(date) with NO filter on parentId or depth. Subtasks have a date field and are returned alongside root tasks. TaskCard renders them correctly (title shows in calendar).
  timestamp: 2026-02-22T00:00:00Z

- hypothesis: TaskModal receives only a taskId and needs a separate query for subtasks
  evidence: The full Task object is passed through the entire chain -- TaskCard.onClick(task) -> DayCell.onTaskClick(task) -> App.handleTaskClickCalendar(task) -> modalState.task = task -> TaskModal receives task={subtask} as prop. The full object is always available.
  timestamp: 2026-02-22T00:00:00Z

- hypothesis: Database query in TaskModal's useLiveQuery fails for subtasks
  evidence: useLiveQuery calls db.tasks.get(viewingTask.id) which is a simple primary-key lookup. It works for any task regardless of parentId or depth. The issue occurs before this query even has the right ID.
  timestamp: 2026-02-22T00:00:00Z

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskModal component structure (TaskModal.tsx)
  found: |
    All hooks are declared before the `if (!isOpen) return null` guard on line 64.
    This means TaskModal never unmounts -- it persists in the React tree always.
    The viewingTask state and liveTask query survive across open/close cycles.
    However, the JSX tree (including TaskForm) IS unmounted when isOpen=false
    because the early return on line 64 returns null for the entire component output.
  implication: TaskForm unmounts on close and remounts fresh on open. Its useState initializers run fresh each time the modal opens.

- timestamp: 2026-02-22T00:00:00Z
  checked: viewingTask state initialization and update lifecycle
  found: |
    Line 24: `const [viewingTask, setViewingTask] = useState<Task | undefined>(task)`
    -- Initial value set ONCE on first component mount (page load), where task=undefined.

    Lines 31-37: useEffect updates viewingTask when isOpen or task prop changes:
    ```
    useEffect(() => {
      setViewingTask(task);
      setParentStack([]);
      ...
    }, [isOpen, task]);
    ```

    The useEffect runs AFTER render. On the render where isOpen transitions
    from false to true, viewingTask still holds its previous value (undefined,
    set during the close cycle).
  implication: There is always a "stale render" where viewingTask is undefined (or previous task) before the useEffect updates it.

- timestamp: 2026-02-22T00:00:00Z
  checked: Close -> Open render cycle in detail
  found: |
    CLOSE CYCLE:
    1. closeModal() in App.tsx: setModalState({ isOpen: false, date: '' })
       -- Note: no task property, so task prop becomes undefined
    2. TaskModal re-renders with isOpen=false, task=undefined
    3. useEffect fires: setViewingTask(undefined), setParentStack([])
    4. After settle: viewingTask = undefined

    OPEN CYCLE (user clicks subtask in calendar):
    5. handleTaskClickCalendar: setModalState({ isOpen: true, date, task: subtask, clickPosition })
    6. TaskModal re-renders with isOpen=true, task=subtask
    7. BUT viewingTask is still undefined (from step 4)
    8. liveTask = useLiveQuery(() => undefined?.id ? db.tasks.get(...) : undefined) = undefined
    9. currentTask = liveTask ?? viewingTask = undefined ?? undefined = undefined
    10. TaskForm MOUNTS with initialData=undefined -> all fields blank
    11. useEffect fires: setViewingTask(subtask)
    12. Re-render: viewingTask=subtask, liveTask eventually resolves
    13. currentTask = subtask
    14. TaskForm receives new initialData=subtask BUT does not re-initialize state
  implication: This is the root cause. TaskForm mounts with undefined data and never updates.

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskForm state initialization (TaskForm.tsx lines 33-43)
  found: |
    ```
    const [title, setTitle] = useState(initialData?.title ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [status, setStatus] = useState<TaskStatus>(initialData?.status ?? 'todo');
    const [categoryId, setCategoryId] = useState<number>(initialData?.categoryId ?? 0);
    const [date, setDate] = useState(initialData?.date ?? initialDate ?? '');
    ```
    All form fields use useState with initialData as the initial value.
    useState ONLY reads its initial value argument on the FIRST render (mount).
    Subsequent re-renders with different initialData prop are IGNORED by useState.
    There is no useEffect in TaskForm to sync props -> state.
    There is no key prop on <TaskForm> in TaskModal to force remount.
  implication: Once TaskForm mounts with blank data, it stays blank forever (until unmount/remount).

- timestamp: 2026-02-22T00:00:00Z
  checked: Whether this affects all tasks or only subtasks
  found: |
    This bug affects ALL tasks opened from the calendar, not just subtasks.
    The useEffect timing issue means the first render always has
    currentTask=undefined. The user report may specifically mention subtasks
    because that is the scenario they tested, or because subtasks are more
    commonly opened from the calendar (parent tasks might be opened from
    other paths that work differently).

    However, there is a possible mitigating factor: if React batches the
    state updates or if the liveTask query resolves synchronously from
    Dexie's cache for previously-loaded tasks, regular tasks might appear
    to work. Subtasks, being newly created, may not benefit from caching.
    This would explain why the bug is reported specifically for subtasks.
  implication: The bug is architectural but may manifest more visibly for subtasks due to query caching differences.

## Resolution

root_cause: |
  Two-part root cause in the TaskModal -> TaskForm data flow:

  1. TIMING: TaskModal uses a useEffect to sync the `task` prop into `viewingTask` state
     (line 31-37). Because useEffect runs AFTER render, the first render when the modal
     opens always has `viewingTask = undefined` (the value set during the previous close
     cycle). This means `currentTask` (line 46) is `undefined` on the render where
     TaskForm mounts.

  2. STALE INITIALIZATION: TaskForm uses `useState(initialData?.title ?? '')` etc.
     (lines 33-43) to initialize form fields. `useState` only reads its argument on
     mount. When `currentTask` later becomes the actual subtask (after useEffect fires
     and/or liveTask resolves), TaskForm receives the updated `initialData` prop but
     its internal state does NOT update. The form stays blank.

  The affected code path:
  - App.tsx line 113: `setModalState({ isOpen: true, date: task.date, task, clickPosition })`
  - TaskModal.tsx line 24: `useState(task)` -- only reads initial value once
  - TaskModal.tsx line 31-37: `useEffect -> setViewingTask(task)` -- fires AFTER render
  - TaskModal.tsx line 46: `currentTask = liveTask ?? viewingTask` -- undefined on first render
  - TaskForm.tsx line 33: `useState(initialData?.title ?? '')` -- blank because initialData is undefined

  Files involved:
  - src/components/task/TaskModal.tsx (viewingTask timing)
  - src/components/task/TaskForm.tsx (no re-initialization from props)

fix: |
  Two possible fix approaches (choose one or combine):

  FIX A (Recommended -- minimal, targeted): Add a `key` prop to TaskForm that forces
  remount when the task identity changes:
  ```tsx
  <TaskForm
    key={currentTask?.id ?? 'new'}
    initialData={currentTask}
    ...
  />
  ```
  This ensures TaskForm remounts (and re-initializes state) whenever currentTask changes.
  However, this alone does not fix the timing issue -- the first render still has
  currentTask=undefined. So the key would be `'new'` on first render and then change
  to the actual ID, causing a double-mount.

  FIX B (Better -- fixes root cause): Replace the useEffect-based sync with direct
  derivation. Use the `task` prop directly instead of syncing through state:
  ```tsx
  // Instead of useState + useEffect, derive viewingTask from navigation state
  const [navigationOverride, setNavigationOverride] = useState<Task | undefined>();
  const viewingTask = navigationOverride ?? task;
  ```
  And only use `setNavigationOverride` for the subtask drill-down navigation
  (handleOpenSubtask/handleBackToParent). This eliminates the stale-render problem
  because `task` prop is available immediately.

  FIX C (Simplest): Add a useEffect in TaskForm to re-sync state from props:
  ```tsx
  useEffect(() => {
    setTitle(initialData?.title ?? '');
    setDescription(initialData?.description ?? '');
    setStatus(initialData?.status ?? 'todo');
    setCategoryId(initialData?.categoryId ?? 0);
    setDate(initialData?.date ?? initialDate ?? '');
  }, [initialData?.id]);
  ```
  This works but is a pattern that can lead to prop/state synchronization bugs.

  RECOMMENDED: Combine Fix B (eliminate stale render in TaskModal) with Fix A (key prop
  on TaskForm as safety net). This addresses both the timing issue and the stale state
  initialization issue.

verification: |
  Not yet verified -- diagnosis only mode.

  To verify the fix:
  1. Create a parent task, break it into subtasks
  2. Navigate to the calendar view where subtasks appear
  3. Click a subtask directly in the calendar
  4. Verify modal opens with subtask's title, description, status, category pre-populated
  5. Close modal, click a different task -- verify it shows correct data
  6. Open parent task, drill into subtask via SubtaskList -- verify still works
  7. Open modal for new task creation (click empty day) -- verify form is blank

files_changed: []
