---
status: diagnosed
trigger: "In the OverdueQuickPicker modal, clicking the reschedule (calendar) icon shows the current due date text first, then you have to click on the date to actually see the calendar picker, and then you have to scroll down to see it."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: Two compounding problems — DatePicker has its own internal isOpen state starting false (requiring a second click), and its dropdown renders absolutely below its trigger (causing scroll-to-see)
test: Traced code execution path from calendar icon click through to calendar grid render
expecting: Root cause confirmed — no runtime testing needed, code path is unambiguous
next_action: DONE — root cause confirmed, diagnosis returned

## Symptoms

expected: Clicking the reschedule (calendar) icon immediately shows a fully-visible date picker calendar grid
actual: First click shows a date text button (the DatePicker trigger), requiring a second click on that button to open the calendar, which then renders as an absolute dropdown positioned below the trigger — off-screen in the modal, requiring scroll
errors: none (UX bug, not a crash)
reproduction: Open OverdueQuickPicker modal > click the Calendar icon on any task row
started: Phase 03 investigation

## Eliminated

- hypothesis: DatePicker renders calendar grid immediately on mount (no internal toggle)
  evidence: DatePicker.tsx line 15 — `const [isOpen, setIsOpen] = useState(false)` — it starts closed and requires its own trigger button click to open
  timestamp: 2026-02-23

- hypothesis: The scroll issue is caused by DatePicker's parent container lacking overflow
  evidence: The modal task list at line 120 of OverdueQuickPicker.tsx has `overflow-y-auto` which clips the absolute dropdown; additionally the dropdown at DatePicker.tsx line 76 uses `absolute z-50 mt-1` positioning relative to its immediate container, not the viewport
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: OverdueQuickPicker.tsx lines 38-44 (calendar icon button)
  found: onClick calls `setShowDatePicker(prev => !prev)` — this only toggles visibility of the DatePicker component mount/unmount
  implication: The DatePicker component itself appears, but in its closed/collapsed state (just a trigger button)

- timestamp: 2026-02-23
  checked: OverdueQuickPicker.tsx lines 61-68 (conditional DatePicker render)
  found: `{showDatePicker && (<div className="mt-2"><DatePicker value={task.date} onChange={handleReschedule} /></div>)}` — no prop to force-open the picker
  implication: DatePicker mounts with its own isOpen=false, showing only its trigger button — user must click again

- timestamp: 2026-02-23
  checked: DatePicker.tsx line 15
  found: `const [isOpen, setIsOpen] = useState(false)` — calendar grid is gated behind this state
  implication: Two-click problem confirmed: click 1 = show DatePicker component, click 2 = open calendar inside DatePicker

- timestamp: 2026-02-23
  checked: DatePicker.tsx lines 58-72 (trigger button render)
  found: DatePicker renders a full trigger button with date text (e.g., "Feb 20, 2025") and a Calendar icon — this is the intermediate UI the user sees after click 1
  implication: This intermediate state is the "current due date text" the user reports seeing

- timestamp: 2026-02-23
  checked: DatePicker.tsx line 76
  found: `<div className="absolute z-50 mt-1 w-72 ...">` — dropdown positioned absolutely below trigger
  implication: In the modal's scrollable container (overflow-y-auto), this absolute element renders in document flow below the trigger, pushing below the visible modal area — scroll required

- timestamp: 2026-02-23
  checked: DatePicker.tsx interface (lines 6-10)
  found: Props are `value`, `onChange`, `required` — no `defaultOpen` or `isOpen` prop exists
  implication: There is no existing way to force the calendar open on mount; a new prop must be added OR the component needs to be used in a different way in the overdue context

## Resolution

root_cause: |
  Two compounding issues:

  1. TWO-CLICK PROBLEM (DatePicker.tsx line 15 + OverdueQuickPicker.tsx lines 61-68):
     DatePicker has internal `isOpen` state starting as `false`. When OverdueQuickPicker
     mounts the DatePicker on calendar icon click, the calendar grid is hidden behind
     DatePicker's own trigger button. The user must click a second time (on the date text
     button inside DatePicker) to actually see the calendar grid.

  2. SCROLL-TO-SEE PROBLEM (DatePicker.tsx line 76):
     The calendar dropdown uses `position: absolute` with `mt-1` (below its trigger).
     The OverdueQuickPicker modal task list uses `overflow-y-auto` — the absolute
     dropdown renders inside this scrollable container, appearing below the trigger
     element and outside the visible viewport of the modal.

fix: |
  Two changes needed:

  CHANGE 1 — DatePicker.tsx: Add a `defaultOpen` prop
  - Add `defaultOpen?: boolean` to DatePickerProps interface
  - Change `useState(false)` to `useState(defaultOpen ?? false)`
  - This allows callers to mount the picker already in open state

  CHANGE 2 — OverdueQuickPicker.tsx: Pass defaultOpen and fix scroll/positioning
  - Pass `defaultOpen={true}` to DatePicker so calendar opens immediately
  - The dropdown positioning problem requires choosing one of:
    a. Change DatePicker dropdown from `absolute` to a scroll-into-view approach
    b. Use `position: fixed` with computed coordinates for the dropdown
    c. In OverdueQuickPicker context, skip the DatePicker trigger entirely and
       render only the calendar grid (inline, not as a dropdown) using a
       dedicated inline calendar variant

  RECOMMENDED: Option (c) — render the calendar inline (not as a dropdown) in
  OverdueQuickPicker. This is the clearest UX for the overdue context where space
  is available within the row, and avoids the absolute positioning problem entirely.
  The DatePicker component in task-edit contexts can remain unchanged.

verification: not yet applied — diagnosis only
files_changed: []
