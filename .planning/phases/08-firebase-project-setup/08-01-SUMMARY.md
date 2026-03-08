---
phase: 08-firebase-project-setup
plan: 01
subsystem: infra
tags: [firebase, firestore, pwa, vite, rename]

# Dependency graph
requires: []
provides:
  - Firebase SDK installed (firebase@12.10.0, firebase-tools@15.9.0)
  - Firebase config module (src/firebase/config.ts) exporting app and firestore
  - Deny-all Firestore security rules (firestore.rules)
  - Firebase project config (firebase.json, .firebaserc)
  - Environment variable template (.env.example)
  - App renamed from TaskBreaker to taskpad in all user-facing touchpoints
affects: [09-firebase-auth, 10-firestore-sync, 11-firebase-hosting]

# Tech tracking
tech-stack:
  added: [firebase@12.10.0, firebase-tools@15.9.0]
  patterns: [firebase-eager-init, deny-all-rules, env-template]

key-files:
  created: [src/firebase/config.ts, .env.example, firestore.rules, firebase.json, .firebaserc]
  modified: [package.json, .gitignore, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/components/mobile/MobileLayout.tsx, src/components/mobile/InstallBanner.tsx]

key-decisions:
  - "Export name 'firestore' (not 'db') to avoid shadowing Dexie export"
  - "getFirestore (not initializeFirestore) -- persistence config deferred to Phase 10"
  - "firebase-tools as devDependency (not global) for version-locked reproducible builds"

patterns-established:
  - "Firebase eager init: side-effect import in main.tsx before component rendering"
  - "Deny-all rules as starting point, opened per-phase as needed"
  - "Environment template pattern: .env.example committed, .env.local git-ignored"

requirements-completed: [SETUP-03]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 8 Plan 1: Firebase SDK & Config Infrastructure Summary

**Firebase 12 SDK with deny-all Firestore rules, environment template, and app rename from TaskBreaker to taskpad**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T00:05:22Z
- **Completed:** 2026-03-08T00:09:32Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Firebase SDK (v12.10.0) and CLI tools (v15.9.0) installed and building cleanly
- Firebase config module created with runtime validation guard for missing env vars
- All user-visible references renamed from TaskBreaker to taskpad (manifest, title, headers, install banner)
- Internal identifiers (IndexedDB names, localStorage keys, custom events) preserved to protect user data

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Firebase SDK, create config and infrastructure files** - `eab2502` (feat)
2. **Task 2: Rename app from TaskBreaker to taskpad and wire Firebase init** - `27be138` (feat)

## Files Created/Modified
- `src/firebase/config.ts` - Firebase app and Firestore initialization with env var validation
- `.env.example` - Template for all 6 VITE_FIREBASE_* variables with explanatory comments
- `firestore.rules` - Deny-all security rules (allow read, write: if false)
- `firebase.json` - Firebase project config pointing to firestore.rules
- `.firebaserc` - Project alias mapping to 'taskpad'
- `package.json` - Added firebase and firebase-tools dependencies
- `.gitignore` - Added .firebase/ and firebase-debug.log exclusions
- `vite.config.ts` - PWA manifest name/short_name changed to taskpad
- `index.html` - Page title changed to taskpad
- `src/main.tsx` - Added Firebase config eager import
- `src/App.tsx` - Desktop header h1 changed to taskpad
- `src/components/mobile/MobileLayout.tsx` - Mobile header h1 changed to taskpad
- `src/components/mobile/InstallBanner.tsx` - Install banner text changed to taskpad

## Decisions Made
- Used `firestore` as export name (not `db`) to avoid shadowing the Dexie export in src/db/database.ts
- Used `getFirestore` (not `initializeFirestore`) since persistence config is deferred to Phase 10
- Installed firebase-tools as devDependency for version-locked builds (use `npx firebase` to run)

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration.** The plan's `user_setup` section documents:
- Create Firebase project with ID 'taskpad' on Spark plan in Firebase Console
- Create Firestore database in us-east1 region, start in locked mode
- Register a Web app to get SDK config values
- Copy `.env.example` to `.env.local` and fill in Firebase project values from console

## Next Phase Readiness
- Firebase infrastructure complete, ready for Phase 9 (Firebase Auth)
- Config module will be extended in Phase 9 (auth) and Phase 10 (persistence options)
- Deny-all rules will be updated in Phase 9 to allow authenticated per-user access

## Self-Check: PASSED

All created files verified on disk. Both task commits (eab2502, 27be138) found in git history.

---
*Phase: 08-firebase-project-setup*
*Completed: 2026-03-08*
