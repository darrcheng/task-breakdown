---
phase: 06-mobile-someday-navigation
plan: 01
subsystem: ui
tags: [react, mobile, bottom-tab-bar, someday-view, lucide-react]

# Dependency graph
requires:
  - phase: 04-cross-platform
    provides: BottomTabBar, MobileLayout, MobileTab type, handleMobileTabChange
  - phase: 03-adhd-optimized-ux
    provides: SomedayView component with rescue/delete actions
provides:
  - Mobile navigation path to SomedayView via 4th tab in BottomTabBar
  - Mobile-optimized SomedayView padding and touch targets
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MobileTab type extension pattern: add to union + TABS array + handler/derivation"

key-files:
  created: []
  modified:
    - src/components/mobile/BottomTabBar.tsx
    - src/App.tsx
    - src/components/overdue/SomedayView.tsx

key-decisions:
  - "Kept existing handleMobileTabChange else branch — 'someday' cast to ViewMode works without explicit case"
  - "Used px-4 sm:px-6 responsive padding instead of flat px-4 to preserve desktop appearance"
  - "Increased touch targets from p-1.5 to p-2.5 for mobile usability (~36px tap area)"

patterns-established:
  - "4-tab BottomTabBar: Calendar | List | Someday | Settings"

requirements-completed: [PLAT-02, ADHD-04]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 06: Mobile Someday Navigation Summary

**Someday tab added to BottomTabBar with Archive icon, activeMobileTab derivation fixed, SomedayView padding and touch targets optimized for mobile**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01
- **Completed:** 2026-03-01
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- BottomTabBar now shows 4 evenly-spaced tabs: Calendar, List, Someday, Settings
- Tapping Someday tab switches viewMode to 'someday' and shows SomedayView with correct tab highlight
- SomedayView uses tighter mobile padding (px-4) and larger touch targets (p-2.5) for action buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Someday tab to BottomTabBar and wire App.tsx navigation** - `10ee28e` (feat)
2. **Task 2: Adjust SomedayView padding for mobile** - `6dd6677` (feat)

## Files Created/Modified
- `src/components/mobile/BottomTabBar.tsx` - Extended MobileTab type, added Someday tab with Archive icon
- `src/App.tsx` - Fixed activeMobileTab derivation to map 'someday' viewMode to 'someday' tab
- `src/components/overdue/SomedayView.tsx` - Responsive padding px-4 sm:px-6, enlarged touch targets p-2.5

## Decisions Made
- Kept existing `else { setViewMode(tab as ViewMode) }` pattern in handleMobileTabChange since 'someday' is already a valid ViewMode — explicit case unnecessary
- Used responsive padding (px-4 sm:px-6) rather than flat px-4 to preserve desktop spacing
- max-w-2xl kept as-is since it has no visible effect on mobile screens (< 672px)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Mobile SomedayView is fully navigable via BottomTabBar
- Phase 7 (Secondary Path Polish + Cleanup) can proceed independently

---
*Phase: 06-mobile-someday-navigation*
*Completed: 2026-03-01*
