---
phase: 03-adhd-optimized-ux
plan: 12
subsystem: ui
tags: [react, keyboard, combobox, form-submission, inline-create]

# Dependency graph
requires:
  - phase: 03-adhd-optimized-ux
    provides: TaskInlineCreate with CategoryCombobox for rapid task entry
provides:
  - CategoryCombobox Enter key no longer reopens closed dropdown
  - Form-level Enter handler on TaskInlineCreate submits task after category selection
affects: [CategoryCombobox, TaskInlineCreate, keyboard-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns: [aria-expanded check to delegate Enter between combobox and form, form-level onKeyDown instead of input-level for cross-field keyboard handling]

key-files:
  created: []
  modified:
    - src/components/task/CategoryCombobox.tsx
    - src/components/task/TaskInlineCreate.tsx

key-decisions:
  - "CategoryCombobox !isOpen branch: only ArrowDown reopens dropdown — Enter propagates to form"
  - "Form-level onKeyDown on TaskInlineCreate catches Enter from any child input including CategoryCombobox"
  - "aria-expanded check in form handler delegates Enter to CategoryCombobox when dropdown is open (selecting), submits when closed"

patterns-established:
  - "Form-level keyboard handler pattern: attach onKeyDown to <form> not individual inputs for cross-field Enter handling"
  - "aria-expanded gate: check role=combobox + aria-expanded=true before intercepting Enter in parent handlers"

requirements-completed: [TASK-07]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 03 Plan 12: Enter Key Fix for Inline Create Summary

**Fixed Enter-after-category-selection bug: CategoryCombobox no longer intercepts Enter when closed, form-level handler now submits task correctly**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-23T00:00:00Z
- **Completed:** 2026-02-23T00:05:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Removed Enter from CategoryCombobox `!isOpen` reopen condition — only ArrowDown reopens the dropdown
- Moved `onKeyDown` handler from title input to `<form>` element in TaskInlineCreate
- Added aria-expanded guard so Enter in form handler correctly delegates to CategoryCombobox when dropdown is open (item selection), and submits form when dropdown is closed

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Enter key in CategoryCombobox and add form-level submit to TaskInlineCreate** - `04ffb75` (fix)

**Plan metadata:** (to be added)

## Files Created/Modified
- `src/components/task/CategoryCombobox.tsx` - Removed Enter from `!isOpen` branch; only ArrowDown now reopens the dropdown
- `src/components/task/TaskInlineCreate.tsx` - Moved `onKeyDown` to `<form>` element; updated handler type to `React.KeyboardEvent<HTMLFormElement>`; added aria-expanded check to delegate Enter to CategoryCombobox when open

## Decisions Made
- Enter removed from CategoryCombobox `!isOpen` branch: when dropdown is closed, Enter should not be intercepted — it propagates naturally to the form, which then calls `requestSubmit()`
- Form-level `onKeyDown` chosen over title-input-level: catches Enter from any focusable child including the category input
- `aria-expanded` attribute check (already set on the combobox input via `aria-expanded={isOpen}`) used as the delegation signal — no new state or props needed

## Deviations from Plan

None — plan executed exactly as written. The stale `tsc -b` cache from prior plans produced spurious errors on first build attempt; forcing `tsc -b --force` cleared them and the build succeeded cleanly.

## Issues Encountered

`npm run build` failed on first run with stale TypeScript build info cache errors pointing to pre-existing unused imports in TaskForm.tsx and TaskModal.tsx. Running `npx tsc -b --force` cleared the cache and subsequent `npm run build` succeeded with zero errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Enter-key inline create flow is fully functional: type title, tab to category, select with Enter, press Enter again to submit
- CategoryCombobox keyboard behavior: ArrowDown opens, Enter selects (when open), Enter propagates (when closed)
- Ready for remaining phase 03 gap closure plans

---
*Phase: 03-adhd-optimized-ux*
*Completed: 2026-02-23*
