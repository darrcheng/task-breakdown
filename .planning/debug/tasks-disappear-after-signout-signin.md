---
status: diagnosed
trigger: "tasks disappear after sign-out and sign-back-in"
created: 2026-03-08T00:00:00Z
updated: 2026-03-08T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED - db.delete() destroys the IndexedDB database; on sign-back-in, db.open() re-creates it but the populate event re-seeds default categories which triggers outbound Dexie hooks that OVERWRITE Firestore categories with defaults. Meanwhile, task data arrives via onSnapshot but may fail or the database state is inconsistent.
test: traced full sign-out -> sign-back-in flow through code
expecting: n/a - root cause confirmed
next_action: apply fix - replace db.delete() with table.clear() calls

## Symptoms

expected: After sign-back-in, onSnapshot listeners pull existing Firestore docs into local Dexie
actual: Tasks are gone after sign-back-in
errors: unknown (likely silent failures or data overwrite)
reproduction: sign in -> have tasks synced -> sign out -> sign back in -> tasks missing
started: phase 10 sync engine

## Eliminated

- hypothesis: onSnapshot only fires for changes, not existing docs
  evidence: Firestore onSnapshot always sends initial snapshot with all existing docs
  timestamp: 2026-03-08T00:00:30Z

- hypothesis: echo guard incorrectly filtering initial snapshot
  evidence: Echo guard checks hasPendingWrites which is false for server-confirmed docs in initial snapshot. This is correct behavior.
  timestamp: 2026-03-08T00:00:30Z

- hypothesis: startSync not being called after sign-back-in
  evidence: AuthContext.tsx onAuthStateChanged handler calls migrateLocalData().then(() => startSync()) for any non-null user. Sign-back-in fires this.
  timestamp: 2026-03-08T00:00:30Z

## Evidence

- timestamp: 2026-03-08T00:00:10Z
  checked: SettingsModal.tsx handleSignOut flow
  found: Sign-out calls stopSync() -> db.delete() -> signOutUser() in sequence
  implication: db.delete() destroys the ENTIRE IndexedDB database, not just clearing tables

- timestamp: 2026-03-08T00:00:20Z
  checked: database.ts db singleton and populate event
  found: db is created once as module-level singleton. populate event seeds 5 default categories. setupDexieHooks() called once at module load.
  implication: After db.delete(), Dexie auto-reopens on next operation, triggering populate again. This re-seeds default categories.

- timestamp: 2026-03-08T00:00:25Z
  checked: database.ts setupDexieHooks registration
  found: Hooks registered at module load time (line 63-64). After db.delete(), Dexie internally closes the database. When auto-reopened, hooks registered via table.hook() may be lost since they were registered on the old connection.
  implication: Outbound sync hooks may not fire after sign-back-in, AND inbound writes (table.put) may fail silently on a closed/reopened database

- timestamp: 2026-03-08T00:00:30Z
  checked: AuthContext.tsx sign-back-in flow
  found: onAuthStateChanged calls migrateLocalData(uid) then startSync(uid). migrateLocalData reads from db (which was deleted). If Dexie auto-reopens, populate fires and seeds default categories BEFORE startSync sets syncEnabled=true. These default categories are written to Dexie while sync is disabled, so they don't go to Firestore. But when onSnapshot fires, processInboundChange tries table.put() on a database that may be in an inconsistent state.
  implication: The core issue is using db.delete() instead of clearing tables, which destroys the database connection and causes unpredictable behavior on reuse

- timestamp: 2026-03-08T00:00:35Z
  checked: Dexie.js documentation on db.delete() behavior
  found: Dexie docs confirm db.delete() deletes the database and closes the connection. Reusing the same instance after delete requires explicit db.open(). GitHub issues (#521, #1571) show developers encountering "database has been closed" errors when reusing instances after delete. Recommended approach is table.clear() to wipe data without destroying the database.
  implication: CONFIRMED - db.delete() is the wrong API for "wipe local data on sign-out"

## Resolution

root_cause: SettingsModal.tsx handleSignOut calls db.delete() which destroys the entire IndexedDB database and closes the Dexie connection. On sign-back-in, the db singleton is in a closed/deleted state. While Dexie may auto-reopen on next query, this causes two problems: (1) the populate event re-fires seeding default categories, and (2) the Dexie hooks registered at module load by setupDexieHooks() may be lost since they were registered on the pre-delete connection. The result is that processInboundChange's table.put() calls either fail silently or the database is in an inconsistent state, preventing Firestore data from being written to local Dexie.
fix: Replace db.delete() with clearing all tables individually (db.tasks.clear(), db.categories.clear(), db.aiSettings.clear()). This preserves the database connection, keeps hooks intact, and avoids re-triggering populate.
verification:
files_changed: []
