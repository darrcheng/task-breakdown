---
status: diagnosed
trigger: "subtask celebration animation still doesn't work - subtask disappears on completion instead of showing emerald ring glow + fade"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: CSS specificity conflict — transition-colors overrides transition-all in Tailwind v4 output
test: Inspected generated CSS in dist/assets/index-BZdlsQDt.css
expecting: transition-colors appears after transition-all, overriding transition-property
next_action: Return structured diagnosis

## Symptoms

expected: Completing a subtask shows emerald ring glow for ~1.5s, then fades to opacity-0 with a smooth transition
actual: Subtask row disappears instantly on completion — no ring visible, no fade transition
errors: None (visual/behavioral issue, no JS errors)
reproduction: Open task modal with subtasks, click status circle on an in-progress subtask to mark done
started: Animation was broken before 03-08 fix and remains broken after it

## Eliminated

- hypothesis: Double-rAF pattern is missing or incorrectly implemented
  evidence: Code at SubtaskList.tsx lines 106-121 has correct double-rAF — requestAnimationFrame(() => requestAnimationFrame(() => setDepartingPhase('fade'))). Confirmed via git show b96a6e7 that the fix was applied and no subsequent commits modified SubtaskList.tsx.
  timestamp: 2026-02-23

- hypothesis: setDepartingPhase(null) fires after db.tasks.update causing Dexie race
  evidence: Code at SubtaskList.tsx lines 174-183 correctly calls setDepartingPhase(null) BEFORE db.tasks.update. The 03-08 fix reordered these. Confirmed via git diff.
  timestamp: 2026-02-23

- hypothesis: useSubtasks hook filters out done subtasks causing component unmount
  evidence: hooks.ts lines 83-91 — useSubtasks queries by parentId only, no status filter. Done subtasks remain in the list. Component stays mounted.
  timestamp: 2026-02-23

- hypothesis: Parent SubtaskList re-render caused by Dexie liveQuery remounts SubtaskRow
  evidence: SubtaskRow uses key={subtask.id} which is stable. React preserves component identity and state when key is unchanged. The departingPhase state survives parent re-renders.
  timestamp: 2026-02-23

- hypothesis: Later commits broke the fix
  evidence: git log b96a6e7..HEAD -- src/components/task/SubtaskList.tsx shows zero commits. File is untouched since the 03-08 fix.
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: SubtaskList.tsx lines 195-200 — clsx class composition
  found: |
    Base class: 'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 transition-colors group'
    Ring phase: 'ring-2 ring-emerald-400 ring-offset-1 transition-all duration-[1500ms]'
    Fade phase: 'ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]'

    When departingPhase is 'ring' or 'fade', BOTH transition-colors (from base) and
    transition-all (from phase) are present on the same element simultaneously.
  implication: CSS specificity conflict between transition-colors and transition-all.

- timestamp: 2026-02-23
  checked: Built CSS output dist/assets/index-BZdlsQDt.css — rule ordering
  found: |
    Line 372: .transition-all { transition-property: all; ... }
    Line 373: .transition-colors { transition-property: color, background-color, border-color,
              outline-color, text-decoration-color, fill, stroke, gradient vars; ... }

    transition-colors appears AFTER transition-all in the Tailwind v4 generated stylesheet.
    Both are single-class selectors (equal specificity).
    CSS cascade rule: when specificity is equal, the later rule wins.

    Therefore: transition-colors OVERRIDES transition-all's transition-property.
  implication: opacity is NOT in the transition-colors property list, so opacity changes are instant.

- timestamp: 2026-02-23
  checked: Tailwind v4.2.0 CSS output for transition-colors property list
  found: |
    .transition-colors defines transition-property as:
      color, background-color, border-color, outline-color, text-decoration-color,
      fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to

    Missing from this list: opacity, box-shadow (used by ring), transform
    The duration-[1500ms] sets transition-duration to 1.5s correctly, but since the
    transition-property excludes opacity, the duration is irrelevant for the fade.
  implication: opacity-0 applies instantly. Ring box-shadow also has no transition. The element vanishes in one frame.

- timestamp: 2026-02-23
  checked: TaskListItem.tsx lines 124-132 — same pattern
  found: |
    TaskListItem has identical CSS conflict:
      Base: 'transition-colors' (line 125)
      Ring: 'transition-all duration-[1500ms]' (line 130)
      Fade: 'opacity-0 transition-all duration-[1500ms]' (line 131)
    Same override problem. TaskListItem animation is also broken for the same reason.
  implication: Both SubtaskRow and TaskListItem are affected by the same root cause.

## Resolution

root_cause: |
  CSS SPECIFICITY CONFLICT IN TAILWIND V4

  Both SubtaskRow (SubtaskList.tsx) and TaskListItem (TaskListItem.tsx) have an
  always-present base class `transition-colors` and conditionally-added `transition-all`
  for the ring/fade animation phases. In Tailwind v4.2.0's generated CSS output,
  `.transition-colors` appears AFTER `.transition-all` (line 373 vs 372). Since both
  are single-class selectors with equal specificity, the later rule wins per CSS cascade.

  Result: `transition-property` is set to the `transition-colors` subset (color,
  background-color, border-color, etc.) which does NOT include `opacity` or `box-shadow`.
  When `opacity-0` is added in the fade phase, the opacity change happens INSTANTLY
  because opacity is not in the active transition-property list. The ring (rendered via
  box-shadow) also has no transition.

  The double-rAF pattern and Dexie race fix from 03-08 are both correctly implemented.
  They are not the problem. The animation infrastructure works correctly — it's the CSS
  transition-property that prevents the visual transition from playing.

  The 03-08 fix addressed the JavaScript timing issues (single-rAF coalescing, Dexie
  race condition) but did not address the CSS specificity conflict that was ALSO
  preventing the animation from working. The CSS conflict was the original cause all along,
  masked by the JS timing issues.

fix: Not applied (research only mode)
verification: N/A
files_changed: []
