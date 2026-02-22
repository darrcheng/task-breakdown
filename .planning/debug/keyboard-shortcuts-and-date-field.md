---
status: diagnosed
trigger: "Keyboard shortcuts need changes: rebind c/l/n, add date field to task modal"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: Two distinct issues - (1) TaskForm has no date field at all, (2) keyboard shortcuts need remapping
test: Code review of App.tsx keyboard handler and TaskForm.tsx
expecting: Confirm missing date picker and identify exact lines for shortcut rebinding
next_action: return diagnosis

## Symptoms

expected: |
  1. Task modal (from any source) should show a date field with calendar dropdown
  2. Keybindings: c = calendar view, l = list view, n = new task (defaults to today)
actual: |
  1. TaskForm has NO date field - only title, status, category, description
  2. Current keybindings: m = month view, w = week view, c = create task for today
  3. No 'l' (list view) or 'n' (new task) binding exists at all
errors: No runtime errors - this is a feature/UX gap
reproduction: Press 'c' to open task modal - no date field visible
started: Original implementation

## Eliminated

(none - diagnosis confirmed on first pass)

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: App.tsx lines 53-81 (keyboard handler switch statement)
  found: |
    Current bindings:
      j = next period, k = previous period, t = today
      m = month view (sets calendarView='month', viewMode='calendar')
      w = week view (sets calendarView='week', viewMode='calendar')
      c = create task for today (opens modal with today's date)
      ? = open settings
    Missing bindings: no 'l' for list view, no 'n' for new task
  implication: Need to remap m->removed, w->removed, c->calendar view, add l->list view, add n->new task

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskModal.tsx handleSubmit (lines 27-49)
  found: |
    On create: date is taken from the `date` prop (passed from App.tsx modalState.date)
    and hardcoded into db.tasks.add({...data, date, ...}).
    The `date` prop is NEVER passed down to TaskForm.
    TaskForm's onSubmit signature is {title, description, status, categoryId} - no date field.
  implication: Date is invisible to user. Cannot be changed from within the modal. Silently set behind the scenes.

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskForm.tsx (full file, 190 lines)
  found: |
    Form fields: title (input), status (button group), category (combobox), description (textarea)
    NO date field exists anywhere in the form.
    The onSubmit data type is {title, description, status, categoryId} - no date.
  implication: A date picker/calendar dropdown must be added to TaskForm from scratch.

- timestamp: 2026-02-22T00:00:00Z
  checked: Task type in types/index.ts
  found: Task has `date: string` field in 'YYYY-MM-DD' format
  implication: TaskForm needs a date state field that gets included in onSubmit

## Resolution

root_cause: |
  Two issues confirmed:
  1. DATE FIELD MISSING: TaskForm.tsx has no date input. The date is silently injected by
     TaskModal.tsx from its `date` prop (set by App.tsx). Users cannot see or change the date.
  2. WRONG KEYBINDINGS: App.tsx keyboard handler maps m=month, w=week, c=create.
     Required mapping is c=calendar, l=list, n=new task.
fix: (not applied - diagnosis only)
verification: (not applied)
files_changed: []
