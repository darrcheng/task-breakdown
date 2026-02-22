---
status: resolved
trigger: "calendar day cell click area - only date number clickable, not full cell"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - click handler on inner div, not on DroppableDay outer container
test: Code inspection of DayCell.tsx
expecting: handler on container vs inner element
next_action: return diagnosis

## Symptoms

expected: Clicking anywhere in a day cell opens task creation modal
actual: Only clicking the date number or task list area triggers task creation
errors: none
reproduction: Click on blank white space below tasks in any day cell - nothing happens
started: since implementation

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: DayCell.tsx line 37-72, DroppableDay.tsx line 10-26
  found: |
    DroppableDay renders an outer div with className including min-h-[80px] and cursor-pointer.
    Inside it, a separate inner div on line 45 carries the onClick={handleCellClick} handler.
    This inner div has NO height/sizing classes - it only grows to fit its content
    (the date number circle + task list). The outer DroppableDay div fills the grid cell
    via min-h-[80px], but the inner clickable div does NOT fill the outer div.
  implication: |
    The gap between the bottom of the inner content and the bottom of the cell
    is part of DroppableDay's div (no click handler) but NOT part of the inner
    div (has click handler). Clicks in that gap hit DroppableDay, which has no
    onClick - so nothing happens. The cursor-pointer on DroppableDay is misleading
    because it visually suggests the whole cell is clickable when it is not.

## Resolution

root_cause: |
  In DayCell.tsx, the onClick={handleCellClick} is attached to an unsized inner
  div (line 45) instead of the outer container. The inner div only grows to fit
  its children (date number + task cards). The outer DroppableDay container fills
  the grid cell (min-h-[80px]) but has no click handler. Any blank space below
  the date number and tasks is unreachable by the click handler.
fix: (not applied - diagnosis only)
verification: (not applied)
files_changed: []
