---
status: diagnosed
phase: 03-adhd-optimized-ux
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-02-23T22:45:00Z
updated: 2026-02-23T23:10:00Z
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
  root_cause: "Three sub-issues: (1) CSS transition race — opacity-0 and transition-all applied in same paint frame so no animation fires. (2) TaskListItem missing setDeparting(false) after DB write — task stays invisible when showCompleted=true. (3) Subtasks appear as orphan rows in list view because hooks don't filter by parentId."
  artifacts:
    - path: "src/components/task/SubtaskList.tsx"
      issue: "opacity-0 and transition-all in same className string — no CSS transition fires"
    - path: "src/components/list/TaskListItem.tsx"
      issue: "Same CSS race; also missing setDeparting(false) in departure timeout callback"
    - path: "src/db/hooks.ts"
      issue: "useTasksByDate/Range missing !t.parentId filter — subtasks leak into flat list"
  missing:
    - "Split departure into two-frame animation (frame 1: ring+transition, frame 2: opacity-0)"
    - "Add setDeparting(false) after DB write in TaskListItem timeout callback"
    - "Add !t.parentId to hook filter predicates"
  debug_session: ".planning/debug/subtask-celebration-animation.md"
- truth: "Pressing Enter in list view creates a new task"
  status: failed
  reason: "User reported: Pressing enter no longer allows creating a new task in list view"
  severity: major
  test: 6
  root_cause: "Enter key shortcut for inline task creation was never implemented — not a regression. DayGroup only opens inline create via mouse click on '+' button or empty area. No case 'Enter' in App.tsx keyboard handler."
  artifacts:
    - path: "src/components/list/DayGroup.tsx"
      issue: "Only mouse click triggers setIsCreating — no keyboard handler for Enter"
    - path: "src/App.tsx"
      issue: "No case 'Enter' in global keyboard switch"
  missing:
    - "Add Enter key handler in App.tsx for list view that triggers inline create on today's DayGroup"
  debug_session: ".planning/debug/enter-key-no-new-task-list-view.md"
- truth: "Quick picker reschedule opens calendar date picker directly without extra clicks or scrolling"
  status: failed
  reason: "User reported: clicking calendar icon shows the due date first, then you have to click the date to see the calendar, and then have to scroll down to see it. Should just pop up the calendar directly without needing to scroll."
  severity: minor
  test: 9
  root_cause: "DatePicker starts with isOpen=false (two-click problem). Calendar dropdown uses position:absolute inside overflow-y-auto container (scroll problem). Need defaultOpen prop and inline rendering mode."
  artifacts:
    - path: "src/components/task/DatePicker.tsx"
      issue: "isOpen defaults to false — requires second click to open calendar"
    - path: "src/components/overdue/OverdueQuickPicker.tsx"
      issue: "DatePicker absolute dropdown renders inside scrollable modal — pushed out of view"
  missing:
    - "Add defaultOpen prop to DatePicker, pass defaultOpen={true} from OverdueQuickPicker"
    - "Add inline variant to DatePicker that skips trigger button and removes absolute positioning"
  debug_session: ".planning/debug/overdue-quick-picker-calendar-ux.md"
- truth: "AI break it down (subtask generation) works after Phase 3 changes"
  status: failed
  reason: "User reported: AI break it down no longer works"
  severity: major
  test: 12
  root_cause: "useBreakdown.ts checks isConfigured from useAIProvider state which initializes as false until useEffect fires. Clicking 'Break it down' before async init completes hits !isConfigured branch and shows setup modal even when AI is configured. Phase 03's second useAIProvider instance widened the timing window."
  artifacts:
    - path: "src/hooks/useBreakdown.ts"
      issue: "Stale isConfigured check races with async useEffect init — line 37"
  missing:
    - "Replace isConfigured guard with direct getProvider() call that reads live localStorage"
  debug_session: ".planning/debug/ai-breakdown-regression-phase03.md"
- truth: "AI breakdown button visible without closing and reopening the task"
  status: failed
  reason: "User reported: shouldn't need to close the task to see the AI breakdown button"
  severity: minor
  test: 12
  root_cause: "TaskModal.tsx handleSubmit for new task calls onClose() immediately after db.tasks.add(). BreakdownButton only renders when isEditing=true. User never sees edit view for newly created task."
  artifacts:
    - path: "src/components/task/TaskModal.tsx"
      issue: "onClose() called immediately after create — line 113. Should navigate into edit view instead."
  missing:
    - "After db.tasks.add(), fetch new task and switch to edit view within same modal session"
  debug_session: ".planning/debug/ai-breakdown-regression-phase03.md"
- truth: "Task modals autosave on esc or clicking outside"
  status: failed
  reason: "User reported: modals should autosave on esc or clicking out instead of requiring save button"
  severity: minor
  test: 12
  root_cause: "TaskModal Escape handler (line 76) and backdrop onClick (line 191) call onClose() directly, bypassing TaskForm. Form state is internal — no imperative handle exists to trigger save externally."
  artifacts:
    - path: "src/components/task/TaskModal.tsx"
      issue: "Escape and backdrop close without saving — lines 76, 191"
    - path: "src/components/task/TaskForm.tsx"
      issue: "No forwardRef/useImperativeHandle to expose submit() method"
  missing:
    - "Add useImperativeHandle + forwardRef to TaskForm exposing submit()"
    - "Call formRef.current?.submit() before onClose() in Escape and backdrop handlers"
  debug_session: ".planning/debug/ai-breakdown-regression-phase03.md"
