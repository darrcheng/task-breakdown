---
status: diagnosed
trigger: "Investigate why the celebration animation ring glow disappears abruptly instead of fading out when show completed is on"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - setDepartingPhase(null) at end of 1500ms timeout instantly removes ring CSS classes with no fade-out transition
test: Code reading and class analysis
expecting: Abrupt class removal causes visual discontinuity
next_action: Return diagnosis

## Symptoms

expected: When "show completed" is on, ring glow should fade out smoothly after the 1.5s celebration animation
actual: Ring glow disappears abruptly (cuts off instantly) when departingPhase is set to null
errors: none (visual bug, not a crash)
reproduction: Enable "show completed", mark a task as done, observe the ring glow at the end of the animation
started: Since the celebration animation was implemented

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-23T00:01:00Z
  checked: TaskListItem.tsx lines 98-111 (handleStatusClick setTimeout callback)
  found: |
    At the end of the 1500ms timeout, line 106 does `setDepartingPhase(null)`.
    This is BEFORE the DB update on line 107-110.
    The comment on lines 103-105 explains this ordering was intentional to prevent
    a "disappear-then-reappear flash" when Dexie liveQuery re-renders.
  implication: The ordering is correct for preventing flash, but the null transition is instant.

- timestamp: 2026-02-23T00:02:00Z
  checked: TaskListItem.tsx lines 124-132 (clsx class application)
  found: |
    Three states in the clsx:
    1. departingPhase === 'ring': ring-2 ring-emerald-400 ring-offset-1 transition-all duration-[1500ms]
    2. departingPhase === 'fade': ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]
    3. departingPhase === null: NONE of the ring/transition classes are applied
    When going from 'fade' -> null, ALL ring classes AND the transition-all class are removed simultaneously.
  implication: |
    Because transition-all is removed at the same moment as ring-2, the browser has no
    transition to animate. The ring disappears in a single frame.

- timestamp: 2026-02-23T00:03:00Z
  checked: The full animation lifecycle
  found: |
    Timeline:
    1. Click -> setDepartingPhase('ring') -> ring appears with transition-all duration-1500ms
    2. Double-rAF -> setDepartingPhase('fade') -> opacity-0 added (fades entire element)
    3. 1500ms timeout -> setDepartingPhase(null) -> ALL classes yanked instantly

    When "show completed" is OFF: Step 3 doesn't matter because the task is removed from the
    list by the Dexie liveQuery filter (the DB update at step 3 removes it from the view).

    When "show completed" is ON: The task stays visible. Step 3 causes the ring classes
    to vanish instantly. The element snaps from opacity-0 + ring-2 to opacity-1 + no ring
    in a single frame. This is the bug.
  implication: The bug only manifests when show-completed is on, exactly matching the report.

- timestamp: 2026-02-23T00:04:00Z
  checked: SubtaskList.tsx lines 174-183 (SubtaskRow handleStatusClick)
  found: Same pattern exists in SubtaskRow - identical bug will occur for subtask celebration animations.
  implication: Fix must be applied to both TaskListItem and SubtaskRow.

## Resolution

root_cause: |
  When departingPhase transitions from 'fade' to null (line 106 of TaskListItem.tsx,
  line 178 of SubtaskList.tsx), ALL ring and transition classes are removed in a single
  React render. Since transition-all is removed simultaneously with ring-2, the browser
  has no CSS transition to animate the removal. The ring and opacity snap to their
  default values instantly.

  This is invisible when "show completed" is OFF because the Dexie liveQuery removes
  the element from the DOM entirely (the task no longer matches the filter). But when
  "show completed" is ON, the element persists and the abrupt visual snap is visible.

fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
