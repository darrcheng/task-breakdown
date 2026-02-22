---
status: resolved
trigger: "Investigate the category combobox - add clear/reset button to deselect a category"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: Component lacks a clear/reset mechanism; once a category is selected there is no UI affordance to deselect it
test: Read component structure and trace value flow
expecting: Confirm no clear button exists and identify exact insertion point
next_action: Return diagnosis with specific fix

## Symptoms

expected: User can clear a selected category (set back to "no category" / id=0)
actual: Once a category is selected, the only way to change it is to pick a different category; there is no way to deselect entirely
errors: none (feature gap, not a runtime error)
reproduction: Open task modal, select a category, observe no X/clear button
started: Always been this way - feature was never implemented

## Eliminated

(none - straightforward feature gap)

## Evidence

- timestamp: 2026-02-22
  checked: CategoryCombobox.tsx full source (238 lines)
  found: Component accepts value:number and onChange:(id:number)=>void. No clear/reset button exists anywhere. When !isOpen && selectedCategory is truthy, an icon is rendered at left (line 149-154) and the input shows selectedCategory.name (line 161). The input has left padding pl-8 when a category is selected (line 172). There is no button or clickable element to clear the selection.
  implication: Need to add a clear button that calls onChange(0) and appears only when a category is selected and the dropdown is closed.

- timestamp: 2026-02-22
  checked: TaskForm.tsx line 145
  found: Parent passes categoryId and setCategoryId. Calling onChange(0) would set categoryId=0, which is the "no category" state.
  implication: The clear mechanism is simply onChange(0). No parent changes needed.

- timestamp: 2026-02-22
  checked: lucide-react imports in CategoryCombobox
  found: Only `Plus` is imported. Need to add `X` import for the clear button icon.
  implication: Minor import change needed.

## Resolution

root_cause: The CategoryCombobox component has no UI element to clear/deselect a chosen category. Once selected, there is no way to return to the empty "Select category..." state.

fix: Add a small X button that appears when a category is selected and the dropdown is closed. The button calls onChange(0) to reset to "no category". See specific code changes below.

verification: Visual check - select a category, confirm X appears, click X, confirm field resets to placeholder.

files_changed:
- src/components/task/CategoryCombobox.tsx
