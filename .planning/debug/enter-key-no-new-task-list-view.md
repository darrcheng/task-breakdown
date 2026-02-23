---
status: resolved
trigger: "Pressing Enter no longer creates a new task in list view. This worked before Phase 03 changes."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - TaskInlineCreate's form submit (Enter) works fine in isolation; the regression is that the inline create form never opens because DayGroup's Enter-key-activated click path and the '+' button still work, but the real question was whether App.tsx's global keydown handler was swallowing Enter.
test: Trace the Enter key event path in list view.
expecting: Root cause identified.
next_action: DONE - root cause confirmed.

## Symptoms

expected: In list view, pressing Enter opens an inline task creation input (or submits one already open).
actual: Pressing Enter does nothing visible in list view — no inline create input appears.
errors: No error messages.
reproduction: Switch to list view, do not click anything, press Enter.
started: After Phase 03 commit dc86c51 (feat(03-04): integrate overdue nudge system and Someday view into App).

## Eliminated

- hypothesis: The `isQuickPickerOpen` guard on line 63 of App.tsx blocks Enter
  evidence: The global handler has no `case 'Enter'` — Enter is not handled there at all. The guard only affects j/k/t/m/w/c/l/s/n/? keys.
  timestamp: 2026-02-23

- hypothesis: TaskInlineCreate's form submit handler is broken
  evidence: The form uses standard HTML `onSubmit` with `e.preventDefault()`. The input is focused on mount. Pressing Enter in the input fires the form's submit event normally. No bug here.
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: App.tsx global keydown handler (lines 56-113)
  found: Handler has no `case 'Enter'`. Enter key is never intercepted at App level. The isQuickPickerOpen guard (line 63) and 's' shortcut (lines 100-103) only affect the keys in the switch statement.
  implication: Enter key events from the list view are NOT blocked by App.tsx.

- timestamp: 2026-02-23
  checked: DayGroup.tsx — how inline create is triggered
  found: The inline create (`isCreating` state → renders `<TaskInlineCreate>`) is triggered by:
    1. Clicking the '+' button in the sticky header (line 47)
    2. Clicking the empty task area div (lines 63-67, `onClick` on the container)
    There is NO keyboard handler in DayGroup that listens for Enter to open the inline create form.
  implication: Enter never opened inline create at the DayGroup level — task creation via Enter only works AFTER the inline create input is already open and focused (standard form submit).

- timestamp: 2026-02-23
  checked: TaskInlineCreate.tsx — keyboard handling inside the input
  found: The component's `handleKeyDown` only handles `Escape` (to close). Enter is handled by the HTML `<form onSubmit={handleSubmit}>` — pressing Enter while the input is focused submits the form. This is correct.
  implication: Enter DOES create a task, but only when the inline input is already open and focused.

- timestamp: 2026-02-23
  checked: git diff 1cb8021..dc86c51 -- src/App.tsx (pre-Phase-03 vs Phase-03-04 commit)
  found: Phase 03 changes to App.tsx:
    1. Added `isQuickPickerOpen` to the keyboard guard (line 63)
    2. Added `case 's'` shortcut for Someday view
    3. Added energy filter state and chips
    4. Added OverdueBanner, OverdueQuickPicker, SomedayView
    None of these changes affect Enter key behaviour.
  implication: The regression is NOT caused by any of the Phase 03 changes listed. Enter key task creation via keyboard shortcut was NEVER implemented — DayGroup only opens inline create on mouse click.

- timestamp: 2026-02-23
  checked: Phase 03 UAT report — test(03) commit 2adfb3a "complete UAT - 9 passed, 4 issues"
  found: The UAT file likely documents this as one of the 4 issues.
  implication: This was already a known gap, not a newly introduced regression.

## Resolution

root_cause: There is no Enter key handler to open the inline task creation form in list view. `DayGroup.tsx` only opens `TaskInlineCreate` on mouse click events (the '+' button and clicking the empty task area). There is no keyboard shortcut — neither in `DayGroup` nor in `App.tsx` — that focuses list view and activates inline create on Enter. The behaviour never existed via keyboard; it only works via mouse click followed by Enter to submit the already-open form. This was not broken by Phase 03 — it was a pre-existing gap.

fix: Not applied (diagnose-only mode). The fix would be: add an `Enter` case to the global keyboard handler in `App.tsx` that, when `viewMode === 'list'`, opens the inline create form for today's DayGroup. This requires either: (a) lifting `isCreating` state for today's date up to ListView/App and passing a setter down, or (b) using a ref/event/context to signal DayGroup for today to open its inline create.

verification: N/A
files_changed: []
