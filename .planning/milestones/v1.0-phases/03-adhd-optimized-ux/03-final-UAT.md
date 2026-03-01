---
status: diagnosed
phase: 03-adhd-optimized-ux
source: 03-11-SUMMARY.md, 03-12-SUMMARY.md, 03-13-SUMMARY.md, 03-14-SUMMARY.md
started: 2026-02-24T02:00:00Z
updated: 2026-02-24T02:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Celebration Animation — List View
expected: In list view, check off an incomplete task. You should see: (1) Background turns green, (2) Emerald ring glow appears, (3) Smooth fade-out over ~1.5s. With "show completed" on, ring glow fades gradually (no abrupt disappear).
result: pass

### 2. Celebration Animation — Subtask Modal
expected: Open a task with multiple subtasks. Complete a subtask — emerald ring glow appears on the subtask row, then it fades out smoothly. No flash/disappear-reappear. Violet start-here ring moves to next incomplete subtask.
result: issue
reported: "it fades out smoothly, then it reappears. I think what we got wrong here is that these within the subtask tree, these don't disappear. So it makes no sense for the fade to disappear. Just do the fade to green and cross out"
severity: major

### 3. Enter Key After Category Selection (Inline Create)
expected: In list view, trigger inline create. Type a title, Tab to category field, type something, arrow-down to select, press Enter to confirm selection. Then press Enter again — the task should be CREATED (not reopen the category dropdown).
result: issue
reported: "task is created, but the category dropdown doesn't reset to select category"
severity: minor

### 4. No Save/Cancel Buttons in Edit Mode
expected: Open an existing task in the modal (click a task). The modal should NOT show Save or Cancel buttons. Only a Delete button should be visible at the bottom. Changes auto-save when you close the modal (Escape or backdrop click).
result: pass

### 5. Someday Button Near DatePicker
expected: Open an existing task in the modal. Below the date picker, you should see a compact "Someday" button (with archive icon). Click it — the task moves to Someday and the modal closes.
result: issue
reported: "Can you change it to save for someday"
severity: cosmetic

### 6. Enter-to-Create in Task Modal
expected: Open a NEW task modal (click + on a calendar day). Type a title in the title field and press Enter. The task should be created (same as clicking the Create button).
result: issue
reported: "I don't want to need to click enter, once I click out of the main box, and there's something in the main box, it should create a task"
severity: minor

### 7. List View Opens Full TaskModal
expected: Switch to list view. Click on any task. The full TaskModal should open (centered) — showing subtask tree, AI breakdown button, time estimates, and all the same features as when clicking a task in calendar view. NOT a bare inline edit form.
result: pass

## Summary

total: 7
passed: 3
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Completing a subtask shows celebration then stays visible as done"
  status: failed
  reason: "User reported: it fades out smoothly, then it reappears. Subtasks don't disappear from the tree — fade-to-invisible makes no sense. Just fade to green and cross out."
  severity: major
  test: 2
  root_cause: "SubtaskRow in SubtaskList.tsx copies TaskListItem's departure animation (ring→fade→settling→null) but subtasks never leave the tree. The fade phase applies opacity-0 making subtask invisible, then settling removes opacity-0 causing reappear. Need celebration-only animation: ring glow + green bg, then transition to done styling — no opacity-0."
  artifacts:
    - path: "src/components/task/SubtaskList.tsx"
      issue: "Line 211: fade phase applies opacity-0; lines 179-202: departure state machine wrong metaphor for subtasks"
  missing:
    - "Replace opacity-0 in fade phase with bg-emerald-50 to keep subtask visible"
    - "Settling phase transitions from celebration styling to normal done styling (text-slate-400 line-through)"
  debug_session: ".planning/debug/subtask-fade-reappear.md"

- truth: "Category dropdown resets after inline task creation"
  status: failed
  reason: "User reported: task is created, but the category dropdown doesn't reset to select category"
  severity: minor
  test: 3
  root_cause: "TaskInlineCreate.handleSubmit resets title (setTitle('')) on line 36 but never resets categoryId. CategoryCombobox is fully controlled — stale categoryId keeps showing previous selection. Component stays mounted for rapid entry."
  artifacts:
    - path: "src/components/task/TaskInlineCreate.tsx"
      issue: "Line 36: missing setCategoryId(0) after setTitle('')"
  missing:
    - "Add setCategoryId(0) after setTitle('') in handleSubmit"
  debug_session: ".planning/debug/category-combobox-no-reset.md"

- truth: "Someday button label says 'Save for Someday'"
  status: failed
  reason: "User reported: change label to 'Save for Someday'"
  severity: cosmetic
  test: 5
  root_cause: "TaskForm.tsx line 168 renders 'Someday' as button text. User wants 'Save for Someday'."
  artifacts:
    - path: "src/components/task/TaskForm.tsx"
      issue: "Line 168: button text says 'Someday' instead of 'Save for Someday'"
  missing:
    - "Change text from 'Someday' to 'Save for Someday' on line 168"
  debug_session: ""

- truth: "Task auto-creates when clicking out of title field with text entered"
  status: failed
  reason: "User reported: don't want to press Enter, once I click out of the main box and there's something in it, it should create a task"
  severity: minor
  test: 6
  root_cause: "TaskModal already auto-saves on dismiss (backdrop/Escape) via formRef.current?.submit() — but in create mode, handleSubmit transitions to edit mode instead of closing. The modal stays open after auto-create, confusing the user. Need a closingRef flag so dismiss-triggered creates close the modal instead of staying open."
  artifacts:
    - path: "src/components/task/TaskModal.tsx"
      issue: "Lines 94-129: create branch stays in modal instead of closing on dismiss-triggered submit"
  missing:
    - "Add closingRef flag; set before dismiss-triggered submit(); in handleSubmit create branch, check flag to close instead of transitioning to edit mode"
  debug_session: ""
