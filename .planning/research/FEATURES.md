# Feature Landscape: Firebase Deploy & Real-Time Sync (v1.1 Milestone)

**Domain:** Firebase Auth + Firestore sync + Firebase Hosting for existing PWA
**Researched:** 2026-03-01
**Confidence:** HIGH (verified against Firebase official docs, GitHub issues, and multiple corroborating sources)

## Scope Note

This document covers ONLY the new features for v1.1. The existing v1.0 features (calendar view, AI breakdown, IndexedDB persistence via Dexie.js, drag-and-drop, PWA) are complete and out of scope. The Dexie.js dependency is the key architectural constraint — it must coexist with Firestore's own IndexedDB usage.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume any "signed-in app with cloud sync" will have. Missing these = the feature feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Google sign-in** | Standard OAuth login; users expect "sign in with Google" as the minimal-friction path for a personal app | LOW | `signInWithPopup` for desktop; `signInWithRedirect` for mobile/PWA. Both needed due to browser differences. |
| **Sign-out** | Users expect to explicitly end session | LOW | `signOut()` from Firebase Auth; clear local state on sign-out |
| **Persistent auth session** | Users expect to stay signed in across page reloads and browser restarts | LOW | Firebase Auth persists session to IndexedDB by default (`browserLocalPersistence`). No extra work needed. |
| **Data belongs to the signed-in user** | Tasks created while signed in must be tied to the user and visible only to them | MEDIUM | Firestore path `/users/{uid}/tasks/{taskId}` + security rules scoped to `request.auth.uid` |
| **Real-time sync across devices** | Core ask of the milestone: tasks created on phone appear on PC without refresh | MEDIUM | Firestore real-time listeners (`onSnapshot`) propagate changes within ~1 second when online |
| **Offline data access** | Tasks must be readable when network is lost | LOW | Firestore's `persistentLocalCache()` caches reads in its own IndexedDB store (separate from Dexie) |
| **Offline writes queue and sync** | Tasks created/edited offline must sync when connectivity returns | MEDIUM | Firestore automatically queues pending writes and flushes on reconnect. No explicit retry code needed. |
| **HTTPS deploy** | PWA service workers require HTTPS; users expect a real URL | LOW | Firebase Hosting serves over HTTPS by default. Domain is `[project-id].web.app`. |
| **App loads fast** | SPA deploy must handle React Router paths without 404s | LOW | `firebase.json` rewrite rule: all paths → `/index.html` |
| **Code deploys don't touch data** | Developer expectation: `firebase deploy --only hosting` never touches Firestore data | LOW | Firebase Hosting and Firestore are independent. Deploy only touches `/dist` files. |

### Differentiators (Competitive Advantage)

