---
phase: 02-ai-task-breakdown
plan: 07
subsystem: ui
tags: [react, hooks, useAIProvider, useBreakdown, provider-setup]

# Dependency graph
requires:
  - phase: 02-ai-task-breakdown
    provides: useBreakdown hook and ProviderSetupModal component with dual useAIProvider instances (the bug)
provides:
  - Single useAIProvider instance shared through the chain via configureProvider prop
  - Fixed provider setup loop — clicking "Start Breaking Down Tasks" proceeds to generation
  - Stale closure eliminated in onProviderConfigured by bypassing isConfigured check
affects: [02-ai-task-breakdown, UAT, provider setup flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop-drilling configureProvider downward instead of duplicating hook calls — eliminates state sync issues between sibling instances"
    - "onProviderConfigured bypasses stale isConfigured by calling getProvider() directly and inlining generation logic"

key-files:
  created: []
  modified:
    - src/hooks/useBreakdown.ts
    - src/components/settings/ProviderSetupModal.tsx
    - src/components/task/TaskModal.tsx

key-decisions:
  - "Pass configureProvider as prop to ProviderSetupModal instead of letting it call useAIProvider() independently — eliminates the two-instance state desync"
  - "onProviderConfigured bypasses startBreakdown entirely (which read stale isConfigured from closure) — inlines generation logic using getProvider() directly"
  - "ProviderSetupModal manages its own isLoading/error state locally since it no longer has access to the hook's state"

patterns-established:
  - "Single hook instance pattern: when multiple components need shared state from a hook, instantiate once at the top and pass specific functions/values as props"

requirements-completed: [AI-07]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 02 Plan 07: Provider Setup Loop Fix Summary

**Single shared useAIProvider instance eliminates provider-setup-to-generation loop by passing configureProvider as a prop and bypassing stale isConfigured in onProviderConfigured**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-23T04:48:36Z
- **Completed:** 2026-02-23T04:50:01Z
- **Tasks:** 1 executed (1 auto-approved checkpoint)
- **Files modified:** 3

## Accomplishments
- Eliminated dual `useAIProvider()` instances that caused state desync between ProviderSetupModal and useBreakdown
- Fixed stale closure in `onProviderConfigured` — no longer calls `startBreakdown()` (which read stale `isConfigured`), instead inlines generation logic using `getProvider()` directly
- ProviderSetupModal now accepts `configureProvider` as a prop, eliminating its independent hook instance

## Task Commits

Each task was committed atomically:

1. **Task 1: Eliminate dual useAIProvider instances** - `ee5d54e` (fix)
2. **Task 2: Verify provider setup loop fix** - checkpoint:human-verify (auto-approved, auto_advance=true)

## Files Created/Modified
- `src/hooks/useBreakdown.ts` - Destructures and exposes `configureProvider` from `useAIProvider`; rewrites `onProviderConfigured` to bypass stale `isConfigured` check
- `src/components/settings/ProviderSetupModal.tsx` - Removed `useAIProvider` hook; accepts `configureProvider` as prop; manages local `isLoading`/`error` state
- `src/components/task/TaskModal.tsx` - Passes `breakdown.configureProvider` to `ProviderSetupModal`

## Decisions Made
- Pass `configureProvider` as a prop rather than letting ProviderSetupModal call `useAIProvider()` independently. Two independent hook instances do not share React state — the modal's instance saved the config but useBreakdown's instance never saw it.
- `onProviderConfigured` bypasses `startBreakdown()` entirely. The callback depended on `startBreakdown` in its closure, which captured a stale `isConfigured=false`. Inlining the generation logic using `getProvider()` reads current state from the now-updated provider.
- ProviderSetupModal manages `isLoading` and `error` as local `useState` since it no longer has the hook's state available. The `configureProvider` prop still returns `boolean` so the modal can branch on success/failure.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- UAT Test 3 (provider setup loop) fixed. Provider config persists without page refresh.
- Regression test: subsequent "Break it down" clicks on a configured provider skip the setup modal and go directly to generation.
- Settings modal AI Provider section continues to work independently (it uses its own `useAIProvider()` instance for display-only purposes, which is correct since it doesn't need to share state with TaskModal).

---
*Phase: 02-ai-task-breakdown*
*Completed: 2026-02-23*
