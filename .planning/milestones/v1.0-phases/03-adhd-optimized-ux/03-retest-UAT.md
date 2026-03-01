---
status: diagnosed
phase: 03-adhd-optimized-ux
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-06-SUMMARY.md, 03-07-SUMMARY.md
started: 2026-02-23T23:30:00Z
updated: 2026-02-24T00:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Celebration Animation on Task Completion
expected: Complete a task (check it off). You should see an emerald/green ring glow appear around the task, then the task fades out over ~1.5 seconds. The glow appears first, then the fade follows.
result: issue
reported: "There is no fade, it just disappears without a fade. Also, the background of the box is still yellow when the fade ends. Shouldn't it turn green?"
severity: major

### 2. Subtask Celebration Animation
expected: Open a task with subtasks, complete a subtask. You should see the same emerald ring glow then fade animation. The subtask should not just disappear — it should glow first, then fade.
result: issue
reported: "No animation, it just disappears. Perhaps this is to do with the filter that all done tasks are not shown? Also my subtasks are no longer displayed on the calendar. Subtasks are still not displayed in list view"
severity: major

### 3. Task Reappears When Showing Completed
expected: Toggle "show completed" on, then complete a task. After the celebration animation finishes, the task should reappear (marked as done) — not permanently disappear.
result: issue
reported: "the celebration animation happens then it disappears then reappears. this makes no sense. it should just transition to the final done state"
severity: major

### 4. Start-Here Violet Ring
expected: Open a task with multiple subtasks (some incomplete). First incomplete subtask has a violet/purple ring highlight. Complete it — the ring should move to the next incomplete subtask.
result: pass

### 5. Energy Level Selector in Task Form
expected: Create or edit a task. You should see three chip buttons: Low (battery icon), Medium (battery-medium icon), High (zap icon). Click one to select (highlights in color). Click again to deselect.
result: pass

### 6. Energy Badge on Task Cards
expected: Set an energy level on a task, then view the task card. A small colored badge should appear (Low in blue, Medium in amber, High in green).
result: pass

### 7. Energy Filter in App Header
expected: In the header, click an energy filter chip (e.g., High). Only tasks with that energy level appear. Click the same chip again to clear filter — all tasks visible again. Works in both calendar and list views.
result: pass

### 8. AI Time Estimate on Task Card
expected: With an AI provider configured, create a new task. After a few seconds, a time estimate badge (e.g., "~15m" or "~1h") should appear on the task card.
result: pass

### 9. Time Estimate Override in Task Modal
expected: Open a task that has an AI estimate. See clock icon + estimate. Click pencil icon, type a different value, press Enter. Override replaces the AI estimate. Card badge updates.
result: pass

### 10. Overdue Banner
expected: Have overdue tasks (past-due, not done). Warm amber banner appears at top of calendar view. Dismiss with X — stays dismissed for the day.
result: pass

### 11. Overdue Quick Picker with Inline Calendar
expected: Click "Review" on overdue banner. Modal opens with overdue tasks. Click the calendar icon on a task — the calendar should appear INLINE immediately (no extra click, no scrolling needed). Pick a date to reschedule.
result: pass

### 12. Someday View
expected: Switch to Someday view via third toggle button or press 's'. Tasks sent to Someday appear here. Rescue a task (calendar icon, pick date) — it returns to calendar. Delete with click-to-confirm (first click turns red, second deletes).
result: issue
reported: "Can't send a task to someday. We should have a button on the calendar or next to the calendar that does that. I don't think it needs to be overdue to send to someday"
severity: major

### 13. AI Breakdown Works
expected: Open an existing task, click "Break it down" button. AI should generate subtasks — not show the setup/configure modal when a provider is already configured.
result: issue
reported: "still get the error message {\"error\":{\"message\":\"{\\n \\\"error\\\": {\\n \\\"code\\\": 400,\\n \\\"message\\\": \\\"Developer instruction is not enabled for models/gemma-3-27b-it\\\",\\n \\\"status\\\": \\\"INVALID_ARGUMENT\\\"\\n }\\n}\\n\",\"code\":400,\"status\":\"\"}}"
severity: blocker

