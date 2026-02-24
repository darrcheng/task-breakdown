---
status: diagnosed
trigger: "Investigate what list view is missing compared to calendar view -- subtask tree display and AI breakdown functionality"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: List view uses inline editing (TaskInlineEdit) instead of TaskModal, and TaskInlineEdit is a minimal wrapper around TaskForm that lacks SubtaskList, BreakdownButton, and SubtaskReview
test: Compare what TaskModal renders vs what TaskInlineEdit renders
expecting: TaskInlineEdit will be missing all subtask/breakdown UI
next_action: Document findings and suggested approach

## Symptoms

expected: List view should have feature parity with calendar view -- clicking a task should show subtask tree and AI breakdown button
actual: Clicking a task in list view opens an inline edit form (TaskInlineEdit) that only has TaskForm fields (title, description, status, category, date, energy). No subtask tree, no breakdown button, no subtask review.
errors: N/A (not a crash, a missing-feature gap)
reproduction: Switch to list view, click any task that has subtasks -- inline edit shows only basic form fields
started: By design -- list view was built with inline editing pattern from the start

## Eliminated

(none -- single hypothesis confirmed on first pass)

## Evidence

- timestamp: 2026-02-23T00:01:00Z
  checked: App.tsx lines 135-143 -- how calendar vs list task clicks are handled
  found: |
    Calendar click handler (handleTaskClickCalendar) opens TaskModal via setModalState.
    List click handler (handleTaskClickList) is literally a no-op: `const handleTaskClickList = (_task: Task) => {}`.
    List view task interaction is entirely handled inside DayGroup/TaskInlineEdit.
  implication: The architectural split is intentional -- list view was designed for inline editing, not modal-based editing

- timestamp: 2026-02-23T00:02:00Z
  checked: DayGroup.tsx line 94 -- what happens when a task is clicked in list view
  found: |
    onClick handler is: `(t) => setEditingTaskId(t.id ?? null)`
    This swaps the TaskListItem for a TaskInlineEdit component inline.
    There is no path to open TaskModal from list view.
  implication: Clicking a task in list view enters inline edit mode, never opens the full modal

- timestamp: 2026-02-23T00:03:00Z
  checked: TaskInlineEdit.tsx -- what it renders
  found: |
    TaskInlineEdit is a 46-line component that renders ONLY a TaskForm inside a bordered div.
    It has handleSubmit (update task) and handleDelete, but:
    - NO BreakdownButton
    - NO SubtaskList
    - NO SubtaskReview
    - NO useBreakdown hook
    - NO subtask navigation (handleOpenSubtask / parentStack)
    - NO time estimate display
    - NO "Send to Someday" button (though TaskListItem itself has one)
  implication: TaskInlineEdit is a bare-minimum edit form -- every rich feature from TaskModal is absent

- timestamp: 2026-02-23T00:04:00Z
  checked: TaskModal.tsx -- what calendar view provides via the modal
  found: |
    TaskModal provides all of these that TaskInlineEdit lacks:
    1. BreakdownButton (line 337-345) -- AI task breakdown trigger
    2. SubtaskReview (line 355-367) -- review AI-generated subtasks
    3. SubtaskList (line 370-377) -- existing subtask tree with drill-down
    4. useBreakdown hook (line 32) -- full breakdown state machine
    5. Subtask navigation (handleOpenSubtask, parentStack, breadcrumb)
    6. Time estimate display with override editing (lines 271-334)
    7. ProviderSetupModal for AI provider configuration (line 381-387)
    8. Live task reloading via useLiveQuery (line 57-60)
  implication: The feature gap is substantial -- 7+ features exist only in TaskModal

- timestamp: 2026-02-23T00:05:00Z
  checked: TaskListItem.tsx -- does the list item row show subtask info?
  found: |
    TaskListItem DOES show a subtask count badge (lines 160-165): "done/total" with ListTree icon.
    It also shows ParentBadge (line 181).
    But clicking the row goes to TaskInlineEdit, which has no subtask tree.
    So the user can SEE that subtasks exist but cannot INTERACT with them from list view.
  implication: The list view teases subtask existence but provides no way to view or manage the subtask tree

## Resolution

root_cause: |
  List view uses a completely different editing pattern (inline via TaskInlineEdit) than calendar view (modal via TaskModal).
  TaskInlineEdit is a minimal wrapper around TaskForm that was never extended with the rich features that TaskModal accumulated:
  - SubtaskList (subtask tree display with drill-down navigation)
  - BreakdownButton (AI task breakdown trigger)
  - SubtaskReview (review/edit AI-generated subtasks)
  - useBreakdown hook (breakdown state machine)
  - Time estimate display/override
  - Subtask navigation (parent stack, breadcrumb)
  - ProviderSetupModal (AI provider configuration)

  The root architectural decision is in App.tsx:
  - Line 135-138: handleTaskClickCalendar opens TaskModal
  - Line 140-143: handleTaskClickList is a no-op (list view handles clicks internally)
  - Line 284-290: TaskModal is rendered but only triggered by calendar view

fix: N/A (research only)
verification: N/A
files_changed: []
