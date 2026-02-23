---
status: complete
phase: 02-ai-task-breakdown
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. AI Provider Settings Section
expected: Open Settings modal. An "AI Provider" section appears between "Start of Week" and "Keyboard Shortcuts" with radio buttons for Claude and Gemini.
result: pass

### 2. API Key Entry and Masked Display
expected: Select a provider and enter an API key. The key is saved and displayed masked showing only the last 4 characters (e.g., ****abcd). A "Test" button verifies the connection.
result: pass

### 3. Provider Setup Modal (First Use)
expected: If no AI provider is configured and you click "Break it down" on a task, a 3-step setup modal appears: (1) choose provider, (2) enter API key, (3) connection confirmed.
result: issue
reported: "I hit gemini, then enter in the API key, press test and save, and it's successful, but then when i hit start breaking down tasks, it takes me back to the select claude or gemini modal. But then I refresh the page and it's saved"
severity: major

### 4. "Break it down" Button Visibility
expected: Open any top-level task modal. A "Break it down" button with a Sparkles icon appears below the task form.
result: pass

### 5. Streaming Subtask Generation
expected: Click "Break it down" on a task. Subtasks appear one by one via streaming (3-5 suggestions). A loading/generating indicator shows during generation.
result: pass

### 6. Review Panel — Edit and Remove
expected: After generation completes, a review panel shows all suggested subtasks. You can edit titles inline by clicking them, and remove individual subtasks via an X button (removed items show strikethrough).
result: pass

### 7. Review Panel — Drag to Reorder
expected: In the review panel, subtasks have drag handles (grip icon on the left). Drag a subtask to reorder it within the list.
result: pass

### 8. Review Panel — Pin and Regenerate
expected: Toggle the pin icon on subtasks you want to keep. Click "Regenerate" — pinned subtasks are preserved, others are replaced with new AI suggestions. The Regenerate button shows the pinned count (e.g., "Regenerate (keeping 2)").
result: pass
note: regeneration tends to produce very similar suggestions — prompt quality improvement for later

### 9. Accept Subtasks
expected: Click "Accept All" in the review panel. All subtasks are saved to the database. The review panel closes and the subtask list appears below the task form.
result: pass

### 10. Subtask List in Parent Modal
expected: After accepting subtasks, the parent task modal shows a nested subtask list with status checkboxes and category icons for each subtask.
result: pass

### 11. Subtask Status Cycling
expected: Click a subtask's status checkbox in the list. It cycles through todo → in-progress → done. Done items show a departure animation before disappearing/repositioning.
result: issue
reported: "the color of the subtask changes to in progress, but the if you actually open up the subtask, the indicator still says to-do"
severity: major

### 12. Parent Badge on Cards
expected: On the board/calendar view, task cards that have subtasks show a small badge with a list-tree icon and the subtask count (e.g., "3").
result: pass

### 13. "All Subtasks Done" Banner
expected: Mark all subtasks as done. A banner appears in the parent modal: "All subtasks done! Complete Parent?" prompting you to complete the parent task.
result: issue
reported: "it works if i click through the status on the main task. but I can't click through on the subtasks because the subtask shows a title in the calendar view, but in the modal, everything is blank"
severity: major

### 14. Recursive Breakdown (Depth Limit)
expected: Open a subtask's modal and click "Break it down" to create sub-subtasks. The button shows a level indicator (e.g., "Level 2"). At depth 3+, the "Break it down" button is hidden.
result: pass

### 15. Parent Navigation Breadcrumb
expected: When viewing a subtask modal, a "Back to [parent name]" breadcrumb appears at the top. Clicking it navigates back to the parent task modal.
result: issue
reported: "only if you go directly from the parent, but not when you go directly from the modal"
severity: major

## Summary

total: 15
passed: 11
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "After completing provider setup, clicking 'start breaking down tasks' should proceed to task breakdown, not loop back to provider selection"
  status: failed
  reason: "User reported: I hit gemini, then enter in the API key, press test and save, and it's successful, but then when i hit start breaking down tasks, it takes me back to the select claude or gemini modal. But then I refresh the page and it's saved"
  severity: major
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Clicking subtask status checkbox in parent list should persist the status change to the database, visible when opening the subtask modal"
  status: failed
  reason: "User reported: the color of the subtask changes to in progress, but the if you actually open up the subtask, the indicator still says to-do"
  severity: major
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Subtask modals should show full task data (title, description, form fields) when opened directly from calendar/board view"
  status: failed
  reason: "User reported: subtask shows a title in the calendar view, but in the modal, everything is blank"
  severity: major
  test: 13
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Parent navigation breadcrumb should appear when opening a subtask modal from any entry point (calendar, board, list), not just when drilling down from parent"
  status: failed
  reason: "User reported: only if you go directly from the parent, but not when you go directly from the modal"
  severity: major
  test: 15
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