Features beyond bare minimum that meaningfully improve UX for this specific app.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Offline sync status indicator** | Users with ADHD can become anxious if they don't know whether data is saved. Showing "syncing..." vs "saved" removes doubt. | LOW | Firestore snapshots include `metadata.hasPendingWrites` and `metadata.fromCache` flags. Readable without extra calls. |
| **Seamless popup + redirect fallback** | Chrome M115+, Firefox 109+, Safari 16.1+ block third-party cookies, which breaks naive `signInWithRedirect`. Implementing both methods prevents auth failures across browser/platform combos. | MEDIUM | Use `signInWithPopup` on desktop; switch to `signInWithRedirect` on mobile/PWA. Firebase docs have a dedicated best-practices page for this case. |
| **Data migration from anonymous/local IndexedDB on first sign-in** | v1.0 users have tasks in Dexie/IndexedDB. On first sign-in, those local tasks should be uploaded to Firestore so nothing is lost. | HIGH | No built-in Firebase mechanism. Requires a one-time migration: read from Dexie, write to Firestore, mark as migrated. Most complex step in the milestone. |
| **Sync layer that doesn't break existing Dexie.js reactivity** | The app uses `useLiveQuery` from Dexie for per-cell reactive queries. Firestore sync must update Dexie as source of truth so all existing UI re-renders continue to work. | HIGH | Recommended pattern: Firestore is the sync source, Dexie is the local cache and UI source. Firestore `onSnapshot` → write to Dexie → existing `useLiveQuery` picks up changes. Avoids rewriting UI layer. |
| **Multi-tab safety** | Opening the app in multiple browser tabs must not corrupt data or cause duplicate sync writes | MEDIUM | Use Firestore's `persistentMultipleTabManager()` (the modern replacement for deprecated `enableMultiTabIndexedDbPersistence()`). One tab becomes the "owner" of the Firestore network connection. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Anonymous auth before sign-in** | Allows app usage without an account | Adds account upgrade complexity (linking anonymous UID to Google UID). Local IndexedDB data migration is already a one-time solved problem — anonymous auth adds a second migration problem and permanent auth state to manage. | Skip anonymous auth. Let unauthenticated users use Dexie-only mode; sign-in triggers migration. |
| **Real-time Firestore as the UI source (replace Dexie)** | "Simpler" to have one data source | Breaks all existing `useLiveQuery` reactive queries, requires rewriting every component that reads data, loses IndexedDB offline-first benefits. Would be a full rewrite of the data layer. | Keep Dexie as local cache and UI source; use Firestore as sync bus. Firestore writes flow into Dexie via `onSnapshot`. |
| **Custom conflict resolution logic** | Sounds necessary for offline-first | For a single-user personal app, last-write-wins (Firestore's default) is correct behavior. The user cannot conflict with themselves in a meaningful way across devices — the last device they used wins. Custom conflict resolution adds weeks of complexity for zero user benefit. | Accept Firestore's last-write-wins. Document this decision. |
| **Firebase Cloud Messaging push notifications** | "Notify me of overdue tasks" | ADHD users find intrusive notifications harmful. Already documented as out-of-scope in PROJECT.md. Would also require service worker changes and notification permissions flow. | Gentle in-app reschedule prompts (already built in v1.0) handle this. |
| **Firestore as primary offline store (replace IndexedDB entirely)** | Consolidate to one persistence layer | Firestore's offline cache is opaque — you cannot query it directly with arbitrary Dexie-style queries. All offline queries must go through Firestore SDK, which has different performance characteristics and no reactive hooks compatible with the existing React component tree. | Keep both. Firestore offline cache is a sync buffer; Dexie is the app's queryable store. |
| **Email/password auth** | Users expect account options | Google Sign-In is sufficient for a personal app and eliminates password management, reset flows, and email verification. Adding more auth providers is post-MVP scope. | Google Sign-In only for v1.1. |

---

## Feature Dependencies

```
Google Sign-In (Firebase Auth)
    └──required before──> Firestore user-scoped writes
                              └──required before──> Real-time cross-device sync
                              └──required before──> Security rules enforcement

Firestore offline persistence (persistentLocalCache)
    └──enables──> Offline writes queue
    └──enables──> Offline reads from cache
    └──requires separate IndexedDB namespace from──> Dexie.js (different DB names, no conflict)

Firebase Hosting deploy
    └──independent from──> Auth and Firestore (can deploy without auth configured)
    └──requires──> `firebase.json` SPA rewrite rule (all paths → /index.html)
    └──requires──> `dist/` as public directory (Vite build output)

Dexie.js (existing) ──is UI source for──> all React components via useLiveQuery
    └──must remain authoritative for──> reactive UI updates
    └──Firestore onSnapshot writes INTO Dexie to preserve this

Data migration (one-time, on first sign-in)
    └──requires──> Google Sign-In completed
    └──requires──> Dexie readable (already exists)
    └──requires──> Firestore writable (user path must exist)
    └──must run before──> real-time sync listener starts (avoid duplicate writes)
```

### Dependency Notes

- **Auth before Firestore writes:** Firestore security rules reject unauthenticated writes. Auth must complete before any sync attempt.
- **Migration before sync listener:** Starting the Firestore `onSnapshot` listener before migration completes could cause the listener to write empty state back into Dexie, overwriting local data. Migration must be atomic and idempotent.
- **Firestore + Dexie coexistence:** Both use IndexedDB under the hood but open different named databases. Firebase uses `firestore/[project-id]/[database-id]` naming; Dexie uses the database name you specify (`taskbreaker-db` or similar). No collision — confirmed by Firebase GitHub issues showing developers use both simultaneously.
- **Multi-tab manager:** Required when `persistentLocalCache()` is used with multiple browser tabs. Without it, the second tab throws an `FAILED_PRECONDITION` error.

---

## MVP Definition

### Launch With (v1.1)

Minimum to achieve the milestone goal: "deploy TaskBreaker to Firebase and add real-time cross-device sync."

- [ ] **Firebase project setup** — Firestore, Auth (Google provider enabled), Hosting configured
- [ ] **Google sign-in** — popup on desktop, redirect on mobile/PWA, persistent session
- [ ] **Sign-out** — explicit sign-out clears auth state
- [ ] **Firestore user-scoped data model** — `/users/{uid}/tasks/{taskId}` with matching security rules
- [ ] **Offline persistence** — `initializeFirestore` with `persistentLocalCache` + `persistentMultipleTabManager`
- [ ] **Sync layer** — Firestore `onSnapshot` writes to Dexie; existing `useLiveQuery` drives all UI
- [ ] **One-time migration** — on first sign-in, upload existing Dexie tasks to Firestore
- [ ] **Firebase Hosting deploy** — `firebase.json` with SPA rewrites, `dist/` as public dir
- [ ] **Data safety** — `firebase deploy --only hosting` never touches Firestore data (verified by Firebase's separation of services)

### Add After Validation (v1.x)

- [ ] **Offline sync status indicator** — show pending writes badge; low effort, high trust value
- [ ] **Auth error handling UX** — graceful messages for popup blocked, network failure, sign-in cancelled
- [ ] **Sign-in gate UI** — landing page / sign-in prompt for unauthenticated users

### Future Consideration (v2+)

- [ ] **Additional auth providers** — only if user demands it; Google is sufficient for personal use
- [ ] **Selective sync** — sync only specific date ranges to reduce Firestore reads (cost optimization at scale)
- [ ] **Shared task lists** — multi-user collaboration; explicitly out-of-scope for personal-first approach
- [ ] **Export/import** — JSON backup; useful if moving away from Firebase

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Google sign-in | HIGH | LOW | P1 |
| Firestore user-scoped writes | HIGH | LOW | P1 |
| Firestore security rules | HIGH | LOW | P1 |
| Offline persistence (`persistentLocalCache`) | HIGH | LOW | P1 |
| Firebase Hosting deploy | HIGH | LOW | P1 |
| SPA rewrite rules (`firebase.json`) | HIGH | LOW | P1 |
| One-time Dexie→Firestore migration | HIGH | HIGH | P1 |
| Sync layer (Firestore → Dexie via onSnapshot) | HIGH | HIGH | P1 |
| Multi-tab safety (`persistentMultipleTabManager`) | MEDIUM | LOW | P1 |
| Popup + redirect sign-in fallback | MEDIUM | MEDIUM | P1 |
| Offline sync status indicator | MEDIUM | LOW | P2 |
| Auth error handling UX | MEDIUM | LOW | P2 |
| Sign-in gate / landing page | LOW | LOW | P2 |

**Priority key:**
- P1: Must have for v1.1 milestone completion
- P2: Should have; add when core sync is working
- P3: Nice to have; future consideration

---

## Existing Architecture Dependencies (Dexie.js)

This milestone is layered onto existing Dexie.js infrastructure. These are the constraints that shape every feature decision above.

| Existing Piece | Constraint It Creates | Resolution |
|----------------|----------------------|------------|
| `useLiveQuery` from `dexie-react-hooks` drives all UI re-renders | Firestore cannot replace Dexie as UI source — all 62 files use this hook | Firestore `onSnapshot` writes into Dexie; Dexie remains UI source |
| Dexie schema has `tasks`, `subtasks` tables with defined fields | Firestore documents must match or be mappable to Dexie schema | Map 1:1: each Dexie row becomes one Firestore document under `/users/{uid}/tasks/{taskId}` |
| Dexie uses named IndexedDB database (`taskbreaker-db` or similar) | Firestore uses its own IndexedDB namespace (`firestore/...`) | No conflict — separate database names, verified by Firebase SDK behavior |
| Offline tasks exist in Dexie before v1.1 | First sign-in must migrate these to Firestore without data loss | One-time migration function: read all Dexie tasks, batch write to Firestore, set migration flag |
| Per-cell reactive queries in each `DayCell` component | Sync writes to Dexie trigger automatic re-renders via `useLiveQuery` | This is the desired behavior — no changes to UI components needed |

---

## Firebase Spark Plan Considerations

The project runs on the Firebase Spark (free) plan. These limits are relevant for feature design.

| Resource | Spark Free Limit | Expected Usage (Single User) | Headroom |
|----------|-----------------|------------------------------|----------|
| Firestore reads | 50,000 / day | ~100-500 (initial load + sync) | Substantial |
| Firestore writes | 20,000 / day | ~50-200 (task CRUD) | Substantial |
| Firestore deletes | 20,000 / day | ~10-50 | Substantial |
| Firestore stored data | 1 GB | ~1 MB (text tasks) | Substantial |
| Hosting transfer | 10 GB / month | ~5-50 MB | Substantial |
| Hosting storage | 1 GB | ~5 MB (built assets) | Substantial |

**Assessment:** A single-user personal app will stay well within Spark plan limits. Real-time listeners are billed as reads only when data changes (not per-second polling). No cost risk for intended usage.

---

## Sources

- [Firebase Auth: Google Sign-In for Web](https://firebase.google.com/docs/auth/web/google-signin) — Official docs, popup vs redirect methods
- [Firebase: Best practices for signInWithRedirect (third-party storage blocking)](https://firebase.google.com/docs/auth/web/redirect-best-practices) — Chrome M115+, Firefox, Safari compatibility
- [Firestore: Access data offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — `persistentLocalCache`, `persistentMultipleTabManager`
- [Firebase: Use Firebase in a PWA](https://firebase.google.com/docs/web/pwa) — Service worker + Firebase integration
- [Firebase Hosting: Configure behavior](https://firebase.google.com/docs/hosting/full-config) — SPA rewrite rules, `firebase.json`
- [Firebase Hosting: Quickstart](https://firebase.google.com/docs/hosting/quickstart) — `dist/` as public dir for Vite apps
- [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) — Spark plan limits
- [Firestore quotas](https://firebase.google.com/docs/firestore/quotas) — Daily read/write limits
- [Firebase: Security rules and Authentication](https://firebase.google.com/docs/rules/rules-and-auth) — `request.auth.uid` scoping pattern
- [Firebase: Best practices for anonymous authentication](https://firebase.blog/posts/2023/07/best-practices-for-anonymous-authentication/) — Why not to use anonymous auth for this case
- [Firestore multi-tab deprecation (FlutterFire issue #12034)](https://github.com/firebase/flutterfire/issues/12034) — `enableMultiTabIndexedDbPersistence` deprecated; use `persistentMultipleTabManager` instead
- [Dexie.js: useLiveQuery](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) — Existing reactive hook dependency
- [DEV Community: Enabling offline capabilities with Firebase IndexedDB persistence](https://dev.to/itselftools/enabling-offline-capabilities-in-firebase-with-indexeddb-persistence-5c8d) — PWA + Firestore offline pattern
- [SystemsArchitect: Firestore conflict resolution](https://www.systemsarchitect.io/services/google-firestore/reliability-best-practices/pt/implement-offline-persistence-with-conflict-resolu) — Last-write-wins is default; custom resolution not needed for single-user

---
*Feature research for: Firebase Auth + Firestore Sync + Firebase Hosting (TaskBreaker v1.1)*
*Researched: 2026-03-01*
