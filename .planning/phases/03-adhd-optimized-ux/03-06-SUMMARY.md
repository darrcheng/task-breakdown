---
phase: 03-adhd-optimized-ux
plan: 06
subsystem: task-completion-animation, ai-breakdown, keyboard-shortcuts
tags: [bug-fix, animation, css-race, ai-provider, keyboard, subtasks]
dependency_graph:
  requires: []
  provides: [working-celebration-animation, functional-ai-breakdown, enter-key-inline-create]
  affects: [SubtaskList, TaskListItem, hooks/useBreakdown, App, DayGroup]
tech_stack:
  added: []
  patterns: [two-frame-rAF-animation, direct-provider-check, custom-event-dispatch]
key_files:
  created: []
  modified:
    - src/components/task/SubtaskList.tsx
    - src/components/list/TaskListItem.tsx
    - src/db/hooks.ts
    - src/hooks/useBreakdown.ts
    - src/App.tsx
    - src/components/list/DayGroup.tsx
decisions:
  - "Two-frame rAF animation: departingPhase ('ring'|'fade'|null) splits CSS transition into ring-first then opacity-0 so browser paints from opacity-1 to opacity-0"
  - "getProvider() direct check replaces stale isConfigured guard - async provider load bypasses React state init delay"
  - "Custom DOM event 'taskbreaker:inline-create' decouples App keyboard handler from DayGroup inline create"
  - "setDepartingPhase(null) after DB write ensures tasks reappear when showCompleted=true"
metrics:
  duration: 3 minutes
  completed_date: 2026-02-23
  tasks_completed: 2
  files_modified: 6
---

# Phase 03 Plan 06: Fix UAT Bugs - Celebration Animation, AI Breakdown, Enter Key Summary

Two-frame requestAnimationFrame departure animation on SubtaskRow and TaskListItem, direct getProvider() check in useBreakdown bypassing stale isConfigured, and Enter key in list view dispatching custom event to open inline task create.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix celebration animation CSS race and subtask data leak | 6cf4e30 | SubtaskList.tsx, TaskListItem.tsx, hooks.ts |
| 2 | Fix AI breakdown regression and add Enter key for list view | fb41ec3 | useBreakdown.ts, App.tsx, DayGroup.tsx |

## What Was Built

### Task 1: Celebration Animation CSS Race + Subtask Data Leak

**Problem:** The CSS transition race happened because `opacity-0` and `transition-all` were applied in the same paint frame. The browser never saw a transition from opacity-1 to opacity-0 - both states arrived simultaneously.

**Fix - Two-frame departure animation:**
- Replaced `departing: boolean` state with `departingPhase: 'ring' | 'fade' | null`
- `departing` is derived as `departingPhase !== null` so cancel logic still works
- Frame 1: Sets `departingPhase = 'ring'` - applies ring/glow classes without opacity-0
- Frame 2: `useEffect` watching `departingPhase === 'ring'` calls `requestAnimationFrame(() => setDepartingPhase('fade'))` - adds opacity-0 in the next paint frame
- Browser now transitions from the painted ring state (opacity-1) to opacity-0
- After DB write completes (1500ms timeout), `setDepartingPhase(null)` resets state so tasks reappear when `showCompleted=true`

Applied identically to both `SubtaskRow` (SubtaskList.tsx) and `TaskListItem` (TaskListItem.tsx).

**Subtask data leak fix:**
- Added `!t.parentId` filter to all 4 filter predicates in `useTasksByDate` and `useTasksByDateRange`
- Prevents subtasks from appearing as orphan rows in list view
- Both `showCompleted=true` and `showCompleted=false` branches updated in both hooks

### Task 2: AI Breakdown Regression + Enter Key

**Problem:** `isConfigured` is derived from `useAIProvider` React state that initializes as `false`. On page load, there's a window where the state is `false` even though localStorage has a valid provider configured. Clicking "Break it down" before the async `useEffect` fires hits the `!isConfigured` guard and shows the setup modal erroneously.

**Fix:**
- `startBreakdown` now calls `const provider = await getProvider()` directly
- `getProvider()` reads from `state.provider` which loads from localStorage via `useEffect`, but since `getProvider` is a `useCallback` closing over state, it's always current at call time
- If `provider` is null (truly not configured), shows configuring modal
- If provider is available, proceeds immediately to generation with the already-fetched provider instance
- Removed `isConfigured` from destructuring and deps array

**Enter key inline create:**
- `App.tsx` global keyboard handler: new `case 'Enter'` fires only when `viewMode === 'list'`
- Dispatches `window.dispatchEvent(new CustomEvent('taskbreaker:inline-create', { detail: { date: formatDateKey(new Date()) } }))`
- `DayGroup.tsx`: `useEffect` listens for `taskbreaker:inline-create` and calls `setIsCreating(true)` when `detail.date === date`
- Pattern decouples App from DayGroup - no prop threading needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `isConfigured` import after startBreakdown refactor**
- **Found during:** Task 2 build verification
- **Issue:** TypeScript TS6133 error: 'isConfigured' is declared but its value is never read
- **Fix:** Removed `isConfigured` from destructuring in `const { getProvider, configureProvider } = useAIProvider()`
- **Files modified:** src/hooks/useBreakdown.ts
- **Commit:** fb41ec3 (included in task commit)

## Verification

- `npx tsc --noEmit`: 0 errors
- `npm run build`: Succeeded (3.19s, 817.71 kB bundle)
- SubtaskRow uses `departingPhase` with rAF for two-frame animation - verified in code
- TaskListItem uses same `departingPhase` pattern - verified in code
- hooks.ts: both `useTasksByDate` and `useTasksByDateRange` filter `!t.parentId` in all 4 predicates
- useBreakdown.ts: `startBreakdown` uses `getProvider()` directly, no `isConfigured` reference
- App.tsx: `case 'Enter'` dispatches custom event for list view
- DayGroup.tsx: `useEffect` listens for `taskbreaker:inline-create` event

## Self-Check: PASSED

Files verified:
- FOUND: src/components/task/SubtaskList.tsx (contains `requestAnimationFrame`)
- FOUND: src/components/list/TaskListItem.tsx (contains `requestAnimationFrame`)
- FOUND: src/db/hooks.ts (contains `!t.parentId`)
- FOUND: src/hooks/useBreakdown.ts (contains `getProvider()` replacing isConfigured guard)
- FOUND: src/App.tsx (contains `case 'Enter'`)
- FOUND: src/components/list/DayGroup.tsx (contains `taskbreaker:inline-create`)

Commits verified:
- 6cf4e30: fix(03-06): two-frame departure animation and subtask data leak
- fb41ec3: fix(03-06): AI breakdown regression and Enter key list view inline create
