---
status: resolved
trigger: "Category combobox: not empty by default, icon missing when selected"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: Two separate root causes - TaskForm auto-selects first category; CategoryCombobox input is plain text with no icon slot
test: Code analysis of both files
expecting: Confirm no placeholder state and no icon rendering in input
next_action: Return structured findings

## Symptoms

expected: (1) Combobox starts empty with placeholder. (2) Selected category shows its icon in the input.
actual: (1) First category is auto-selected on mount. (2) Only category name text shown, no icon.
errors: None (visual/UX issues)
reproduction: Open task form, observe combobox default and selected states
started: Since implementation

## Eliminated

(none needed - root causes found on first pass)

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskForm.tsx lines 38-39 and 49-53
  found: categoryId initialized to 0, then useEffect auto-sets it to categories[0].id when categories load
  implication: User never sees empty/placeholder state; first category is forced

- timestamp: 2026-02-22T00:00:00Z
  checked: CategoryCombobox.tsx lines 149-165 (input element)
  found: Input is a plain <input type="text"> displaying selectedCategory?.name. No icon rendered alongside the text.
  implication: Even when a category is selected, only its name is shown as text. No IconComponent rendered in the closed/display state.

- timestamp: 2026-02-22T00:00:00Z
  checked: CategoryCombobox.tsx lines 173-196 (dropdown options)
  found: Each dropdown option correctly renders <IconComponent> next to the name
  implication: Icon rendering logic exists for dropdown items but was never added to the input display state

## Resolution

root_cause: See structured findings below
fix: Not yet applied
verification: N/A
files_changed: []
