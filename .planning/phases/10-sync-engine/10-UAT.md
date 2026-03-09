---
status: resolved
phase: 10-sync-engine
source: [10-01-SUMMARY.md, 10-02-SUMMARY.md, 10-03-SUMMARY.md, 10-04-SUMMARY.md, 10-05-SUMMARY.md]
started: 2026-03-08T21:04:29Z
updated: 2026-03-08T23:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start the application from scratch with `npm run dev`. Server boots without errors, the app loads in browser, and the task list displays with any existing local data.
result: pass

### 2. Sign-In Triggers Data Migration
expected: With local tasks already in the app, sign in with Google. A "Setting up sync..." spinner appears briefly. After it completes, the app returns to normal view with all your local tasks intact.
result: pass

### 3. Real-Time Sync (Cross-Tab)
expected: Open the app in two browser tabs while signed in. Create a task in Tab 1. The new task appears in Tab 2 without refreshing.
result: pass

### 4. Offline-First Writes
expected: While signed in, disconnect from the internet (airplane mode or disable network). Create or edit a task. The change saves locally and the app works normally. Reconnect — the change syncs to Firestore automatically.
result: pass

### 5. Sign-Out Safety
expected: While signed in with synced data, sign out from Settings. The app clears local data and returns to the sign-in screen. Sign back in — your data reappears from Firestore.
result: issue
reported: "fail, my tasks are no longer there"
severity: major

### 6. Category Sync Without Duplication
expected: While signed in, check your categories list. Sign out and sign back in. Categories appear exactly once — no duplicates created by the sync process.
result: issue
reported: "I have no categories and I can't seem to make any"
severity: major

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "After sign-out and sign-back-in, tasks reappear from Firestore"
  status: resolved
  reason: "User reported: fail, my tasks are no longer there"
  severity: major
  test: 5
  root_cause: "db.delete() in SettingsModal.tsx destroys IndexedDB and permanently closes Dexie connection (disableAutoOpen: true). On re-sign-in, db singleton is dead — all reads return empty, writes silently fail, onSnapshot data can't be written to Dexie."
  artifacts:
    - path: "src/components/ui/SettingsModal.tsx"
      issue: "db.delete() destroys database connection permanently"
    - path: "src/db/database.ts"
      issue: "setupDexieHooks() runs once at module load, hooks lost after delete"
  missing:
    - "Replace db.delete() with table.clear() calls to preserve connection"
  debug_session: ".planning/debug/tasks-disappear-after-signout-signin.md"

- truth: "Categories exist and can be created while signed in"
  status: resolved
  reason: "User reported: I have no categories and I can't seem to make any"
  severity: major
  test: 6
  root_cause: "Same root cause as test 5. db.delete() with Dexie 4 defaults to disableAutoOpen: true, permanently closing the db singleton. populate() never re-fires, all category writes silently fail."
  artifacts:
    - path: "src/components/ui/SettingsModal.tsx"
      issue: "db.delete() destroys database connection permanently"
    - path: "src/db/database.ts"
      issue: "populate() only fires on first database creation, not after delete+reopen"
  missing:
    - "Replace db.delete() with table.clear() calls to preserve connection and hooks"
  debug_session: ".planning/debug/categories-missing-after-signin.md"
