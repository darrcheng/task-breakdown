---
status: diagnosed
trigger: "After creating a task via inline create in list view, the category dropdown (CategoryCombobox) doesn't reset to its placeholder 'Select category' state. The previously selected category remains displayed."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: TaskInlineCreate.handleSubmit resets title state but never resets categoryId state back to 0, so CategoryCombobox keeps showing the previously selected category
test: Read handleSubmit to check if setCategoryId(0) is called after task creation
expecting: setCategoryId(0) is missing from the reset logic
next_action: Confirm by reading handleSubmit and tracing the value prop flow

## Symptoms

expected: After creating a task via inline create, the CategoryCombobox resets to placeholder "Select category..." state
actual: The previously selected category remains displayed in the combobox after task creation
errors: None (functional bug, not a crash)
reproduction: Open list view -> click inline create -> select a category -> type a title -> press Enter or click Add -> observe category combobox still shows previous selection
started: Unknown, likely since CategoryCombobox was introduced

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-02-23T00:01:00Z
  checked: TaskInlineCreate.tsx handleSubmit (lines 19-39)
  found: Line 36 calls setTitle('') to reset the title input, but there is NO corresponding setCategoryId(0) call to reset the category state
  implication: This is the root cause - categoryId state persists across submissions

- timestamp: 2026-02-23T00:02:00Z
  checked: CategoryCombobox props interface and value usage
  found: CategoryCombobox is fully controlled via value prop (line 31, 39-42, 179). When value is 0, selectedCategory resolves to undefined (line 40), which causes the input to show the placeholder "Select category..." (line 179 ternary). When value is non-zero, it shows the category name.
  implication: Simply calling setCategoryId(0) in handleSubmit would reset the combobox to placeholder state

## Resolution

root_cause: In TaskInlineCreate.tsx line 36, handleSubmit only resets the title state (setTitle('')) but does NOT reset categoryId back to 0 (setCategoryId(0) is missing). Since CategoryCombobox is a controlled component that derives its display from the value prop, the stale categoryId keeps the old selection visible.
fix: (research only - not applying)
verification: (research only)
files_changed: []
