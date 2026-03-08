---
phase: 10-sync-engine
plan: 01
subsystem: sync
tags: [vitest, firestore, persistence, serialization, offline]

# Dependency graph
requires:
  - phase: 08-firebase-setup
    provides: Firebase config with getFirestore
  - phase: 09-auth
    provides: Auth flow with sign-in/sign-out
provides:
  - Vitest test infrastructure for all sync tests
  - Firestore persistent local cache with multi-tab manager
  - Sync module contracts (startSync, stopSync, migrateLocalData)
  - Serialization/deserialization helpers for Dexie-Firestore roundtrip
  - SYNC-03 guard test (hooks.ts has no firebase imports)
affects: [10-02-sync-listeners, 10-03-migration, 10-04-integration]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns: [serialize/deserialize for Dexie-Firestore, echo guard flag, sync state getters]

key-files:
  created:
    - vitest.config.ts
    - src/firebase/sync.ts
    - src/firebase/sync.test.ts
    - src/db/hooks.test.ts
  modified:
    - src/firebase/config.ts
    - package.json

key-decisions:
  - "Added getCurrentUid getter to avoid TS6133 unused variable error on currentUid stub"
  - "All aiSettings records safe to sync (API keys stored in WebCrypto/localStorage, not Dexie)"

patterns-established:
  - "serializeForFirestore removes id, deserializeFromFirestore restores id from docId"
  - "Module-level flags (syncEnabled, syncWriteInProgress) for echo guard and lifecycle control"
  - "SYNC-03 guard: snapshot test reads hooks.ts file content to assert no firebase imports"

requirements-completed: [SYNC-03, SYNC-05]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 10 Plan 01: Test Infrastructure & Sync Contracts Summary

**Vitest test infra, Firestore persistentLocalCache for offline writes, and sync module with serialize/deserialize helpers and lifecycle stubs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T17:52:21Z
- **Completed:** 2026-03-08T17:56:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Vitest installed and configured with 8 passing tests and 4 todo placeholders for Plan 02/03
- Firestore config upgraded from getFirestore to initializeFirestore with persistentLocalCache + persistentMultipleTabManager (offline write buffering ready)
- Sync module exports startSync/stopSync/migrateLocalData stubs plus working serializeForFirestore and deserializeFromFirestore helpers
- SYNC-03 guard test confirms hooks.ts has zero firebase imports (Dexie remains sole UI read source)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install vitest and create test infrastructure** - `c324549` (feat)
2. **Task 2: Update Firestore config and create sync module contracts** - `aa240e9` (feat)

## Files Created/Modified
- `vitest.config.ts` - Vitest config targeting src/**/*.test.ts with node environment
- `src/firebase/sync.ts` - Sync module with lifecycle stubs, state flags, and serialization helpers
- `src/firebase/sync.test.ts` - 8 passing serialization tests + 4 todo placeholders
- `src/db/hooks.test.ts` - SYNC-03 guard: asserts hooks.ts has no firebase/firestore imports
- `src/firebase/config.ts` - Upgraded to initializeFirestore with persistent cache
- `package.json` - Added vitest devDependency

## Decisions Made
- Added `getCurrentUid()` getter export to avoid TS6133 unused variable error on the `currentUid` stub (Plan 02 will use this)
- Confirmed all aiSettings records are safe to sync since API keys are stored via WebCrypto in localStorage, not in Dexie

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added getCurrentUid getter to fix TS6133 build error**
- **Found during:** Task 2 (sync module creation)
- **Issue:** `currentUid` variable declared but only written (not read) in stubs, causing TypeScript noUnusedLocals error
- **Fix:** Added `getCurrentUid(): string | null` export (needed by Plan 02 anyway)
- **Files modified:** src/firebase/sync.ts
- **Verification:** `npm run build` passes
- **Committed in:** aa240e9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minimal -- added a getter that Plan 02 needs anyway.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Vitest infrastructure ready for TDD in Plan 02 (sync listeners)
- Sync module contracts define the interface boundary for Plan 02 (listeners) and Plan 03 (migration)
- Firestore persistence enabled, offline write buffering active
- Todo test placeholders ready for Plan 02 to implement

---
*Phase: 10-sync-engine*
*Completed: 2026-03-08*

## Self-Check: PASSED
- All 6 files found
- Both commits verified (c324549, aa240e9)
- initializeFirestore in config.ts confirmed
- 7 exported functions in sync.ts confirmed
