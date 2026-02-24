---
status: diagnosed
trigger: "Investigate why users can't send a task to Someday from the normal calendar or list view"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: The "send to someday" action was only implemented in the OverdueQuickPicker and never added to the normal task interaction surfaces (TaskCard, TaskListItem, TaskModal/TaskForm).
test: Search all components for isSomeday usage and UI affordances
expecting: Confirm no someday button exists on any normal task surface
next_action: Report findings

## Symptoms

expected: Users should be able to send any task to Someday from the calendar view, list view, or task modal — regardless of whether the task is overdue.
actual: The only way to send a task to Someday is through the OverdueQuickPicker, which only appears for overdue tasks. Regular task cards, list items, and the task edit modal have no "send to someday" button.
errors: N/A (missing feature, not a bug)
reproduction: Open any non-overdue task via calendar or list view. There is no option to send it to Someday.
started: Always — Someday action was only ever implemented in OverdueQuickPicker.

## Eliminated

(none needed — root cause is clear)

## Evidence

- timestamp: 2026-02-23
  checked: TaskCard.tsx (61 lines)
  found: Pure display component. No actions, no context menu, no someday button. Only renders task title, energy, estimate, parent badge. Single onClick handler passed from parent.
  implication: No way to send to someday from calendar card.

- timestamp: 2026-02-23
  checked: TaskListItem.tsx (155 lines)
  found: Has a status-cycle button (todo -> in-progress -> done) but zero someday functionality. No Archive icon, no isSomeday reference.
  implication: No way to send to someday from list view.

- timestamp: 2026-02-23
  checked: TaskModal.tsx (370 lines)
  found: Contains TaskForm, BreakdownButton, SubtaskList, time estimate override. No someday button. handleSubmit passes title/description/status/categoryId/date/energyLevel — isSomeday is not in the form data.
  implication: No way to send to someday from the edit modal.

- timestamp: 2026-02-23
  checked: TaskForm.tsx (270 lines)
  found: Form fields: title, date, status, energy, category, description. No isSomeday field or button anywhere. The onSubmit payload type does not include isSomeday.
  implication: Even if TaskModal wanted to handle someday, the form doesn't surface it.

- timestamp: 2026-02-23
  checked: TaskInlineEdit.tsx (47 lines)
  found: Wraps TaskForm with db update on submit. No someday action.
  implication: Inline edit also lacks someday.

- timestamp: 2026-02-23
  checked: OverdueQuickPicker.tsx (155 lines) — THE REFERENCE IMPLEMENTATION
  found: Contains the working someday pattern in two places:
    1. Per-task: handleSomeday (line 22-24) — `db.tasks.update(task.id!, { isSomeday: true, updatedAt: new Date() })`
    2. Bulk: handleSendAllToSomeday (line 93-98) — same update for all tasks
    Uses Archive icon from lucide-react. Button styled with amber hover color. Title "Send to Someday".
  implication: The DB operation is trivial (one field update). The pattern is proven and working.

- timestamp: 2026-02-23
  checked: SomedayView.tsx (117 lines)
  found: The reverse operation (rescue from Someday) works: sets isSomeday: false and assigns a new date. Confirms the data model is bidirectional.
  implication: Data layer is complete. Only UI entry points are missing.

- timestamp: 2026-02-23
  checked: db/hooks.ts (131 lines)
  found: All query hooks already filter out isSomeday tasks from calendar/list views (lines 16, 18, 41, 43, 117). useSomedayTasks hook exists at line 126-129. Overdue hook at line 110-121 also excludes someday tasks.
  implication: Data layer is fully ready. Setting isSomeday=true on any task will immediately remove it from calendar/list and make it appear in SomedayView.

## Resolution

root_cause: The "send to someday" action was implemented exclusively in OverdueQuickPicker during the ADHD-optimized UX phase. It was never propagated to the three main task interaction surfaces: TaskCard (calendar), TaskListItem (list view), or TaskModal (edit modal). This is a missing feature, not a regression.

fix: N/A (investigation only)
verification: N/A
files_changed: []
