---
status: resolved
trigger: "Inline task creation form - category selector too small, task title too large"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: Title input uses flex-1 (greedy), category select uses max-w-[140px] (hard cap) - proportions are wrong
test: Read the Tailwind classes on both elements
expecting: Confirm flex-1 vs fixed-width mismatch
next_action: Return diagnosis

## Symptoms

expected: Category selector and task title field should be proportionally balanced in the inline create form
actual: Category field is too small (hard-capped at 140px), title field is too large (takes all remaining space via flex-1)
errors: None - visual/UX issue only
reproduction: Open list view, click to add inline task, observe field proportions
started: Since initial implementation

## Eliminated

(none needed - root cause found on first inspection)

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: TaskInlineCreate.tsx lines 56-77, the flex container and its children
  found: |
    Container: `<div className="flex gap-2">` (line 56)
    Title input: `className="flex-1 px-3 py-2 ..."` (line 64) - flex-1 means flex:1 1 0%, takes ALL remaining space
    Category select: `className="px-2 py-2 ... max-w-[140px]"` (line 69) - hard-capped at 140px maximum width
  implication: |
    The title input greedily absorbs all available space (flex-1 = grow:1, shrink:1, basis:0%).
    The category select has NO flex-grow and is hard-limited to 140px.
    On wider screens the imbalance becomes more pronounced - title grows infinitely, category stays at 140px.

## Resolution

root_cause: |
  Two compounding issues in the flex layout (line 56-77):
  1. Title input uses `flex-1` (line 64) which gives it flex:1 1 0% - it greedily takes ALL remaining space
  2. Category select uses `max-w-[140px]` (line 69) which hard-caps it at 140px with no flex-grow

  The result: on any reasonable screen width, the title field dominates the row while the category
  selector is squeezed into a tiny 140px box that can truncate longer category names.

fix: (not applied - diagnosis only)
verification: (not applicable)
files_changed: []
