---
status: complete
phase: 03-adhd-optimized-ux
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-02-23T22:45:00Z
updated: 2026-02-23T23:05:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Celebration Animation
expected: Complete a task in list view — emerald ring glow appears, text gets strikethrough, row fades out over ~1.5s. Re-click during fade reverts to todo.
result: pass

### 2. Subtask Celebration
expected: Open a task with subtasks, complete a subtask — same emerald ring glow + fade treatment as parent tasks.
result: issue
reported: "Subtasks only visible in calendar view, not list view. No emerald ring border on subtask completion — task just disappears then reappears. Also, completing a task when 'showing done' causes it to straight up disappear."
severity: major

### 3. Start-Here Ring
expected: Open a task with multiple subtasks (some incomplete). First incomplete subtask has a violet ring border. Complete it — violet ring moves to the next incomplete subtask. No text label, purely visual.
result: pass

### 4. Energy Level Selector
expected: Create or edit a task — 3-chip energy selector appears (Low/Medium/High with battery/zap icons). Select one, save. Energy badge appears on the task card in both calendar and list views.
result: pass

### 5. Energy Filter
expected: In the header, click an energy filter chip (e.g., High). Only tasks with that energy level appear in both calendar and list views. Click the same chip again to clear — all tasks visible again.
result: pass

### 6. AI Time Estimate
expected: With an AI provider configured (Settings), create a new task with a clear title. After a few seconds, a time estimate badge (e.g., "~30m") appears on the task card.
result: pass

### 7. Time Estimate Override
expected: Open a task modal that has an AI estimate. See Clock icon + estimate. Click the pencil icon, enter a different value, press Enter or click away. Override value replaces the AI estimate. Badge on card updates.
result: pass

### 8. Overdue Banner
expected: With overdue tasks (past-due, not done), navigate to today in calendar view. Warm amber banner appears at top: "You've got N tasks from earlier..." (no guilt language). Dismiss with X — banner stays dismissed for the rest of the day (survives page refresh).
result: pass

### 9. Quick Picker
expected: Click "Review" on the overdue banner. Modal shows all overdue tasks with per-task actions: reschedule (calendar icon opens date picker), send to Someday (archive icon), mark done (checkmark). Test "Move all to today" bulk action.
result: issue
reported: "Quick picker reschedule: clicking calendar icon shows the due date first, then you have to click the date to see the calendar, and then have to scroll down to see it. Should just pop up the calendar directly without needing to scroll."
severity: minor

### 10. Someday View
expected: Switch to Someday view via the third toggle button (Archive icon) or press `s`. Shows tasks that were sent to Someday. Tasks in Someday do NOT appear in calendar or list views.
result: pass

### 11. Someday Rescue & Delete
expected: In Someday view, click the calendar icon on a task to rescue it back to a date (date picker appears). Task moves back to calendar. Also test delete: click trash icon (first click shows red confirmation, second click deletes).
result: pass

### 12. Regression Check
expected: Verify existing features still work: drag-and-drop in calendar/list, task modal create/edit, AI subtask breakdown, keyboard shortcuts (j/k/t/m/w/c/l/n/?).
result: issue
reported: "AI break it down no longer works. Also shouldn't need to close the task to see the AI breakdown button. Also modals should autosave on esc or clicking out instead of requiring save button."
severity: major

## Summary

total: 12
passed: 9
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Completing a subtask shows emerald ring glow + fade celebration animation"
  status: failed
  reason: "User reported: Subtasks only visible in calendar view, not list view. No emerald ring border on subtask completion — task just disappears then reappears. Also, completing a task when 'showing done' causes it to straight up disappear."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
- truth: "Pressing Enter in list view creates a new task"
  status: failed
  reason: "User reported: Pressing enter no longer allows creating a new task in list view"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
- truth: "Quick picker reschedule opens calendar date picker directly without extra clicks or scrolling"
  status: failed
  reason: "User reported: clicking calendar icon shows the due date first, then you have to click the date to see the calendar, and then have to scroll down to see it. Should just pop up the calendar directly without needing to scroll."
  severity: minor
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
- truth: "AI break it down (subtask generation) works after Phase 3 changes"
  status: failed
  reason: "User reported: AI break it down no longer works"
  severity: major
  test: 12
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
- truth: "AI breakdown button visible without closing and reopening the task"
  status: failed
  reason: "User reported: shouldn't need to close the task to see the AI breakdown button"
  severity: minor
  test: 12
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
- truth: "Task modals autosave on esc or clicking outside"
  status: failed
  reason: "User reported: modals should autosave on esc or clicking out instead of requiring save button"
  severity: minor
  test: 12
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
