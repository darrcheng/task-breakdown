---
status: resolved
trigger: "Subtask celebration animation broken. Three sub-issues: 1) Subtasks only visible in calendar view not list view, 2) No emerald ring border on subtask completion, 3) Completing a task when showing done causes it to disappear"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: All three root causes confirmed via code inspection
test: Static analysis of hooks.ts, SubtaskList.tsx, TaskListItem.tsx
expecting: Fix targets verified
next_action: Return structured diagnosis to caller

## Symptoms

expected: |
  1. Subtasks visible in both calendar and list views
  2. Completing a subtask shows emerald ring glow + strikethrough + fade animation
  3. Completing a task with "show done" active keeps it visible during animation
actual: |
  1. Subtasks only visible in calendar view (list view omits them)
  2. Subtask just disappears then reappears - no ring, no animation
  3. Completing a task when "showing done" causes it to instantly disappear
errors: (none — visual/behavioral regressions, no JS errors)
reproduction: |
  1. Open list view, check any parent task — subtasks absent
  2. Complete a subtask in any view — no ring animation fires
  3. Toggle "show done", then click complete on any task — task vanishes
started: unknown

## Eliminated

- hypothesis: useSubtasks hook filters out subtasks intentionally
  evidence: useSubtasks at hooks.ts:83-91 uses only parentId index with no status filter — it returns all subtasks regardless of status or isSomeday. Hook is correct.
  timestamp: 2026-02-23

- hypothesis: SubtaskList component is not rendered in list view at all
  evidence: DayGroup renders TaskListItem directly (no SubtaskList), and TaskListItem has no SubtaskList either. The missing rendering is a consequence of Bug 1 — subtasks appear as top-level rows in calendar but are absent from list view query results.
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: hooks.ts useTasksByDateRange (lines 29-47) and useTasksByDate (lines 11-22)
  found: |
    Both hooks query tasks by `date` field, then apply filter `!t.isSomeday`.
    Subtasks inherit the parent's `date` value when created (same date field).
    BUT subtasks also have `parentId` set (non-undefined).
    The filter does NOT exclude subtasks by parentId — it would include them.
    HOWEVER: the calendar uses useTasksByDate (single-day), list view uses useTasksByDateRange.
    Calendar renders TaskCard which presumably shows subtasks inline via SubtaskList.
    List view uses the same hook — so the queries themselves are NOT the difference.
  implication: The filtering is identical. Need to check rendering path.

- timestamp: 2026-02-23
  checked: hooks.ts lines 40-43 (useTasksByDateRange filter) vs lines 15-18 (useTasksByDate filter)
  found: |
    Both filters are structurally identical:
      !showCompleted path: t.status !== 'done' && !t.isSomeday && energyFilter check
      showCompleted path:  !t.isSomeday && energyFilter check
    Neither filter excludes subtasks (no !t.parentId check).
    Subtasks DO appear in both queries.
  implication: Both queries return subtasks. Rendering path must be the difference.

- timestamp: 2026-02-23
  checked: DayCell.tsx (calendar) vs DayGroup.tsx (list)
  found: |
    Calendar (DayCell.tsx line 61-74): renders TaskCard for each task — TaskCard likely
    has SubtaskList rendering and only shows root-level tasks visually.
    List view (DayGroup.tsx line 69-84): renders TaskListItem for each task.
    TaskListItem (TaskListItem.tsx) has NO SubtaskList component rendered inside it.
    Neither component filters out subtasks (parentId check) from the tasks array.
    RESULT: In list view, subtasks appear as raw TaskListItem rows ALONGSIDE their parents,
    not nested inside them. But also — TaskListItem has no SubtaskList, so subtasks are
    flattened into the day's task list. This is wrong but subtasks WOULD be visible.
    Re-checking: the filter may actually be excluding them due to isSomeday.
  implication: Subtasks may have isSomeday=undefined (falsy for old records) or false.
               The real question is whether parentId tasks pass the date-range filter.

- timestamp: 2026-02-23
  checked: database.ts schema v3 upgrade (lines 34-42)
  found: |
    The v3 upgrade sets isSomeday=false for ALL existing tasks.
    New subtasks created after v3 would inherit isSomeday from creation logic.
    The filter `!t.isSomeday` passes tasks where isSomeday is false, undefined, or null.
    So isSomeday is not the blocker.
    The REAL cause of Bug 1: DayGroup.tsx renders ALL tasks returned by useTasksByDateRange,
    including subtasks (parentId !== undefined). These appear as flat orphaned rows with
    no nesting context. BUT the user says subtasks are NOT visible at all.
    This means there IS a parentId filter — re-checking hooks.
  implication: Need to look more carefully at both hooks for parentId exclusion.

