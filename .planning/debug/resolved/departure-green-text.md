---
status: resolved
trigger: "done task departure animation - strikethrough works but text should turn green"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: The departing state on line 57 applies line-through and opacity-0 but never overrides the text color to green
test: Read the departing CSS classes applied in the clsx() call
expecting: No green text class present during departure
next_action: Return root cause and fix

## Symptoms

expected: When a task is marked done, the departure animation should show strikethrough AND green text
actual: Strikethrough and fade-out work, but text stays its original status color (slate or amber)
errors: none
reproduction: Click status circle on a todo or in-progress task to mark done; observe text color during 1.5s animation
started: Always - green text was never implemented

## Eliminated

(none needed - root cause found on first inspection)

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskListItem.tsx line 57 - departing CSS classes
  found: "line-through opacity-0 transition-all duration-[1500ms]" - no text color override
  implication: Text color stays whatever colors.text was (e.g. text-slate-700 for todo)

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskListItem.tsx lines 75 and 77 - child elements also use colors.text
  found: Icon (line 75) uses colors.text, title span (line 77) uses colors.text - neither is overridden during departure
  implication: ALL text-colored elements need green override during departure, not just the container

## Resolution

root_cause: The departing class list (line 57) only applies line-through and opacity-0. It never adds a green text color class. Additionally, child elements (icon on line 75 and title span on line 77) have their own explicit colors.text classes which would override any text color set on the parent container.
fix: Add text-green-600 to the departing classes on the container (line 57), AND override colors.text on the icon (line 75) and title span (line 77) when departing is true.
verification: pending
files_changed: [src/components/list/TaskListItem.tsx]
