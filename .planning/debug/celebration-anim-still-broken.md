---
status: diagnosed
trigger: "task completion celebration animation doesn't work properly - no fade, background stays yellow, subtasks no animation, show-completed causes disappear-reappear"
created: 2026-02-23T12:00:00Z
updated: 2026-02-23T12:00:00Z
---

## Current Focus

hypothesis: Three distinct root causes identified across animation timing, color binding, and Dexie reactivity
test: Static code analysis and execution tracing
expecting: All three confirmed
next_action: Return structured diagnosis

## Symptoms

expected: |
  1. Completing a task shows emerald ring glow, background turns green, then fades out over 1500ms
  2. Subtask completion shows same animation; subtasks visible in calendar and list view
  3. With "show completed" on, completing a task transitions smoothly to done state (stays visible)
actual: |
  1. Task just disappears. Background stays yellow (amber) instead of turning green/emerald.
  2. Subtask completion has no animation either, just disappears. Subtasks not displayed in calendar/list view.
  3. Task disappears then reappears when show-completed is on.
errors: No JS errors - visual/behavioral regressions
reproduction: Click status circle to complete any in-progress task
started: After previous fix attempt (two-frame rAF approach)

## Eliminated

(none - fresh investigation)

## Evidence

- timestamp: 2026-02-23
  checked: TaskListItem.tsx line 39 - color binding
  found: |
    `const colors = STATUS_COLORS[task.status]` uses `task.status` (the PROP from DB), not `displayStatus` (local state).
    During 1500ms animation window, task.status is still 'in-progress' because DB write hasn't happened.
    So colors.bg = 'bg-amber-50' and colors.border = 'border-amber-300' throughout animation.
  implication: Background stays yellow/amber during entire departure animation. ROOT CAUSE of yellow background.

- timestamp: 2026-02-23
  checked: TaskListItem.tsx lines 30-37 and 110-111 - rAF animation approach
  found: |
    Phase 'ring': applies ring-2 ring-emerald-400 ring-offset-1 transition-all duration-[1500ms] (no opacity-0)
    Phase 'fade': applies ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]
    Transition from ring to fade uses single requestAnimationFrame in useEffect.

    PROBLEM: Single rAF after useEffect is unreliable for guaranteeing a browser paint between states.
    React 18 useEffect runs after paint, but a single rAF from within useEffect can still be
    coalesced into the same composite frame by the browser. The DOM change from 'ring' render
    may not have been composited before the rAF fires and triggers 'fade' render.

    The reliable pattern is double-rAF:
      requestAnimationFrame(() => requestAnimationFrame(() => setDepartingPhase('fade')))

    OR use a zero-ms setTimeout inside the rAF to force a new task:
      requestAnimationFrame(() => setTimeout(() => setDepartingPhase('fade'), 0))
  implication: Animation may not play because browser doesn't paint between ring and fade states.

- timestamp: 2026-02-23
  checked: TaskListItem.tsx lines 84-91 - timeout callback and Dexie race condition
  found: |
    Timeout callback at 1500ms:
      1. await db.tasks.update(task.id!, { status: 'done', ... })
      2. departureTimeout.current = null
      3. setDepartingPhase(null)

    When showCompleted=false:
      - DB write triggers Dexie liveQuery -> task removed from query results -> component unmounts
      - setDepartingPhase(null) runs on unmounted component (no-op, harmless)

    When showCompleted=true:
      - DB write triggers Dexie liveQuery -> task STAYS in results (status='done' passes filter)
      - setDepartingPhase(null) resets to null -> component re-renders with task.status='done'
      - BUT: Dexie's liveQuery fires SYNCHRONOUSLY during the await, causing React to re-render
        the component with the new task prop BEFORE setDepartingPhase(null) executes
      - The re-render gives task.status='done' + departingPhase still 'fade' (opacity-0)
      - Then setDepartingPhase(null) fires -> another render -> departing=false, opacity restored
      - This creates a flash: visible -> opacity-0 (during fade) -> opacity-0 (Dexie re-render) -> visible
      - The user sees: task disappears (fade to 0) then reappears (phase reset to null)
  implication: ROOT CAUSE of disappear-then-reappear with show-completed on.