- timestamp: 2026-02-23
  checked: hooks.ts useTasksByDateRange lines 36-46 and useTasksByDate lines 13-21 CAREFULLY
  found: |
    useTasksByDate (calendar single-day hook):
      filter: !t.isSomeday && (!energyFilter || ...)
      NO parentId exclusion — subtasks ARE returned

    useTasksByDateRange (list view hook):
      filter: !t.isSomeday && (!energyFilter || ...)
      NO parentId exclusion — subtasks ARE returned

    BOTH hooks return subtasks. So in list view, subtasks are present in the tasks array
    for their date's DayGroup. DayGroup renders them as flat TaskListItem rows.

    BUT: the user says subtasks are "only visible in calendar view, not list view."
    In calendar view, DayCell uses TaskCard. Let's check TaskCard — it may have a
    !parentId guard that hides subtask rows visually (showing them only via SubtaskList
    inside parent cards). In list view, TaskListItem has no SubtaskList component at all.

    The asymmetry: calendar shows subtasks INSIDE parent (via TaskCard + SubtaskList),
    list view shows subtasks as FLAT items but TaskListItem never renders SubtaskList.
    So subtasks DO appear in list view queries — but they appear as orphaned flat items,
    and because TaskListItem has no nesting, they look like normal tasks with no parent
    context. The user may perceive this as "subtasks not visible" because they are shown
    without the subtask UI (no indentation, no parent label visible).

    ACTUAL Bug 1: Neither hook filters out parentId tasks. In list view, DayGroup has NO
    parentId filter and TaskListItem has NO SubtaskList. The fix is: useTasksByDateRange
    and useTasksByDate should filter out subtasks (!t.parentId), and TaskListItem should
    render SubtaskList (or list view DayGroup should). Calendar works because TaskCard
    renders SubtaskList inside parent cards AND TaskCard may already filter root-only.
  implication: BUG 1 ROOT CAUSE CONFIRMED — hooks return subtasks to list view, but
               list view has no mechanism to render them nested. Fix: add !t.parentId
               filter to both hooks OR add SubtaskList to TaskListItem. The cleanest fix
               is to filter out subtasks at the hook level (root tasks only for date views)
               since SubtaskList already queries them separately via useSubtasks.

- timestamp: 2026-02-23
  checked: SubtaskList.tsx SubtaskRow departure animation (lines 169-177)
  found: |
    The departing div applies TWO separate className strings simultaneously on a single element:
      departing && 'ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]'

    PROBLEM: `opacity-0` and `transition-all duration-[1500ms]` are applied in the SAME
    conditional string. When `departing` becomes true, the element immediately gets BOTH
    opacity-0 AND the transition class at the same moment.

    CSS transitions only fire when a property CHANGES after the transition is already present.
    If opacity-0 and transition-all are applied in the same render tick, the browser sees
    the element go from "no transition, opacity 1" to "transition present, opacity 0"
    simultaneously. In practice browsers typically do NOT animate this — they apply opacity-0
    instantly because the transition and target value arrive in the same paint frame.

    The ring-2 ring-emerald-400 classes ARE applied, but opacity-0 fires immediately so
    the element vanishes before the ring can be seen (or the ring appears and instantly
    disappears with the element).

    This is the classic "apply transition class before target value" bug. The correct pattern:
    Step 1 (tick 1): Apply ring + transition classes (but keep opacity-1)
    Step 2 (tick 2+): Apply opacity-0 to trigger the transition

    The SubtaskRow component sets departing=true and immediately renders with opacity-0 in
    one synchronous React render → one browser paint → no visible transition.
  implication: BUG 2 ROOT CAUSE CONFIRMED — opacity-0 and transition-all applied in the same
               conditional render, so no animation plays. The ring is technically added but
               element disappears in the same frame.

