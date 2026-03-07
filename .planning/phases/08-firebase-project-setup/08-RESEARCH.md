# Phase 8: Firebase Project Setup - Research

**Researched:** 2026-03-07
**Domain:** Firebase project configuration, SDK installation, environment setup, security rules, app rename
**Confidence:** HIGH

## Summary

Phase 8 is a foundational setup phase that configures a Firebase project on the Spark plan, installs the Firebase SDK and CLI tools, creates the `src/firebase/config.ts` initialization module, deploys deny-all Firestore security rules, and renames the app from "TaskBreaker" to "taskpad" across all user-facing touchpoints. No auth, sync, or hosting features are delivered -- those belong to Phases 9-11.

The project already has comprehensive Firebase research from the v1.1 milestone planning (`.planning/research/`). This phase-level research narrows scope to only what Phase 8 needs: project creation, SDK install, config file, environment variables, deny-all rules, firebase.json skeleton, and the rename. The Firebase SDK is at v12.10.0 (confirmed current as of March 7, 2026) and firebase-tools is at v15.9.0.

**Primary recommendation:** Keep this phase lean -- deliver the Firebase infrastructure skeleton and the app rename, nothing more. Auth and Firestore persistence configuration are explicitly deferred to later phases.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Firebase project ID: `taskpad`
- App rename: TaskBreaker -> taskpad (all lowercase everywhere)
- Rename scope: PWA manifest name, short_name, page title, any in-app references
- Firestore region: us-east1
- Deploy deny-all rules initially (reject all reads/writes)
- Phase 9 will update rules to allow authenticated per-user access
- Rules file committed to repo (firestore.rules) -- deployed via `firebase deploy --only firestore:rules`
- Firestore only -- no Storage rules needed (no file uploads in v1.1)
- Firebase config lives at `src/firebase/config.ts` (separate from Dexie's `src/db/`)
- Eager initialization on app startup (import in main.tsx)
- Install both `firebase` npm SDK and `firebase-tools` CLI
- `firebase.json` committed to repo
- `.env.local` (git-ignored) holds real Firebase config values
- `.env.example` (committed) documents required `VITE_FIREBASE_*` var names with placeholders
- Comment in `.env.example` explaining these are public client keys, not secrets -- security comes from Firestore rules
- Update `.gitignore` for `.firebase/`, `firebase-debug.log`, `.env.local`

### Claude's Discretion
- Exact `firebase.json` configuration structure
- Which `VITE_FIREBASE_*` vars to include (standard set from Firebase console)
- firebase-tools install method (global vs devDependency)
- Firestore initialization options (memoryLocalCache vs persistentLocalCache deferred to Phase 10)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-03 | Firebase project configured on Spark plan (permanent free tier, not just trial credits) | Spark plan is Firebase's permanent free tier with hard limits (50K reads/day, 20K writes/day, 1GB storage). Distinct from GCP $300 trial credits. Project must be created directly on Spark plan or explicitly downgraded. Verified in existing PITFALLS.md research (Pitfall 8). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | ^12.10.0 | Firebase SDK (app, firestore init) | Current stable (March 2026). Modular tree-shaking API. Only `firebase/app` and `firebase/firestore` needed for Phase 8. |
| firebase-tools | ^15.9.0 | Firebase CLI for rules deployment and future hosting | Current stable (March 2026). Required for `firebase deploy --only firestore:rules`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | -- | Existing stack unchanged | React 19, Vite 5, TypeScript 5.9, Dexie 4.3 all compatible with Firebase 12 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| firebase-tools as devDependency | Global install via `npm i -g firebase-tools` | DevDependency is better: version-locked per project, works in CI, no global pollution. Use `npx firebase` to run. |

**Installation:**
```bash
npm install firebase@^12.10.0
npm install -D firebase-tools@^15.9.0
```

## Architecture Patterns

### Recommended Project Structure (Phase 8 additions only)

```
project root/
├── .env.local              # VITE_FIREBASE_* values (git-ignored via *.local)
├── .env.example            # Placeholder template (committed)
├── firebase.json           # Firebase project config (committed)
├── .firebaserc             # Project alias mapping (committed)
├── firestore.rules         # Deny-all security rules (committed)
└── src/
    └── firebase/
        └── config.ts       # initializeApp + getFirestore export
```

### Pattern 1: Minimal Firebase Config for Setup Phase

**What:** Initialize Firebase app with only the modules needed now. Phase 8 does NOT configure auth, persistence options, or multi-tab managers. Those are added in Phases 9 and 10.

**When to use:** Phase 8 only. The config file will be extended in later phases.

**Example:**
```typescript
// src/firebase/config.ts — Phase 8 version (minimal)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

**Why `getFirestore` not `initializeFirestore`:** Phase 8 does not configure persistence options (that decision is deferred to Phase 10 per CONTEXT.md). Using `getFirestore` is the simplest initialization. Phase 10 will replace this with `initializeFirestore` + persistence config. Using `getFirestore` now and later switching to `initializeFirestore` is safe because `initializeFirestore` must be called before any other Firestore usage -- Phase 10 will simply update this file.

**IMPORTANT:** The variable name `db` shadows the existing Dexie export in `src/db/database.ts`. Use `firestore` as the export name instead to avoid confusion:
```typescript
export const firestore = getFirestore(app);
```

### Pattern 2: Eager Import in main.tsx

**What:** Import the Firebase config module in `main.tsx` so Firebase initializes on app startup, before any component renders.

**Example:**
```typescript
// src/main.tsx — add one import line
import './firebase/config';  // Eager Firebase init (side-effect import)
```

This ensures Firebase is initialized before any component that might use it (in later phases). The side-effect import pattern is standard for Firebase initialization.

### Pattern 3: Deny-All Security Rules

**What:** Deploy Firestore rules that reject ALL reads and writes. No exceptions.

**Example:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Why deny-all:** Phase 8 has no auth. Opening rules even partially creates a security gap. Phase 9 adds auth and updates rules to per-user scoped access.

### Pattern 4: Firebase JSON Skeleton

**What:** Minimal `firebase.json` that configures Firestore rules path. Hosting config will be added in Phase 11.

**Example:**
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

Phase 11 will extend this with the full `hosting` block (SPA rewrites, cache headers, etc.).

### Pattern 5: .firebaserc Project Alias

```json
{
  "projects": {
    "default": "taskpad"
  }
}
```

### Anti-Patterns to Avoid
- **Configuring `initializeFirestore` with persistence options now:** Deferred to Phase 10. Using `getFirestore` keeps Phase 8 minimal.
- **Adding auth imports:** Phase 9 scope. Do not import `firebase/auth` in Phase 8.
- **Using `firebase init` CLI wizard:** The wizard generates boilerplate files with comments and defaults that need cleanup. Writing files manually is cleaner and more intentional for this project.
- **Renaming the Dexie database from 'TaskBreaker' to 'taskpad':** The Dexie DB name `'TaskBreaker'` in `src/db/database.ts` is an internal IndexedDB identifier. Changing it would create a NEW empty database and the user would lose all existing task data. Only rename user-facing strings (manifest, title, UI text).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Firebase project creation | Script/automation | Firebase Console (console.firebase.google.com) | One-time manual step; console handles Spark plan selection, region config, and project ID validation |
| Security rules deployment | Manual copy-paste to console | `firebase deploy --only firestore:rules` via CLI | Reproducible, version-controlled, matches committed `firestore.rules` file |
| Environment variable validation | Custom runtime checks | Vite's `import.meta.env` with TypeScript | Vite already handles env var injection; TypeScript catches missing vars at compile time |

## Common Pitfalls

### Pitfall 1: GCP Free Trial vs. Firebase Spark Plan Confusion
**What goes wrong:** User creates a Firebase project while on a GCP free trial with $300 credit. When trial ends, services stop -- it does NOT auto-switch to Spark plan.
**Why it happens:** GCP trial and Firebase Spark are separate entitlements. The Firebase console may create projects under the trial billing account.
**How to avoid:** In Firebase Console > Project Settings > Usage and billing, verify the plan shows "Spark" (not Blaze with trial credits). If on Blaze/trial, explicitly switch to Spark.
**Warning signs:** Firebase console shows billing warnings; project settings show a billing account attached.

### Pitfall 2: Firebase Project ID Unavailability
**What goes wrong:** The desired project ID `taskpad` may already be taken by another Firebase project globally.
**Why it happens:** Firebase project IDs are globally unique across all Google Cloud.
**How to avoid:** Try `taskpad` first. If unavailable, use `taskpad-app` or similar. Update `.firebaserc` accordingly. The project ID does not need to match the app display name.
**Warning signs:** Firebase console shows "Project ID already exists" during creation.

### Pitfall 3: Missing .env.local Causes Runtime Crash
**What goes wrong:** App starts but Firebase throws "No Firebase App '[DEFAULT]' has been created" or config values are `undefined`.
**Why it happens:** `.env.local` is git-ignored, so after cloning the repo or on a fresh machine, the file doesn't exist. Vite silently returns `undefined` for missing env vars.
**How to avoid:** Create `.env.example` with placeholder values and clear instructions. Add a runtime guard in `config.ts` that throws a helpful error if `VITE_FIREBASE_PROJECT_ID` is falsy.
**Warning signs:** Console shows `undefined` in Firebase config object; "invalid-api-key" error.

### Pitfall 4: Forgetting to Deploy Rules After Creating the Project
**What goes wrong:** Firestore is created with default test-mode rules (allow all for 30 days). Developer forgets to deploy deny-all rules.
**Why it happens:** Firebase console offers "Start in test mode" during Firestore setup, which sets open rules with an expiry date.
**How to avoid:** Choose "Start in locked mode" during Firestore creation in the console. Then deploy the committed `firestore.rules` file with `npx firebase deploy --only firestore:rules`.

### Pitfall 5: Renaming the Dexie Database Destroys User Data
**What goes wrong:** Developer renames Dexie DB from `'TaskBreaker'` to `'taskpad'` as part of the rename. IndexedDB creates a new empty database; all tasks are lost.
**Why it happens:** IndexedDB databases are identified by name. A new name = a new database.
**How to avoid:** Only rename user-facing strings: PWA manifest `name`/`short_name`, HTML `<title>`, any displayed text. The Dexie database name `'TaskBreaker'` is internal and MUST NOT change.

## Code Examples

### Environment Variable Template (.env.example)
```bash
# Firebase Configuration
# These are public client-side keys, NOT secrets.
# Security comes from Firestore rules, not from hiding these values.
# Get these from: Firebase Console > Project Settings > Your apps > SDK setup

VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=taskpad.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskpad
VITE_FIREBASE_STORAGE_BUCKET=taskpad.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:abcdef1234567890
```

### Firebase Config with Runtime Validation
```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail fast with a helpful message if env vars are missing
if (!firebaseConfig.projectId) {
  throw new Error(
    'Firebase config missing. Copy .env.example to .env.local and fill in your Firebase project values.'
  );
}

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
```

### Deny-All Firestore Rules (firestore.rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Minimal firebase.json (Phase 8)
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### .gitignore Additions
```
# Firebase
.firebase/
firebase-debug.log
```
Note: `.env.local` is already covered by the existing `*.local` pattern in `.gitignore`.

### PWA Manifest Rename (in vite.config.ts)
```typescript
manifest: {
  name: 'taskpad',
  short_name: 'taskpad',
  description: 'ADHD-friendly task breakdown app',
  // ... rest unchanged
},
```

### HTML Title Rename (in index.html)
```html
<title>taskpad</title>
```

### main.tsx Eager Import
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import './pwa/register'
import './firebase/config'  // Eager Firebase init
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `firebase/compat/*` (v8 API) | Modular imports (`firebase/app`, etc.) | Firebase v9 (2021) | Tree-shakeable; import only what you use |
| `enableIndexedDbPersistence()` | `initializeFirestore` with `localCache` option | Firebase v10 (2023) | Unified config at init time, not a separate call |
| `firebase-tools` global install | DevDependency + `npx firebase` | Convention shift ~2024 | Version-locked, reproducible builds |
| `storageBucket` format `*.appspot.com` | `*.firebasestorage.app` | Firebase v12 (2025) | New default domain for storage bucket; both work |

## Open Questions

1. **Firebase project ID availability**
   - What we know: User wants `taskpad` as project ID
   - What's unclear: Whether it's globally available (Firebase IDs are unique)
   - Recommendation: Try `taskpad` first; fall back to `taskpad-app` or similar

2. **Firestore region selection in console**
   - What we know: User chose us-east1
   - What's unclear: Nothing -- straightforward console selection
   - Recommendation: Select `us-east1` during Firestore database creation (this is irreversible)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (no automated test framework in project) |
| Config file | none |
| Quick run command | `npm run build` (TypeScript + Vite build verifies no import errors) |
| Full suite command | `npm run build && npm run dev` (build + manual console check) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-03 | Firebase project on Spark plan | manual-only | N/A -- verify in Firebase Console | N/A |
| SETUP-03 | SDK installs without error | smoke | `npm install && npm run build` | N/A |
| SETUP-03 | config.ts initializes without error | smoke | `npm run dev` + check console | N/A |
| SETUP-03 | Security rules deployed and reject all | manual-only | `npx firebase deploy --only firestore:rules` + verify in Firebase Console Rules Playground | N/A |
| SETUP-03 | .env.local present and app starts | smoke | `npm run dev` + no Firebase errors in console | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (catches TypeScript/import errors)
- **Per wave merge:** `npm run build && npm run dev` (full build + manual console verification)
- **Phase gate:** All 4 success criteria from phase description verified manually

### Wave 0 Gaps
None -- Phase 8 is configuration and setup; no custom test infrastructure needed. Build command serves as the automated verification.

## Sources

### Primary (HIGH confidence)
- [firebase npm package](https://www.npmjs.com/package/firebase) - v12.10.0 confirmed current (March 7, 2026)
- [firebase-tools npm package](https://www.npmjs.com/package/firebase-tools) - v15.9.0 confirmed current (March 7, 2026)
- `.planning/research/STACK.md` - Comprehensive Firebase SDK research from v1.1 planning (2026-03-01)
- `.planning/research/ARCHITECTURE.md` - Firebase integration architecture patterns
- `.planning/research/PITFALLS.md` - Firebase integration pitfalls catalog

### Secondary (MEDIUM confidence)
- [Firebase JavaScript SDK Release Notes](https://firebase.google.com/support/release-notes/js) - Version history and compatibility
- [Firebase CLI Release Notes](https://firebase.google.com/support/release-notes/cli) - CLI version history

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - firebase@12.10.0 and firebase-tools@15.9.0 verified against npm registry
- Architecture: HIGH - Minimal config pattern is straightforward; existing milestone research covers full architecture
- Pitfalls: HIGH - All pitfalls verified via existing research and official docs

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable domain, no fast-moving dependencies)