### 14. Post-Create Edit View with Breakdown Button
expected: Create a NEW task via the modal. After saving, the modal should stay open showing the task in edit view. The "Break it down" button should be immediately visible without reopening the task.
result: issue
reported: "There is no save button when first creating the task."
severity: major

### 15. Autosave on Modal Close
expected: Open an existing task in the modal. Make a change (edit title or description). Press Escape or click the backdrop outside. Changes should save automatically. Reopen to confirm.
result: pass
note: "User observation: if autosave works, save button may be redundant"

### 16. Enter Key Inline Create in List View
expected: Switch to list view. Press Enter on keyboard. An inline task creation row should appear for today's date.
result: issue
reported: "Pressing enter allows me to create an item, but there's no way to actually create it. pressing enter doesn't keep it neither is there a button"
severity: major

## Summary

total: 16
passed: 9
issues: 7
pending: 0
skipped: 0

## Gaps

- truth: "Completing a task shows emerald ring glow then fades out over ~1.5s"
  status: failed
  reason: "User reported: There is no fade, it just disappears without a fade. Also, the background of the box is still yellow when the fade ends. Shouldn't it turn green?"
  severity: major
  test: 1
  root_cause: "Two issues: (1) STATUS_COLORS[task.status] uses DB prop not local displayStatus — background stays yellow during animation. (2) Single requestAnimationFrame unreliable — opacity-0 applied in same compositor frame as ring classes, no CSS transition fires."
  artifacts:
    - path: "src/components/list/TaskListItem.tsx"
      issue: "Line 39: STATUS_COLORS[task.status] should be STATUS_COLORS[displayStatus]. Lines 31-36: single rAF unreliable, needs double rAF."
  missing:
    - "Use STATUS_COLORS[displayStatus] for immediate green background on complete"
    - "Double requestAnimationFrame to guarantee paint between ring and fade phases"
  debug_session: ".planning/debug/celebration-anim-still-broken.md"
- truth: "Completing a subtask shows emerald ring glow then fade animation"
  status: failed
  reason: "User reported: No animation, it just disappears. Perhaps this is to do with the filter that all done tasks are not shown? Also my subtasks are no longer displayed on the calendar. Subtasks are still not displayed in list view"
  severity: major
  test: 2
  root_cause: "Same single-rAF timing bug as TaskListItem. SubtaskList only rendered inside TaskModal — not shown inline in TaskCard or TaskListItem."
  artifacts:
    - path: "src/components/task/SubtaskList.tsx"
      issue: "Lines 104-111: single rAF unreliable, needs double rAF"
    - path: "src/components/task/TaskCard.tsx"
      issue: "No subtask rendering — SubtaskList only in TaskModal"
    - path: "src/components/list/TaskListItem.tsx"
      issue: "No subtask rendering inline"
  missing:
    - "Double rAF in SubtaskList departure animation"
    - "Add subtask count/progress indicator to TaskCard and TaskListItem"
  debug_session: ".planning/debug/celebration-anim-still-broken.md"
- truth: "Completed task transitions to done state when show-completed is on"
  status: failed
  reason: "User reported: the celebration animation happens then it disappears then reappears. this makes no sense. it should just transition to the final done state"
  severity: major
  test: 3
  root_cause: "Dexie liveQuery re-render races with local state reset. DB write triggers re-render with departingPhase still 'fade' (invisible), then setDepartingPhase(null) fires and element pops back visible."
  artifacts:
    - path: "src/components/list/TaskListItem.tsx"
      issue: "Lines 84-91: setDepartingPhase(null) fires after DB write triggers Dexie re-render — element disappears then reappears"
  missing:
    - "When showCompleted=true, skip fade-to-invisible and transition to done color scheme instead"
    - "Or reset departingPhase before DB write so component is in final state when Dexie re-renders"
  debug_session: ".planning/debug/celebration-anim-still-broken.md"