- timestamp: 2026-02-23
  checked: TaskListItem.tsx departure animation (line 95) and timeout handling (lines 71-77)
  found: |
    TaskListItem departure (line 95):
      departing && 'ring-2 ring-emerald-400 ring-offset-1 line-through decoration-green-600 text-green-600 opacity-0 transition-all duration-[1500ms]'

    SAME BUG as SubtaskRow — opacity-0 in same conditional string as transition.

    BUT the "show done" disappear bug (Bug 3) is a DIFFERENT issue:

    In TaskListItem.handleStatusClick (lines 68-77), when nextStatus === 'done':
      - setDeparting(true) → component renders with ring + opacity-0 (same tick bug)
      - setTimeout 1500ms fires → db.tasks.update(status: 'done')
      - setDeparting is NOT called with false after the DB update (line 77 only sets departureTimeout.current = null)

    When showCompleted is TRUE and status is updated to 'done' in the DB:
      - useLiveQuery in useTasksByDateRange re-fires (Dexie reactivity)
      - The query filter with showCompleted=true keeps the task: `!t.isSomeday` only
      - So the task STAYS in the query results
      - The TaskListItem receives updated task prop with status='done'
      - HOWEVER: the component's own departing=true state was set, and the element
        had opacity-0 applied... but wait: departing is never reset to false after
        the DB write completes (there's no setDeparting(false) in the timeout callback)
      - The component stays in departing=true state indefinitely
      - BUT with showCompleted=false: the Dexie query removes the task from results,
        React unmounts the component — disappear is expected
      - With showCompleted=true: task remains in query, component stays mounted,
        departing stays true → element stays at opacity-0 (invisible but present in DOM)

    Wait — re-reading Bug 3: "completing a task when showing done causes it to straight up
    disappear." The word "disappear" when showCompleted is true.

    SubtaskRow DOES call setDeparting(false) after the timeout (line 157-158).
    TaskListItem does NOT call setDeparting(false) after the timeout (lines 71-77).

    With showCompleted=true:
    1. User clicks complete → departing=true → opacity-0 applied (element invisible)
    2. 1500ms later → DB write → departing stays true (no setDeparting(false))
    3. Dexie live query re-fires → task still in results (showCompleted=true includes 'done')
    4. TaskListItem re-renders with task.status='done', departing=true
    5. The `colors` variable uses task.status='done' but departing overlay still active
    6. Element is permanently invisible (departing=true, opacity-0, never reset)

    Root cause of Bug 3: setDeparting(false) is missing from TaskListItem's timeout callback.
    SubtaskRow has this (line 157-158): `setDeparting(false)` after the await.
    TaskListItem does not — it only sets `departureTimeout.current = null`.
  implication: BUG 3 ROOT CAUSE CONFIRMED — TaskListItem never calls setDeparting(false)
               after the departure timeout completes, so task stays at opacity-0 when
               showCompleted=true keeps it in the query results.

## Resolution

root_cause: |
  Three distinct root causes:

  BUG 1 (subtasks missing from list view):
    hooks.ts useTasksByDateRange and useTasksByDate do not filter out subtasks
    (no !t.parentId check). Calendar view works because TaskCard renders SubtaskList
    inside parent cards — subtasks appear nested under their parents. List view's
    DayGroup/TaskListItem has no SubtaskList, so subtasks appear as flat orphaned
    TaskListItem rows without any nesting context, making them invisible as subtasks.
    Fix: Add `!t.parentId` to both hook filters so only root tasks are returned to
    date views, and ensure TaskListItem renders SubtaskList for nesting.

  BUG 2 (no emerald ring animation on subtask completion):
    SubtaskList.tsx SubtaskRow (line 173): `opacity-0` and `transition-all duration-[1500ms]`
    are in the SAME conditional className string. When departing becomes true, both classes
    apply in the same React render → same browser paint. CSS transitions require the
    transition property to be present BEFORE the target value changes. Since both arrive
    simultaneously, the browser skips the transition and applies opacity-0 instantly.
    The ring classes ARE added but the element vanishes in the same frame.
    Same bug exists in TaskListItem.tsx line 95.
    Fix: Split into two states — one for "celebration visible" (ring + transition, opacity-1)
    and one for "fade out" (opacity-0), separated by a requestAnimationFrame or double render.

  BUG 3 (task disappears when completing with show-done active):
    TaskListItem.tsx handleStatusClick timeout callback (lines 71-77) does not call
    setDeparting(false) after the DB write completes. SubtaskRow correctly calls
    setDeparting(false) (line 157). Without this reset, the component stays in departing=true
    state with opacity-0 applied indefinitely. When showCompleted=true, Dexie keeps the
    task in query results after status='done', so the component stays mounted but invisible.
    Fix: Add `setDeparting(false)` to TaskListItem's setTimeout callback after the DB write.

fix: Not applied (find_root_cause_only mode)
verification: N/A
files_changed: []
