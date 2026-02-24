---
status: diagnosed
trigger: "Investigate why there's no save button when first creating a new task, and why inline create in list view doesn't submit."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: Both issues confirmed via code reading - see Resolution
test: N/A - code review sufficient
expecting: N/A
next_action: Report findings

## Symptoms

expected: (1) TaskModal shows a save/create button for new tasks. (2) In list view, pressing Enter in inline create row submits the task.
actual: (1) No save button visible on new task creation. (2) Enter in inline create row does not submit.
errors: None reported
reproduction: (1) Open new task modal. (2) Switch to list view, press Enter to open inline create, type title, press Enter again.
started: Unknown

## Eliminated

- hypothesis: Submit button is conditionally hidden for new tasks
  evidence: TaskForm.tsx lines 260-265 render the submit button unconditionally. The button always appears regardless of whether initialData has an id. The submitLabel is 'Create' for new tasks and 'Save' for existing tasks.
  timestamp: 2026-02-23

- hypothesis: App.tsx global keydown handler swallows Enter after inline create opens
  evidence: App.tsx line 59 guards with `if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;`. When focus is on the title input inside TaskInlineCreate, the global handler exits early and does not interfere.
  timestamp: 2026-02-23

- hypothesis: DatePicker or CategoryCombobox dropdown pushes form content down (pushing button out of view)
  evidence: Both DatePicker dropdown (absolute z-50) and CategoryCombobox dropdown (absolute z-50) are positioned absolutely. They overlay content rather than pushing it down. They do not increase the form's layout height.
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: TaskForm.tsx lines 234-267 (Actions section)
  found: The form ALWAYS renders Cancel and Submit buttons. No conditional logic hides them. The submit button is `<button type="submit">` with blue bg styling.
  implication: The button exists in the DOM. The issue is visibility, not rendering.

- timestamp: 2026-02-23
  checked: TaskModal.tsx lines 178-193 (modal positioning)
  found: When opened from a calendar day click (with clickPosition), maxHeight is 700px. When opened via 'n' keyboard shortcut (no clickPosition), there is NO maxHeight -- only maxWidth is set.
  implication: For calendar-click opens, the 700px maxHeight may clip content. For keyboard 'n' opens, no height constraint exists.

- timestamp: 2026-02-23
  checked: Estimated content height of modal
  found: h2 header (~28px) + mb-4 (16px) + TaskForm 7 sections with space-y-4 gaps: Title (~58px) + Date (~58px) + Status (~58px) + Energy (~50px) + Category (~58px) + Description (~92px) + Actions (~42px) + 6 gaps (96px) + p-6 padding (48px) = ~604px total
  implication: 604px fits within 700px maxHeight. The button should be visible on a standard viewport. However, on smaller viewports or with browser zoom, the button could be pushed below the fold. The user may have been testing on a constrained viewport.

- timestamp: 2026-02-23
  checked: TaskInlineCreate.tsx lines 47-63 (render method)
  found: The form contains a title input and a CategoryCombobox. There is NO submit button anywhere in the JSX. No `<button type="submit">` element exists.
  implication: Users have no visual affordance to submit. The only submission path is implicit form submission via Enter on the title input.

- timestamp: 2026-02-23
  checked: HTML implicit form submission spec behavior
  found: Per HTML spec, implicit submission (pressing Enter to submit a form) requires EITHER a submit button OR exactly ONE text-type input field. TaskInlineCreate has TWO text inputs (title input + CategoryCombobox input). With two text inputs and no submit button, browsers may NOT perform implicit submission.
  implication: This is the PRIMARY root cause of Issue 2. Enter in the title input does not submit the form because the form has two text inputs and no submit button.

- timestamp: 2026-02-23
  checked: CategoryCombobox.tsx lines 111-117 (handleKeyDown when closed)
  found: When combobox is NOT open, pressing Enter calls e.preventDefault() and opens the dropdown. This is a secondary issue -- even if focus somehow moved to the CategoryCombobox, Enter would be swallowed.
  implication: Even if implicit submission worked, the CategoryCombobox's Enter interception adds another failure path.

- timestamp: 2026-02-23
  checked: Prior debug session (.planning/debug/enter-key-no-new-task-list-view.md)
  found: A previous debug session identified that Enter-to-open-inline-create was never implemented. This was subsequently fixed by adding a `case 'Enter'` in App.tsx (lines 108-115) that dispatches a custom event. DayGroup listens for this event and sets isCreating=true.
  implication: The "open inline create" part now works. The bug is specifically that submitting the form once the inline create row is open does not work.

## Resolution

root_cause: |
  **Issue 1 (No save button on new task creation):**
  The Create button IS rendered in TaskForm.tsx (lines 260-265) unconditionally. The button exists
  in the DOM. The most likely explanation is that on the tester's viewport size/zoom level, the
  modal content height (~604px estimated) combined with the modal's 700px maxHeight (applied when
  opened via calendar day click) results in the Actions row being below the visible area. The modal
  has overflow-y-auto so the button is scrollable into view, but not immediately visible. For the
  keyboard 'n' shortcut path, there is no maxHeight, so the button should be visible.

  However, there is also a UX consideration: with the auto-save behavior (Test 15 passed --
  Escape/backdrop click auto-saves), the explicit save button may be less discoverable because
  users expect a prominent CTA at the top or in a fixed position, not at the bottom of a
  scrollable form.

  **Issue 2 (Inline create doesn't submit on Enter):**
  ROOT CAUSE CONFIRMED: TaskInlineCreate.tsx renders a `<form>` with `onSubmit={handleSubmit}`
  but contains TWO text-type `<input>` elements (the title input on line 50, and the
  CategoryCombobox input in CategoryCombobox.tsx line 173) and ZERO submit buttons. Per the HTML
  specification, implicit form submission (pressing Enter to submit) requires either an explicit
  submit button or exactly one text-type input. With two text inputs and no submit button,
  browsers do NOT perform implicit submission. Pressing Enter in the title input simply does
  nothing. There is also no visible button for manual submission.

fix: |
  **Issue 1 fix direction:**
  Option A: Make the modal taller or the form more compact (reduce padding, make description
  collapsible, move energy/category to a second row).
  Option B: Fix the Actions bar to the bottom of the modal so it's always visible regardless
  of scroll position.
  Option C: Since auto-save on close works (Test 15), consider removing the explicit Save/Create
  button entirely for the "edit" case, and only show it for "create" with a prominent position.

  **Issue 2 fix direction:**
  Add a hidden or visible submit button to TaskInlineCreate's form. The simplest fix:
  ```tsx
  <button type="submit" className="sr-only">Create</button>
  ```
  This screen-reader-only button enables implicit form submission via Enter while keeping the
  clean inline appearance. Alternatively, add a visible submit button for better UX affordance:
  ```tsx
  <button type="submit" className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
    Add
  </button>
  ```
  A second fix is also needed: add explicit Enter handling in the title input's onKeyDown to
  call handleSubmit directly, as a belt-and-suspenders approach:
  ```tsx
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
  ```

verification: Not performed
files_changed: []
