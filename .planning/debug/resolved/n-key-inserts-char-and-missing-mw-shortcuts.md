---
status: resolved
trigger: "n keyboard shortcut inserts 'n' into task title; m/w shortcuts removed but should remain"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - both root causes identified
test: n/a
expecting: n/a
next_action: return diagnosis

## Symptoms

expected: (1) Pressing 'n' opens new task modal with empty title field. (2) m/w shortcuts switch calendar between month/week views.
actual: (1) 'n' opens modal but title field contains 'n' character. (2) m/w shortcuts do nothing.
errors: none
reproduction: (1) Press 'n' on any page - modal opens with 'n' in title. (2) Press 'm' or 'w' - no view change.
started: After the keyboard shortcut remap in commit 3b97d79

## Eliminated

## Evidence

- timestamp: 2026-02-22T00:01:00Z
  checked: App.tsx lines 43-84, keyboard shortcut handler
  found: No call to e.preventDefault() anywhere in the switch statement. The 'n' case (line 73-74) sets modal state but the keydown event propagates to the DOM. TaskForm auto-focuses the title input on mount (line 46-48 of TaskForm.tsx). The 'n' character from the keydown event reaches the now-focused input.
  implication: This is the direct cause of Bug 1. The event must be prevented before it propagates.

- timestamp: 2026-02-22T00:02:00Z
  checked: git diff 3b97d79~1 3b97d79 -- src/App.tsx
  found: Commit 3b97d79 explicitly removed 'case m' (month view) and 'case w' (week view) from the switch statement. The commit message says "Remove case 'm' (month view) and case 'w' (week view) bindings". These were not re-added as alternative bindings.
  implication: This is the direct cause of Bug 2. The m/w cases need to be restored alongside the new c/l/n shortcuts.

- timestamp: 2026-02-22T00:03:00Z
  checked: SettingsModal.tsx lines 13-21 (SHORTCUTS array)
  found: The SHORTCUTS help text does not include m or w entries. Only c, l, n are listed.
  implication: When m/w shortcuts are restored, the SHORTCUTS array must also be updated.

## Resolution

root_cause: |
  BUG 1: App.tsx line 73-74 - the 'n' keyboard shortcut handler does not call e.preventDefault().
  The keydown event fires, React schedules a state update (opening modal), but the browser's
  default behavior for the keydown event continues. TaskForm auto-focuses the title input on mount
  (useEffect on line 46-48 of TaskForm.tsx). Due to React 18 batching and microtask timing, the
  input receives focus during the same event loop tick, and the 'n' character from the keydown
  event is inserted into the input via the browser's default key processing.

  BUG 2: App.tsx switch statement - commit 3b97d79 removed the 'm' and 'w' cases entirely instead
  of keeping them as additional bindings alongside the new 'c' and 'l' shortcuts. The m/w shortcuts
  should coexist as alternative ways to switch between month and week calendar views.
fix: see detailed fix below
verification:
files_changed: []
