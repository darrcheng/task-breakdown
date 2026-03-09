---
phase: 10-sync-engine
plan: 03
subsystem: sync
tags: [firestore, dexie, migration, writeBatch, getDocs, batch-chunking]

# Dependency graph
requires:
  - phase: 10-sync-engine
    plan: 02
    provides: Bidirectional sync engine, serializeForFirestore helper, sync module structure
  - phase: 09-auth
    provides: Auth flow with sign-in/sign-out, Firestore security rules
provides:
  - migrateLocalData function for first-sign-in data upload
  - Second-device union merge (skip existing Firestore docs)
  - Batch chunking at 450 operations for Firestore writeBatch limit
  - isMigrating() flag for UI spinner state
affects: [10-04-integration, 10-05-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [writeBatch chunking at 450 ops, getDocs for existing-doc check, union merge via Set filtering]

key-files:
  created: []
  modified:
    - src/firebase/sync.ts
    - src/firebase/sync.test.ts

key-decisions:
  - "Union merge strategy: upload only local records whose String(id) is not already in Firestore"
  - "Cloud-only records handled by onSnapshot listeners (Plan 04), not migration pull-down"
  - "Batch chunk size 450 (not 500) to leave margin under Firestore 500-op writeBatch limit"

patterns-established:
  - "Migration pattern: read all local -> check existing cloud -> filter -> batch upload"
  - "isMigrating flag follows same getter pattern as isSyncEnabled/isSyncWriteInProgress"

requirements-completed: [SYNC-02, DATA-02]

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 10 Plan 03: Data Migration Summary

**migrateLocalData with writeBatch upload, second-device union merge, and 450-op batch chunking for first-sign-in Dexie-to-Firestore migration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T18:04:55Z
- **Completed:** 2026-03-08T18:10:00Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- migrateLocalData uploads all local tasks, categories, and aiSettings to Firestore on first sign-in
- Union merge on second device: only non-duplicate records uploaded (existing Firestore docs skipped)
- Batch chunking at 450 operations handles datasets exceeding Firestore's 500-op writeBatch limit
- isMigrating() flag exported for UI "Setting up sync..." spinner
- 6 new migration tests (18 total in sync.test.ts, 21 total project-wide)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing migration tests** - `db5defe` (test)
2. **Task 1 GREEN: Implement migrateLocalData** - `36cdc70` (feat)

## Files Created/Modified
- `src/firebase/sync.ts` - Added migrateLocalData implementation with getDocs, writeBatch imports; isMigrating flag and getter; batch chunking logic (361 lines total)
- `src/firebase/sync.test.ts` - 6 new migration tests: empty Firestore upload, second-device merge, empty local no-op, batch chunking, parentId preservation, isMigrating flag (362 lines total)

## Decisions Made
- Union merge strategy filters local records against existing Firestore doc IDs via Set lookup, uploading only missing records
- Cloud-only records (exist in Firestore but not locally) are NOT pulled during migration -- they arrive via onSnapshot listeners started after migration in Plan 04
- Batch chunk size set to 450 (not 500) to leave safety margin under Firestore's 500-operation writeBatch limit

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript mock typing for writeBatch/getDocs in tests**
- **Found during:** Task 1 GREEN (build verification)
- **Issue:** Spread of `unknown[]` args into mock functions caused TS2556 error; mock factory functions needed typed wrappers
- **Fix:** Used `vi.fn()` directly in mock factory and cast imported mocks via `as ReturnType<typeof vi.fn>` in test describe block
- **Files modified:** src/firebase/sync.test.ts
- **Verification:** `npm run build` passes
- **Committed in:** 36cdc70 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** TypeScript strict-mode mock typing fix. No behavioral or architectural changes.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- migrateLocalData ready to be called from auth lifecycle (Plan 04 integration)
- isMigrating() available for UI spinner during migration
- All sync primitives (startSync, stopSync, migrateLocalData, setupDexieHooks) exported and tested

---
*Phase: 10-sync-engine*
*Completed: 2026-03-08*

## Self-Check: PASSED
- All 2 files found (sync.ts, sync.test.ts)
- All 2 commits verified (db5defe, 36cdc70)
- sync.ts has 361 lines (migrateLocalData implementation present)
- sync.test.ts has 362 lines (min_lines: 80 met)
- writeBatch and getDocs imports present in sync.ts
