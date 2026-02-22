---
status: resolved
trigger: "Investigate why the + glyph in the add-task button is still visually offset downwards in list view"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: The "+" text character has inherent font metric descender/ascender imbalance that `leading-none` alone cannot fix; an SVG icon would center perfectly.
test: Examine CSS classes and font rendering behavior
expecting: Confirming text glyph metrics are the root cause
next_action: Document root cause and fix recommendation

## Symptoms

expected: The + glyph in the add-task button should be vertically centered within the circle
actual: The + appears shifted downward despite `flex items-center justify-center` and `leading-none`
errors: None (visual issue only)
reproduction: Open list view, observe the + button in any day group header
started: Present since initial implementation; previous fix attempt added `leading-none` but did not resolve

## Eliminated

- hypothesis: Missing flexbox centering classes
  evidence: Button already has `flex items-center justify-center` (line 47)
  timestamp: 2026-02-22

- hypothesis: Line-height causing offset
  evidence: `leading-none` was added in previous fix attempt; does not resolve the issue because the problem is glyph metrics, not line-height
  timestamp: 2026-02-22

## Evidence

- timestamp: 2026-02-22
  checked: DayGroup.tsx line 45-51 button classes
  found: Classes are `flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-500 transition-colors text-lg font-medium leading-none`
  implication: All standard centering mechanisms are already applied

- timestamp: 2026-02-22
  checked: Whether project uses lucide-react and specifically the Plus icon
  found: lucide-react is a dependency (v0.575.0); `Plus` is already imported and used in CategoryCombobox.tsx and CategoryManager.tsx
  implication: Replacing the text glyph with `<Plus />` is trivial and consistent with existing codebase patterns

- timestamp: 2026-02-22
  checked: Font metrics of the "+" character
  found: The "+" text glyph in most fonts is designed for mathematical expressions, not as a standalone icon. Its bounding box includes space for ascenders/descenders of the typeface, and the glyph itself sits above the baseline in a way that does not correspond to the visual center of its bounding box. CSS centering aligns the text box, not the visible ink of the glyph.
  implication: No combination of CSS text properties will reliably pixel-center the + glyph across fonts and platforms. An SVG icon has an explicit viewBox and the strokes are centered by design.

## Resolution

root_cause: The "+" is a text character rendered inside a flex-centered container. CSS centering (`flex items-center justify-center`, `leading-none`) centers the **text line box**, not the visible glyph ink. The "+" character in system/web fonts has asymmetric vertical metrics -- its visual center does not coincide with the center of its line box. The ascender space above the glyph is larger than the descender space below it, causing the rendered "+" to appear shifted downward within the circle. This is a fundamental limitation of text glyph rendering that no combination of `leading-none`, `text-lg`, or `font-medium` can fully correct.
fix: Replace the text "+" with the Lucide `Plus` SVG icon component, which is already used elsewhere in the codebase. SVG icons have an explicit viewBox and their strokes are geometrically centered, eliminating font metric issues entirely.
verification: Visual inspection after replacement
files_changed:
  - src/components/list/DayGroup.tsx
