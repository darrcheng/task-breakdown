---
status: resolved
trigger: "Investigate why swipe-to-reveal actions on task rows aren't working on mobile"
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:00:00Z
---

## Current Focus

hypothesis: SwipeableTaskRow exists but is never imported or rendered anywhere in the app
test: grep for SwipeableTaskRow imports across entire src tree
expecting: zero imports outside its own definition file
next_action: document root cause and fix plan

## Symptoms

expected: Swiping left on a task row on mobile reveals Delete (red) and Done (green) action buttons
actual: Nothing happens when swiping on task rows - no action buttons appear
errors: None (no console errors, component simply not rendered)
reproduction: Open app in Chrome DevTools mobile mode (<768px), swipe left on any task row
started: Component was created but never wired in

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-28T00:01:00Z
  checked: grep for "SwipeableTaskRow" across entire src/ directory
  found: Only 2 matches, both inside SwipeableTaskRow.tsx itself (interface + export). Zero imports anywhere else.
  implication: Component was built but never integrated into the rendering tree.

- timestamp: 2026-02-28T00:02:00Z
  checked: DaySwipeView.tsx lines 68-75 (where mobile task rows are rendered)
  found: Renders bare `<TaskListItem>` without any SwipeableTaskRow wrapper
  implication: This is the exact location where SwipeableTaskRow should wrap each TaskListItem

- timestamp: 2026-02-28T00:03:00Z
  checked: DaySwipeView.tsx swipe handler (lines 36-42) for potential conflicts
  found: DaySwipeView uses react-swipeable for day-to-day navigation (left=next day, right=prev day) with delta=50. SwipeableTaskRow also uses react-swipeable with delta=20 for row reveal.
  implication: Even after wiring SwipeableTaskRow, there will be a swipe conflict. Both the parent (day navigation) and child (row reveal) listen for horizontal swipe. The child's lower delta (20) means it fires first, but the parent's handler will ALSO fire on the same gesture, causing the day to change while trying to reveal actions. This must be addressed.

- timestamp: 2026-02-28T00:04:00Z
  checked: TaskListItem.tsx interface (line 18-22)
  found: TaskListItem accepts { task, categoryMap, onClick } - no onComplete or onDelete props
  implication: SwipeableTaskRow requires onComplete and onDelete callbacks. These need to be passed through from DaySwipeView, which means DaySwipeView needs new props or needs to handle delete/complete internally via db.

- timestamp: 2026-02-28T00:05:00Z
  checked: react-swipeable in package.json
  found: "react-swipeable": "^7.0.2" is installed
  implication: No missing dependency issue

## Resolution

root_cause: |
  SwipeableTaskRow component exists at src/components/mobile/SwipeableTaskRow.tsx and is
  properly implemented, but it is NEVER imported or used anywhere in the application.

  DaySwipeView.tsx (the mobile day view) renders TaskListItem directly without wrapping
  it in SwipeableTaskRow. The component was created but the integration step was missed.

fix: |
  Two files need changes. One secondary issue must also be addressed.

  PRIMARY FIX - src/components/mobile/DaySwipeView.tsx:
  1. Import SwipeableTaskRow
  2. Import db from '../../db/database' (for delete/complete handlers)
  3. Wrap each <TaskListItem> inside <SwipeableTaskRow> in the tasks.map() loop
  4. Provide onComplete and onDelete callbacks that update the database

  SECONDARY FIX - Swipe conflict resolution:
  DaySwipeView uses react-swipeable for horizontal day navigation (delta=50).
  SwipeableTaskRow also uses react-swipeable for horizontal row reveal (delta=20).
  Both are horizontal swipes, so they will conflict. A left swipe on a task row would
  both reveal actions AND navigate to the next day.

  Fix options (choose one):
  A) Stop event propagation in SwipeableTaskRow when a row swipe is detected, so the
     parent DaySwipeView handler doesn't also fire
  B) Track in DaySwipeView whether a child row is being swiped and suppress day
     navigation during that time (e.g., via React context or callback prop)
  C) Change DaySwipeView's day navigation to only work on the header area, not the
     task list area

verification: []
files_changed: []
