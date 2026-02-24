---
status: complete
phase: 03-adhd-optimized-ux
source: 03-06-SUMMARY.md, 03-07-SUMMARY.md, 03-08-SUMMARY.md, 03-09-SUMMARY.md, 03-10-SUMMARY.md
started: 2026-02-23T22:30:00Z
updated: 2026-02-24T00:45:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Celebration Animation (Re-test)
expected: In list view, check off a task. You should see: (1) Background turns green immediately, (2) Emerald ring glow appears, (3) Row fades out over ~1.5 seconds. If "show completed" is on, the item should NOT flash/disappear then reappear.
result: issue
reported: "cool, it mostly works, now the one thing left is can the ring glow around the box fade out? so with the show completed on it isn't a sudden loss of the ring glow"
severity: cosmetic

### 2. Subtask Celebration Animation (Re-test)
expected: Open a task with multiple subtasks. Complete a subtask — you should see an emerald ring glow on the subtask row, then it fades out. No disappear-then-reappear flash. The violet start-here ring should move to the next incomplete subtask.
result: issue
reported: "Nope the task still disappears"
severity: major

### 3. AI Breakdown Works (Re-test)
expected: Open a saved task in the modal. Click "Break it down" — AI should generate subtasks without showing the setup/configure modal (assuming AI provider is already configured in Settings). Should work on first click without needing to close and reopen.
result: pass

### 4. Post-Create Edit View with Breakdown Button (Re-test)
expected: Create a new task via the task modal (click + on a calendar day). After saving, the modal should stay open in edit view — NOT close. The "Break it down" button should be visible immediately without needing to close and reopen.
result: pass
note: User suggested auto-selecting category and energy level on create (like auto time estimate)

### 5. Auto-Save on Modal Close (Re-test)
expected: Open an existing task in the modal. Change the title or another field. Press Escape or click the dark backdrop outside the modal. The modal should close AND your changes should be saved (re-open the task to verify).
result: pass

### 6. Quick Picker Inline Calendar (Re-test)
expected: Click "Review" on the overdue banner. In the quick picker modal, click the reschedule (calendar) icon on a task. The calendar date picker should appear inline in the row immediately — no extra click to open, no scrolling needed to see it.
result: pass

### 7. Enter Key Inline Create in List View (Re-test)
expected: Switch to list view. Press the Enter key on your keyboard (while not focused on any input). An inline task creation row should appear for today's date.
result: pass

### 8. Gemma Model AI Breakdown
expected: If you have a Gemma model configured (gemma-3-12b or gemma-3-27b), try "Break it down" on a task. It should work without a 400 error. (Skip if no Gemma model available.)
result: pass

### 9. Inline Create Form Has Add Button
expected: In list view, trigger inline create (Enter key or + button). The inline form should have a visible "Add" button in addition to Enter-key submission.
result: issue
reported: "enter button works when I'm on the initial field, when i'm on the category field, i type something in, arrow key down, enter to select. then next enter doesn't create the task, it just opens the selection back up. I want the second enter to create"
severity: major

### 10. Sticky Create/Save Buttons in Task Modal
expected: Open the task form in a modal (especially from a calendar day click where the modal has limited height). If the form content extends, the Create/Save and Cancel buttons should remain pinned at the bottom — always visible, not scrolled off-screen.
result: issue
reported: "Why do we have the save button still? Also why do we need the create button? Why can't we autocreate once we type a task name in?"
severity: minor

### 11. Send to Someday from Task Modal
expected: Open a saved task in the modal. You should see an amber "Send to Someday" button with an archive icon. Click it — the task moves to Someday and the modal closes. Verify the task appears in Someday view and is gone from calendar/list.
result: pass
note: User wants button moved near calendar and label shortened to just "Someday"

### 12. Send to Someday from List View (Hover)
expected: In list view, hover over a task row. An archive icon should appear (on hover). Click it — the task is sent to Someday and disappears from the list.
result: pass

### 13. Subtask Progress on Task Card (Calendar)
expected: Have a task with subtasks (some done, some not). In calendar view, the task card should show a small subtask progress badge like "1/3" with a tree icon.
result: pass
note: User wants subtasks visible as separate cards on calendar and as rows in list view

### 14. Subtask Progress in List View
expected: Same task with subtasks — in list view, the task row should show a similar subtask count/progress badge (e.g., "1/3") with a tree icon.
result: issue
reported: "I see the number, but I don't see the actual subtask tree when I look at the info in list view. There also isn't AI breakdown in list view. List view should have all the same features as calendar view."
severity: major

## Summary

total: 14
passed: 8
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Ring glow fades out smoothly when show-completed is on"
  status: failed
  reason: "User reported: can the ring glow around the box fade out? so with the show completed on it isn't a sudden loss of the ring glow"
  severity: cosmetic
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Completing a subtask shows emerald ring glow + fade celebration animation"
  status: failed
  reason: "User reported: Nope the task still disappears"
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Enter after category selection in inline create submits the form"
  status: failed
  reason: "User reported: enter after category select reopens the selection instead of creating the task"
  severity: major
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Task modal should not need explicit Save/Create buttons — auto-create on title entry"
  status: failed
  reason: "User reported: Why do we have the save button still? Why can't we autocreate once we type a task name in?"
  severity: minor
  test: 10
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Someday button in modal should be near calendar with shorter label"
  status: failed
  reason: "User reported: button should be by the calendar and just say Someday to take up less space"
  severity: cosmetic
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "List view has full feature parity with calendar view — subtask tree, AI breakdown"
  status: failed
  reason: "User reported: no subtask tree in list view, no AI breakdown in list view. List view should have all the same features as calendar view."
  severity: major
  test: 14
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
