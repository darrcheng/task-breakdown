# Phase 8: Firebase Project Setup - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure Firebase project, install SDK and CLI tools, set up credentials in environment, deploy deny-all security rules, and verify the app starts without Firebase errors. This phase delivers the foundation — no auth, sync, or hosting features. Also rename the app from TaskBreaker to **taskpad** (all lowercase) across all touchpoints.

</domain>

<decisions>
## Implementation Decisions

### Project naming & identity
- Firebase project ID: `taskpad`
- App rename: TaskBreaker → taskpad (all lowercase everywhere)
- Rename scope: PWA manifest name, short_name, page title, any in-app references
- Firestore region: us-east1

### Security rules
- Deploy deny-all rules initially (reject all reads/writes)
- Phase 9 will update rules to allow authenticated per-user access
- Rules file committed to repo (firestore.rules) — deployed via `firebase deploy --only firestore:rules`
- Firestore only — no Storage rules needed (no file uploads in v1.1)

### SDK initialization pattern
- Firebase config lives at `src/firebase/config.ts` (separate from Dexie's `src/db/`)
- Eager initialization on app startup (import in main.tsx)
- Install both `firebase` npm SDK and `firebase-tools` CLI
- `firebase.json` committed to repo

### Environment & secrets handling
- `.env.local` (git-ignored) holds real Firebase config values
- `.env.example` (committed) documents required `VITE_FIREBASE_*` var names with placeholders
- Comment in `.env.example` explaining these are public client keys, not secrets — security comes from Firestore rules
- Update `.gitignore` for `.firebase/`, `firebase-debug.log`, `.env.local`

### Claude's Discretion
- Exact `firebase.json` configuration structure
- Which `VITE_FIREBASE_*` vars to include (standard set from Firebase console)
- firebase-tools install method (global vs devDependency)
- Firestore initialization options (memoryLocalCache vs persistentLocalCache deferred to Phase 10)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts`: PWA manifest with name/short_name fields — needs rename to "taskpad"
- `src/db/database.ts`: Dexie setup pattern — Firebase config follows similar singleton export pattern

### Established Patterns
- Vite 5 + React 19 + TypeScript — Firebase SDK must be compatible
- Environment vars use `VITE_` prefix for client exposure (Vite convention)
- No existing `.env` files — clean slate

### Integration Points
- `vite.config.ts` PWA manifest: update name, short_name, description
- `index.html`: update page title
- `src/main.tsx`: import Firebase config for eager init
- `.gitignore`: add Firebase-specific entries
- `package.json`: add firebase dependency, firebase-tools devDependency

</code_context>

<specifics>
## Specific Ideas

- User wants "taskpad" all lowercase — not "Taskpad" or "TaskPad"
- URL will be taskpad.web.app (if project ID is available)
- User is on US East Coast — chose us-east1 for lower latency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-firebase-project-setup*
*Context gathered: 2026-03-07*
