---
phase: 12-sync-polish
plan: 01
subsystem: sync
tags: [firebase, state-machine, useSyncExternalStore, retry, react-hook]

requires:
  - phase: 10-sync-engine
    provides: sync.ts with Dexie hooks, startSync/stopSync, migration

provides:
  - SyncStatus type and observable state machine (synced/syncing/offline/error)
  - subscribeSyncStatus/getSyncStatusSnapshot for useSyncExternalStore
  - handleSyncError with 2x silent retry (2s, 4s delays)
  - retrySync to clear error state
  - setupOnlineListener for network status
  - useSyncStatus React hook

affects: [12-sync-polish plan 02 (sync indicator UI component)]

tech-stack:
  added: []
  patterns: [useSyncExternalStore for external state subscription, state machine with retry backoff]

key-files:
  created:
    - src/hooks/useSyncStatus.ts
    - src/hooks/useSyncStatus.test.ts
  modified:
    - src/firebase/sync.ts
    - src/firebase/sync.test.ts

key-decisions:
  - "useSyncExternalStore over useState/useEffect for sync status subscription (tear-safe, concurrent-mode ready)"
  - "Silent retry with exponential backoff (2s, 4s) before surfacing error to UI"
  - "3s fallback timeout for syncing->synced when no pending writes detected"

patterns-established:
  - "External state subscription: module exports subscribe+getSnapshot, hook wraps useSyncExternalStore"
  - "Retry backoff: 2x silent retries with increasing delays before error state"

requirements-completed: [DATA-03, DATA-04]

duration: 4min
completed: 2026-03-09
---

# Phase 12 Plan 01: Sync Status State Machine Summary

**Sync status state machine with 2x silent retry and useSyncStatus hook via useSyncExternalStore**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T14:36:15Z
- **Completed:** 2026-03-09T14:40:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Sync module now exposes observable status (synced/syncing/offline/error) via subscribe+getSnapshot pattern
- Failed outbound writes auto-retry 2x silently (2s, 4s) before surfacing error state
- Online/offline transitions immediately update sync status with 3s syncing->synced fallback
- useSyncStatus hook provides reactive sync status to React components without polling

## Task Commits

Each task was committed atomically (TDD: test then feat):

1. **Task 1: Sync status state machine (RED)** - `5e2b893` (test)
2. **Task 1: Sync status state machine (GREEN)** - `e49dd10` (feat)
3. **Task 2: useSyncStatus hook (RED)** - `0507603` (test)
4. **Task 2: useSyncStatus hook (GREEN)** - `2d2d6da` (feat)

## Files Created/Modified
- `src/firebase/sync.ts` - Added SyncStatus type, state machine, retry logic, online/offline listener, trackOutboundWrite
- `src/firebase/sync.test.ts` - Added 10 new tests for sync status state machine (30 total)
- `src/hooks/useSyncStatus.ts` - New React hook wrapping useSyncExternalStore
- `src/hooks/useSyncStatus.test.ts` - 3 tests for hook wiring verification

## Decisions Made
- Used useSyncExternalStore over useState/useEffect for sync status subscription (tear-safe, concurrent-mode ready)
- Silent retry with exponential backoff (2s, 4s) before surfacing error to UI
- 3s fallback timeout for syncing->synced transition when no pending writes are detected
- globalThis.window mock in tests for node environment compatibility with online/offline events

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Test environment is node (not jsdom), so window.addEventListener spies required globalThis.window mock instead of vi.spyOn(window, ...). Fixed inline during test writing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Sync status state machine ready for Plan 02 (sync indicator UI component)
- All exports (SyncStatus, subscribeSyncStatus, getSyncStatusSnapshot, retrySync) available for consumption
- useSyncStatus hook ready for use in any React component

## Self-Check: PASSED

All 4 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 12-sync-polish*
*Completed: 2026-03-09*
