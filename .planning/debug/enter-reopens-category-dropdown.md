---
status: investigating
trigger: "Enter after selecting category reopens dropdown instead of submitting form"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: After Enter selects a category in CategoryCombobox, focus stays on the combobox input. The next Enter keypress is handled by CategoryCombobox.handleKeyDown which, when isOpen=false, explicitly opens the dropdown (line 113-114) instead of letting the event propagate to the form.
test: Trace the code path for Enter after selection
expecting: CategoryCombobox intercepts Enter before it can reach TaskInlineCreate or form submit
next_action: Confirm by reading both handleKeyDown handlers

## Symptoms

expected: After selecting a category with Enter, pressing Enter again should submit the inline create form
actual: Pressing Enter after category selection reopens the category dropdown
errors: none
reproduction: List view > inline create > type in category combobox > arrow-down to select > Enter to confirm > Enter again
started: unclear, likely since CategoryCombobox was implemented

## Eliminated

## Evidence

- timestamp: 2026-02-23T00:01:00Z
  checked: CategoryCombobox.handleKeyDown (line 111-145)
  found: When isOpen is false, Enter key explicitly sets isOpen(true) and calls e.preventDefault() (lines 112-117). This means after a selection closes the dropdown, the very next Enter reopens it.
  implication: The combobox traps all Enter keypresses when it has focus, whether open or closed.

- timestamp: 2026-02-23T00:02:00Z
  checked: CategoryCombobox.handleSelect (line 74-80)
  found: handleSelect calls setIsOpen(false) but does NOT move focus away from the combobox input. Focus remains on the combobox input element.
  implication: After selection, focus stays in the combobox, so subsequent Enter goes to combobox's handleKeyDown.

- timestamp: 2026-02-23T00:03:00Z
  checked: TaskInlineCreate.handleKeyDown (line 41-53)
  found: This handler is only attached to the title input (line 63), NOT to the form or the combobox. It cannot intercept Enter events from the combobox.
  implication: Even if the combobox didn't preventDefault, the form-level submit via handleKeyDown would not fire from the combobox.

- timestamp: 2026-02-23T00:04:00Z
  checked: Form submit button (line 70-75)
  found: Submit button is type="submit" which is correct, but native form Enter-to-submit requires focus on a form element that doesn't intercept it. The combobox input intercepts Enter.
  implication: Native form submission via Enter is blocked by combobox's explicit handling.

## Resolution

root_cause: Two interacting problems cause this bug:

1. PRIMARY - CategoryCombobox.handleKeyDown (line 112-117) explicitly reopens the dropdown on Enter when isOpen=false. After a user selects a category (which closes the dropdown via handleSelect), focus remains on the combobox input. The next Enter keypress hits this "reopen" branch, calling e.preventDefault() and setIsOpen(true), which reopens the dropdown instead of allowing form submission.

2. SECONDARY - Focus is never moved after category selection. handleSelect (line 74-80) closes the dropdown and clears search but does not shift focus back to the title input or any other form element. Even if the Enter-reopens-dropdown issue were fixed, the user would still need to manually click/tab to the title input to submit via the existing handleKeyDown on the title input.

fix:
verification:
files_changed: []
