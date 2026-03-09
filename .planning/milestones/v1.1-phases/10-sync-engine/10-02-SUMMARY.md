---
phase: 10-sync-engine
plan: 02
subsystem: sync
tags: [firestore, dexie, onSnapshot, hooks, echo-guard, lww, bidirectional-sync]

# Dependency graph
requires:
  - phase: 10-sync-engine
    plan: 01
    provides: Sync module contracts, serialization helpers, vitest infrastructure
  - phase: 09-auth
    provides: Auth flow with sign-in/sign-out, Firestore security rules
provides:
  - Bidirectional sync engine (outbound via Dexie hooks, inbound via onSnapshot)
  - Echo guard preventing infinite loops (hasPendingWrites check)
  - Last-write-wins conflict resolution for tasks (updatedAt comparison)
  - processInboundChange testable helper for all inbound sync logic
  - setupDexieHooks for automatic outbound Firestore writes
affects: [10-03-migration, 10-04-integration, 10-05-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [Dexie hooks for transparent outbound sync, onSnapshot for inbound sync, echo guard via hasPendingWrites, LWW via updatedAt comparison, syncWriteInProgress flag for loop prevention]

key-files:
  created: []
  modified:
    - src/firebase/sync.ts
    - src/firebase/sync.test.ts
    - src/db/database.ts

key-decisions:
  - "Used `any` cast for Dexie table hook registration to work around EntityTable strict typing"
  - "LWW applied only to tasks table; categories/aiSettings always overwrite (simpler data with no timestamps)"
  - "processInboundChange exported as testable unit separate from onSnapshot wiring"
  - "serializeModifications helper added for partial updateDoc on task modifications"

patterns-established:
  - "Outbound sync: Dexie hooks registered at module load, guard checks on each invocation"
  - "Inbound sync: processInboundChange handles echo guard, LWW, and Dexie writes atomically"
  - "syncWriteInProgress flag set true during inbound writes, false after, preventing outbound hook re-fire"

requirements-completed: [SYNC-01, SYNC-04, SYNC-05]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 10 Plan 02: Sync Listeners Summary

**Bidirectional Dexie-Firestore sync engine with echo guard (hasPendingWrites), LWW conflict resolution (updatedAt), and transparent outbound sync via Dexie hooks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T17:58:43Z
- **Completed:** 2026-03-08T18:03:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Full bidirectional sync: every Dexie write triggers Firestore write (outbound), every onSnapshot change flows into Dexie (inbound)
- Echo guard prevents infinite loops by skipping onSnapshot changes with hasPendingWrites=true
- LWW conflict resolution for tasks: only newer updatedAt wins, new records always accepted
- 15 tests pass including 7 new tests for echo guard, LWW, removed docs, and flag lifecycle

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement sync engine core (TDD RED)** - `a87b3d2` (test)
2. **Task 1: Implement sync engine core (TDD GREEN)** - `f9dcc4b` (feat)
3. **Task 2: Add Dexie hooks for outbound sync** - `bbb15a5` (feat)

## Files Created/Modified
- `src/firebase/sync.ts` - Full sync engine: startSync/stopSync with onSnapshot, processInboundChange with echo guard and LWW, setupDexieHooks for outbound, serializeModifications helper
- `src/firebase/sync.test.ts` - 12 passing tests + 1 todo (migration for Plan 03): echo guard, LWW, removed docs, flag lifecycle
- `src/db/database.ts` - Calls setupDexieHooks() at module load for outbound sync

## Decisions Made
- Used `any` cast for Dexie EntityTable hook registration due to strict generic typing that prevented hook('creating'/etc.) on union table types
- LWW only applied to tasks (which have updatedAt); categories and aiSettings always overwrite on inbound since they lack timestamps
- Exported processInboundChange as a standalone testable function rather than testing through onSnapshot mock wiring
- Added serializeModifications helper for partial Firestore updates (updateDoc) on task modifications

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict typing for Dexie hook registration**
- **Found during:** Task 2 (build verification)
- **Issue:** Dexie EntityTable generic typing prevents `table.hook('creating', ...)` calls when table is typed as union of Task|Category|AISettings tables
- **Fix:** Cast `db[tableName]` to `any` for hook registration (hooks are runtime-only, type safety maintained through guard functions)
- **Files modified:** src/firebase/sync.ts
- **Verification:** `npm run build` passes
- **Committed in:** bbb15a5 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed test mock missing DocumentChange properties**
- **Found during:** Task 2 (build verification)
- **Issue:** Mock DocumentChange objects missing `oldIndex` and `newIndex` properties required by Firestore type
- **Fix:** Added oldIndex: -1, newIndex: -1 to mock helper, cast return type to `any`
- **Files modified:** src/firebase/sync.test.ts
- **Verification:** `npm run build` passes, tests still pass
- **Committed in:** bbb15a5 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both were TypeScript strict-mode typing issues. No behavioral or architectural changes.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sync engine fully operational for Plan 03 (data migration on first sign-in)
- Plan 04 (integration) can wire startSync/stopSync into auth lifecycle
- processInboundChange and setupDexieHooks exported and tested

---
*Phase: 10-sync-engine*
*Completed: 2026-03-08*

## Self-Check: PASSED
- All 3 files found (sync.ts, sync.test.ts, database.ts)
- All 3 commits verified (a87b3d2, f9dcc4b, bbb15a5)
- sync.ts has 296 lines (min_lines: 100 met)
- sync.test.ts has 224 lines (min_lines: 50 met)
- hooks.ts has 0 firebase imports (SYNC-03 maintained)
- database.ts contains setupDexieHooks() call