- timestamp: 2026-02-23
  checked: SubtaskList.tsx lines 104-111, 185-186 - same animation pattern
  found: Same single-rAF pattern as TaskListItem. Same timing issue.
  implication: Subtask animation has identical root cause.

- timestamp: 2026-02-23
  checked: hooks.ts lines 16, 18, 41, 43 - parentId filter
  found: |
    Both useTasksByDate and useTasksByDateRange now have `!t.parentId` filter.
    This correctly excludes subtasks from the top-level task lists.
    Subtasks are queried separately via useSubtasks(parentId) in SubtaskList.
  implication: The parentId filtering was already fixed. Subtask visibility depends on WHERE SubtaskList is rendered.

- timestamp: 2026-02-23
  checked: Where SubtaskList is rendered
  found: |
    SubtaskList is ONLY imported and rendered in TaskModal.tsx (line 350).
    It is NOT rendered in TaskListItem.tsx (list view) or TaskCard.tsx (calendar view).
    Calendar: DayCell -> TaskCard (no subtask display). Clicking opens TaskModal which shows SubtaskList.
    List: DayGroup -> TaskListItem (no subtask display). No mechanism to show subtasks inline.

    The hooks correctly filter out subtasks from top-level queries (!t.parentId).
    SubtaskList is only visible inside the task edit modal.
  implication: Subtasks are only viewable by opening the parent task modal. They are NOT shown
               inline in either calendar or list view. This is BY DESIGN in current code, not a bug
               per se - but the user expects to see them in both views.

## Resolution

root_cause: |
  THREE ROOT CAUSES:

  ISSUE 1 - No fade animation + background stays yellow:
    A) Background color binding (TaskListItem.tsx line 39): `const colors = STATUS_COLORS[task.status]`
       uses `task.status` (DB prop) not `displayStatus` (local state). During the 1500ms departure
       window, task.status is still 'in-progress', so bg stays bg-amber-50 (yellow). Should use
       `STATUS_COLORS[displayStatus]` so it immediately shows bg-emerald-50 (green).

    B) Single-rAF timing (TaskListItem.tsx lines 31-36): The transition from 'ring' to 'fade' uses
       a single requestAnimationFrame inside useEffect. This is unreliable - the browser may not
       composite/paint the 'ring' frame before the rAF fires, causing both ring and fade class
       applications to collapse into the same visual frame. Result: opacity jumps from 1 to 0
       instantly with no visible transition. Needs double-rAF or rAF+setTimeout(0).

  ISSUE 2 - Subtask animation identical + subtasks not shown in views:
    A) SubtaskList.tsx lines 104-111: Same single-rAF timing bug as TaskListItem.
    B) SubtaskList is only rendered inside TaskModal.tsx. Neither TaskCard (calendar) nor
       TaskListItem (list) render SubtaskList or any subtask indicator inline.

  ISSUE 3 - Disappear-then-reappear with show-completed:
    The 1500ms timeout callback (TaskListItem.tsx line 84-91) does:
      await db.tasks.update() -> setDepartingPhase(null)
    With showCompleted=true, the DB write triggers Dexie's liveQuery which re-renders the
    component with the new task.status='done' while departingPhase is still 'fade' (opacity-0).
    Then setDepartingPhase(null) fires and removes opacity-0. User sees: disappear (opacity-0
    during fade) then reappear (phase reset restores opacity). The fix is to set departingPhase
    to null BEFORE the DB write, or use a dedicated "completed" visual state instead of relying
    on the departing phase for the post-animation appearance.

fix: Not applied (diagnosis only)
verification: N/A
files_changed: []