- truth: "Users can send any task to Someday from calendar/list view"
  status: failed
  reason: "User reported: Can't send a task to someday. We should have a button on the calendar or next to the calendar that does that. I don't think it needs to be overdue to send to someday"
  severity: major
  test: 12
  root_cause: "Send-to-Someday action only exists in OverdueQuickPicker. Never added to TaskModal, TaskListItem, or TaskCard. Missing feature, not regression."
  artifacts:
    - path: "src/components/task/TaskModal.tsx"
      issue: "No someday/archive button"
    - path: "src/components/list/TaskListItem.tsx"
      issue: "No someday/archive button"
    - path: "src/components/overdue/OverdueQuickPicker.tsx"
      issue: "Has the working pattern: db.tasks.update(task.id!, { isSomeday: true })"
  missing:
    - "Add Archive button to TaskModal (near delete/breakdown area)"
    - "Add Archive quick-action button to TaskListItem"
  debug_session: ".planning/debug/no-someday-button-on-task-cards.md"
- truth: "AI breakdown generates subtasks for the selected model"
  status: failed
  reason: "User reported: error - Developer instruction is not enabled for models/gemma-3-27b-it"
  severity: blocker
  test: 13
  root_cause: "GeminiProvider.generateSubtasks() unconditionally passes systemInstruction in API config (line 58). Gemma models (gemma-3-12b-it, gemma-3-27b-it) don't support systemInstruction. testConnection() doesn't use systemInstruction so gives false confidence."
  artifacts:
    - path: "src/ai/providers/gemini.ts"
      issue: "Line 58: systemInstruction sent unconditionally — fails for Gemma models"
    - path: "src/types/index.ts"
      issue: "Both Gemma model IDs offered with no warning about limitations"
  missing:
    - "Detect Gemma models (model.startsWith('gemma-')) and prepend system prompt to user message instead of using systemInstruction"
    - "Update testConnection() to test with system instruction for accurate validation"
  debug_session: ".planning/debug/gemma-system-instruction-400.md"
- truth: "New task creation modal has a save button and stays open in edit view after save"
  status: failed
  reason: "User reported: There is no save button when first creating the task."
  severity: major
  test: 14
  root_cause: "Create button IS rendered but pushed below visible area. TaskModal applies maxHeight:700px when opened via calendar click. 7-section form + modal chrome exceeds viewport, button requires scrolling."
  artifacts:
    - path: "src/components/task/TaskModal.tsx"
      issue: "Line 185: maxHeight:700px clips form actions below fold"
    - path: "src/components/task/TaskForm.tsx"
      issue: "Action buttons not sticky — scroll past viewport edge"
  missing:
    - "Make action buttons sticky at bottom of modal form"
    - "Or reduce form section spacing to fit within maxHeight"
  debug_session: ".planning/debug/save-btn-and-inline-create.md"
- truth: "Enter key inline create in list view submits the new task"
  status: failed
  reason: "User reported: Pressing enter allows me to create an item, but there's no way to actually create it. pressing enter doesn't keep it neither is there a button"
  severity: major
  test: 16
  root_cause: "TaskInlineCreate form has TWO text inputs (title + CategoryCombobox) but ZERO submit buttons. HTML spec blocks implicit form submission when multiple text inputs exist without a submit button."
  artifacts:
    - path: "src/components/task/TaskInlineCreate.tsx"
      issue: "No <button type='submit'> in form, and no onKeyDown Enter handler on title input"
    - path: "src/components/task/CategoryCombobox.tsx"
      issue: "Second text input in form blocks implicit submission; Enter is intercepted by e.preventDefault()"
  missing:
    - "Add submit button to TaskInlineCreate (visible or sr-only)"
    - "Add explicit Enter keydown handler on title input to call handleSubmit"
  debug_session: ".planning/debug/save-btn-and-inline-create.md"
