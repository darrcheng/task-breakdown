---
status: diagnosed
trigger: "Investigate the current task creation flow to understand what would need to change to remove explicit Save/Create buttons and auto-create tasks when a title is entered."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: Research complete -- auto-create is feasible but requires careful handling of two distinct flows (modal create vs modal edit) and one key design decision about when exactly to trigger creation
test: N/A - code analysis only
expecting: N/A
next_action: Report findings

## Symptoms

expected: Tasks should auto-create when a title is typed, without requiring an explicit Save/Create button click
actual: TaskForm renders explicit Cancel + Save/Create buttons (lines 252-266). User must click Create (or rely on auto-save-on-close) to persist a new task.
errors: None -- this is a UX investigation, not a bug
reproduction: Open new task modal -> fill in title -> observe that Save/Create button is required
started: Always been this way

## Eliminated

(none -- research-only investigation)

## Evidence

- timestamp: 2026-02-23
  checked: TaskForm.tsx full component (270 lines)
  found: |
    1. forwardRef pattern exposes `submit()` via useImperativeHandle (lines 87-93)
    2. Internal `handleSubmit` (lines 95-99) is the form's onSubmit handler
    3. Both paths check `!title.trim()` before calling `onSubmit` prop
    4. Actions div (lines 234-267) renders Cancel + Submit buttons unconditionally
    5. submitLabel prop defaults to 'Save', overridden to 'Create' for new tasks
    6. Form state: title, description, status, categoryId, date, energyLevel
    7. Title input auto-focuses on mount (lines 82-84)
  implication: The form is a standard controlled form. Submit is triggered by button click OR by the imperative ref.submit() call.

- timestamp: 2026-02-23
  checked: TaskModal.tsx full component (391 lines)
  found: |
    1. Auto-save on Escape (lines 72-90): calls formRef.current.submit(), falls back to onClose()
    2. Auto-save on backdrop click (lines 212-216): same pattern as Escape
    3. handleSubmit (lines 94-129) has two branches:
       - EDIT (currentTask.id exists): updates DB, triggers re-estimate if title changed, calls onClose()
       - CREATE (no currentTask.id): adds to DB, triggers estimate, then STAYS IN MODAL by
         setNavigationOverride(newTask) -- switches modal to edit mode for the new task
    4. Post-create behavior is a "stay in modal for editing" pattern -- user creates task,
       then can immediately use BreakdownButton, set subtasks, etc.
    5. formRef (useRef<TaskFormHandle>) is the bridge between modal close actions and form submission
  implication: Auto-save on close already works. The explicit Save/Create button is redundant for the EDIT case. For the CREATE case, it's the primary trigger for the post-create edit flow.

- timestamp: 2026-02-23
  checked: TaskInlineCreate.tsx (79 lines) -- the list-view create flow
  found: |
    1. Completely separate from TaskForm/TaskModal
    2. Has its own handleSubmit that writes directly to DB
    3. Already has Enter-to-submit via onKeyDown handler (lines 41-53)
    4. Has a visible "Add" button (lines 70-75)
    5. After submit, clears title and stays open for rapid entry
    6. Only captures title + categoryId (no description, status, energy, date picker)
  implication: TaskInlineCreate is already closer to "auto-create" UX. It's a separate component with a different flow. Changes to TaskForm/TaskModal would not affect it.

- timestamp: 2026-02-23
  checked: App.tsx modal state management
  found: |
    1. ModalState tracks isOpen, date, task?, clickPosition?
    2. handleDayClick opens modal with no task (create mode)
    3. handleTaskClickCalendar opens modal with task (edit mode)
    4. closeModal resets to { isOpen: false, date: '' }
  implication: Modal open/close is controlled by App.tsx. The create-vs-edit distinction is determined by whether `task` is present in ModalState.

## Resolution

root_cause: |
  This is not a bug but a UX design investigation. The explicit Save/Create buttons in
  TaskForm exist because:

  1. TaskForm is a shared component used for BOTH create and edit flows
  2. The Create button triggers the important post-create flow (stay in modal, switch to
     edit mode, show BreakdownButton)
  3. The Save button (edit mode) is redundant given auto-save on Escape/backdrop

  **What would need to change to remove the buttons and auto-create:**

  See detailed analysis below.

fix: |
  NOT APPLIED -- research only. See analysis below.

verification: N/A -- research only
files_changed: []
