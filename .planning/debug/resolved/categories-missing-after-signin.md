---
status: resolved
trigger: "categories don't exist and can't be created after sign-in"
created: 2026-03-08T00:00:00Z
updated: 2026-03-08T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED - db.delete() defaults to {disableAutoOpen: true} in Dexie 4, which permanently disables auto-open on the module-level db singleton. All subsequent queries silently fail.
test: Read Dexie 4 source code for db.delete() default options
expecting: disableAutoOpen defaults to true
next_action: Report root cause

## Symptoms

expected: After sign-in, user should see 5 default categories (Work, Personal, Health, Learning, Errands) seeded by populate() hook, and be able to create new categories
actual: No categories exist after sign-in. Cannot create new categories.
errors: Unknown - need to check console
reproduction: Sign in with Google account
started: After phase 10 sync engine changes added db.delete() to sign-out flow

## Eliminated

## Evidence

- timestamp: 2026-03-08T00:01:00Z
  checked: database.ts - db creation and populate hook
  found: db is created as module-level const. populate() hook seeds 5 default categories. setupDexieHooks() is called at module load time (line 64).
  implication: populate() only fires once when IndexedDB database is first created via db.open()

- timestamp: 2026-03-08T00:02:00Z
  checked: SettingsModal.tsx - handleSignOut flow
  found: Sign-out calls stopSync() then db.delete() then signOutUser(). db.delete() destroys the IndexedDB database entirely.
  implication: After db.delete(), the module-level `db` is referencing a deleted database

- timestamp: 2026-03-08T00:03:00Z
  checked: AuthContext.tsx - sign-in flow
  found: onAuthStateChanged fires with user, calls migrateLocalData(uid) then startSync(uid). No call to db.open() or any database re-initialization.
  implication: After sign-out+sign-in cycle, code uses the stale deleted db reference. Dexie may auto-reopen on next query, but populate() won't fire because it only fires on VERSION UPGRADE or FIRST CREATION - and the db object already has its version set.

- timestamp: 2026-03-08T00:04:00Z
  checked: Dexie populate() behavior
  found: Dexie's populate() event fires ONLY during database creation (first open of a new database). When db.delete() removes the database and Dexie auto-reopens on next access, the database IS recreated fresh, so populate() SHOULD fire again. BUT - the hooks registered via setupDexieHooks() at module load time are still active. The 'creating' hook fires synchronously during populate's bulkAdd.
  implication: Need to check if the creating hook interferes with populate() transaction

- timestamp: 2026-03-08T00:05:00Z
  checked: setupDexieHooks creating hook behavior during populate()
  found: The creating hook registers an onsuccess callback that checks isSyncEnabled(). After sign-out, syncEnabled=false (stopSync sets it). After sign-in, the flow is: onAuthStateChanged -> migrateLocalData -> startSync. migrateLocalData reads from db (triggering auto-reopen and populate). At this point syncEnabled is still false. So the creating hook's onsuccess will fire but return early due to !isSyncEnabled(). This should be safe.
  implication: The hooks should not interfere. But wait - does db.delete() actually allow auto-reopen?

- timestamp: 2026-03-08T00:06:00Z
  checked: Dexie 4 source code - node_modules/dexie/dist/dexie.mjs line 5562
  found: "Dexie.prototype.delete = function (closeOptions) { if (closeOptions === void 0) { closeOptions = { disableAutoOpen: true }; }" -- db.delete() defaults to disableAutoOpen:true. This calls close({disableAutoOpen:true}) which sets state.autoOpen=false permanently on the instance.
  implication: ROOT CAUSE CONFIRMED. After db.delete(), the module-level db singleton has autoOpen=false. All subsequent db.categories.toArray(), db.categories.add(), etc. silently fail because the database never reopens. populate() never fires. Manual category creation also fails.

- timestamp: 2026-03-08T00:07:00Z
  checked: Dexie close() implementation - line 5542-5558
  found: close({disableAutoOpen:true}) sets state.autoOpen=false and calls _close(). close({disableAutoOpen:false}) only calls _close() without disabling autoOpen, allowing Dexie to auto-reopen on next query.
  implication: The fix is to call db.delete({disableAutoOpen:false}) so the instance can auto-reopen, OR call db.open() explicitly after delete.

## Resolution

root_cause: db.delete() in SettingsModal.tsx (line 36) calls Dexie's delete with default options, which in Dexie 4 defaults to {disableAutoOpen: true}. This permanently sets state.autoOpen=false on the module-level db singleton exported from database.ts. After sign-out, the db instance is in a permanently closed state -- all subsequent reads return undefined/empty, all writes silently fail, and populate() never re-fires because the database never auto-reopens.
fix: Change db.delete() to db.delete({disableAutoOpen: false}) so the Dexie instance can auto-reopen on next access. When it auto-reopens, it will create a fresh IndexedDB (since the old one was deleted), which triggers the populate() event, seeding the default categories. Then migrateLocalData/startSync will work normally.
verification:
files_changed: []
