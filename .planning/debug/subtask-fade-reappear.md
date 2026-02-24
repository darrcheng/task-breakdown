---
status: diagnosed
trigger: "Completing a subtask in the subtask tree (TaskModal) causes it to fade out smoothly then reappear. Subtasks should NOT disappear - they stay visible as completed items. The fade-to-invisible animation makes no sense for subtasks."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - SubtaskRow applies opacity-0 during fade phase which makes the subtask invisible, then Dexie liveQuery re-render restores it to visible when departingPhase resets to null. The entire departure animation (ring -> fade -> settling -> null) was designed for TaskListItem where "departing" means leaving the visible list, but subtasks NEVER leave the list.
test: Code analysis of SubtaskRow state machine vs SubtaskList rendering
expecting: opacity-0 causes vanish, liveQuery re-render restores visibility
next_action: Return structured diagnosis

## Symptoms

expected: Completing a subtask shows green background + strikethrough text animation, then settles into the "done" visual state (slate-400 line-through). Subtask stays visible at all times.
actual: Subtask fades to invisible (opacity-0) over 1500ms, then reappears when departingPhase resets to null and Dexie liveQuery re-renders.
errors: None (visual/behavioral)
reproduction: Open TaskModal with subtasks, click status circle on in-progress subtask to mark done
started: Since departure animation was implemented (same state machine copied from TaskListItem)

## Eliminated

(none needed - root cause is a design-level mismatch, not a code bug)

## Evidence

- timestamp: 2026-02-23
  checked: SubtaskList.tsx lines 97, 179-202 - departure state machine
  found: |
    SubtaskRow has the SAME multi-phase departure state machine as TaskListItem:
      ring (1500ms) -> fade (opacity-0, 1500ms) -> settling (400ms) -> null -> DB write

    The "fade" phase at line 211 applies: 'ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]'

    opacity-0 makes the entire subtask row invisible. This is the direct cause of the
    visual disappearance the user reports.
  implication: The fade phase is designed for items that are LEAVING the list. Subtasks never leave.

- timestamp: 2026-02-23
  checked: SubtaskList.tsx lines 186-194 - settling phase and DB write timing
  found: |
    After 1500ms ring phase:
    1. setDepartingPhase('settling') - removes ring/opacity, keeps transition-all for 400ms
    2. After 400ms settling:
       a. setDepartingPhase(null) - component back to normal state
       b. db.tasks.update(status: 'done') - writes to DB

    The DB write triggers Dexie liveQuery in useSubtasks(parentId) hook.
    useSubtasks has NO status filter - it returns ALL subtasks including done ones.
    So the subtask stays in the rendered list.

    The sequence the user sees:
    1. Click complete -> emerald ring appears (ring phase)
    2. Double-rAF -> subtask fades to invisible (fade phase, opacity-0)
    3. After 1500ms -> settling phase starts (opacity restored, ring removed)
    4. After 400ms -> departingPhase = null, DB write happens
    5. Dexie re-renders -> subtask visible again with status='done' styling

    Between steps 2-3, the subtask is INVISIBLE for ~1.5 seconds. Then it reappears.
  implication: The reappear is caused by settling phase restoring opacity + departingPhase resetting to null.

- timestamp: 2026-02-23
  checked: hooks.ts lines 83-91 - useSubtasks hook
  found: |
    useSubtasks queries by parentId only: db.tasks.where('parentId').equals(parentId).sortBy('sortOrder')
    No status filter. Done subtasks remain in the list always.
    The component is NEVER unmounted when a subtask is completed.
  implication: Unlike TaskListItem (which can be removed from list by Dexie filter when status='done'), SubtaskRow is ALWAYS mounted. The opacity-0 fade is purely destructive visual behavior.

- timestamp: 2026-02-23
  checked: SubtaskList.tsx lines 239-246 - title styling during phases
  found: |
    During ring/fade phases: 'text-green-600 line-through' (green strikethrough - correct celebration styling)
    During settling or done: 'text-slate-400 line-through' (grey strikethrough - correct done styling)
    Default: 'text-slate-700 hover:text-blue-600' (normal text)

    The TEXT styling is actually correct for what the user wants. The problem is exclusively
    the container div's opacity-0 in the fade phase making everything invisible.
  implication: Only the container div animation needs to change. Text styling is already correct.

- timestamp: 2026-02-23
  checked: Conceptual design mismatch - TaskListItem vs SubtaskRow
  found: |
    TaskListItem departure animation:
    - Task is "departing" the visible list (will be filtered out by Dexie when status='done')
    - opacity-0 makes sense: task fades away before being removed from DOM
    - With show-completed ON, the settling phase handles graceful return to visible

    SubtaskRow departure animation:
    - Subtask is NOT departing anything - it stays in the tree permanently
    - opacity-0 makes NO sense: subtask fades to invisible then must reappear
    - The "departure" metaphor is wrong for subtasks
    - Subtasks need a "celebration" animation, not a "departure" animation

    The SubtaskRow state machine was copied from TaskListItem wholesale, but the
    two components have fundamentally different lifecycle behaviors:
    - TaskListItem: task leaves the list when done (unless show-completed is on)
    - SubtaskRow: subtask NEVER leaves the tree
  implication: SubtaskRow needs its own animation design that celebrates without hiding.

## Resolution

root_cause: |
  DESIGN MISMATCH: SubtaskRow copies TaskListItem's departure animation verbatim, but
  subtasks have fundamentally different lifecycle behavior than top-level tasks.

  TaskListItem's animation is a "departure" animation - the task is leaving the visible
  list (filtered out by Dexie when status='done'). Making it opacity-0 is correct because
  the element will be unmounted shortly after.

  SubtaskRow's subtasks NEVER leave the tree. useSubtasks (hooks.ts:83-91) has no status
  filter - done subtasks remain visible. Applying opacity-0 during the fade phase
  (SubtaskList.tsx line 211) makes the subtask invisible for ~1.5 seconds, after which
  the settling phase restores opacity and the subtask reappears.

  The specific animation timeline causing the bug:
  1. Click -> ring phase: emerald ring appears (line 210) - GOOD
  2. Double-rAF -> fade phase: opacity-0 applied (line 211) - BAD for subtasks
  3. 1500ms -> settling phase: opacity restored (line 212, no opacity-0) - subtask reappears
  4. 400ms -> null: departingPhase cleared, DB write - subtask in final done state

  The user sees: ring glow -> fade to invisible -> reappear as done.
  The user wants: ring glow -> green styling -> settle into done styling.

fix: Not applied (research only)
verification: N/A
files_changed: []
