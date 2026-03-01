# Project Research Summary

**Project:** TaskBreaker v1.1 — Firebase Deploy & Real-Time Sync
**Domain:** Firebase Auth + Firestore sync + Firebase Hosting layered onto existing React + Vite + Dexie.js PWA
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

This milestone adds Firebase Hosting deployment, Google Sign-In via Firebase Auth, and real-time cross-device Firestore sync to the existing TaskBreaker v1.0 PWA. The core insight from research is that this is an **additive integration, not a rewrite**. The existing codebase (62 files, 6,945 LOC) uses Dexie.js with `useLiveQuery` as the reactive UI source and must remain unchanged. The correct architecture treats Dexie as the local source of truth and Firestore as a cloud sync bus: `onSnapshot` writes remote changes into Dexie, and Dexie mutations are mirrored to Firestore via thin wrapper functions. This preserves all existing component code and reactive query patterns while gaining cloud sync.

The recommended stack additions are minimal: `firebase@^12.10.0` (modular, tree-shakeable SDK) and `firebase-tools@^15.8.0` (dev-only CLI for deployment). No third-party wrappers like `reactfire` are needed or advisable — that library is unmaintained and unverified for React 19. The Firebase SDK's modular import pattern (`firebase/app`, `firebase/auth`, `firebase/firestore` only) keeps bundle impact small. The implementation introduces 7 new files (`src/firebase/config.ts`, `auth.ts`, `sync.ts`, `src/hooks/useAuth.ts`, `useSyncEngine.ts`, `src/components/auth/AuthGate.tsx`, `SignInButton.tsx`) and minimal changes to `App.tsx` only.

The critical risks all concentrate at the architecture design decision point. The two make-or-break choices are: (1) resolving the Dexie integer ID vs. Firestore string ID mismatch before writing any sync code — getting this wrong breaks all subtask foreign key relationships across devices, and (2) committing to Dexie as the single source of truth rather than running both Firestore's IndexedDB cache and Dexie simultaneously, which creates a two-cache conflict that silently diverges and corrupts on `Clear site data`. These decisions must be locked in during Phase 1 (Firebase setup) and cannot be revisited cheaply later.

---

## Key Findings

### Recommended Stack

The existing stack (React 19, Vite 5, TypeScript 5.9, Dexie 4.3, vite-plugin-pwa 1.2, Tailwind 4) is fully compatible with Firebase 12 and requires no changes. Firebase v12.10.0 (released Feb 27 2026) is the current stable release. The modular API eliminates tree-shaking concerns — only the `firebase/app`, `firebase/auth`, and `firebase/firestore` subpackages need to be imported. Firebase Auth and Firestore use their own IndexedDB namespaces separate from Dexie's named database, so there is no storage collision.

**Core technologies:**
- `firebase@^12.10.0`: SDK providing Auth, Firestore, and app init — modular imports keep bundle cost low; framework-agnostic
- `firebase-tools@^15.8.0`: CLI for `firebase deploy --only hosting`; dev dependency, never shipped to browser
- `initializeFirestore` with `persistentMultipleTabManager`: required for multi-tab PWA support; must be called before any other Firestore usage to configure the local cache
- `signInWithPopup` (desktop) + `signInWithRedirect` (mobile/PWA): both required due to iOS Safari and Chrome M115+ third-party cookie restrictions

**What NOT to add:** `reactfire` (unmaintained, React 19 compatibility unverified), `firebase/analytics` (~40KB, no value for personal tool), `firebase/compat/*` (disables tree-shaking), `firebase/firestore/lite` (removes `onSnapshot`, which is the core feature).

### Expected Features

**Must have (P1 — v1.1 launch blockers):**
- Google sign-in — popup on desktop, redirect on mobile/PWA; persistent session via `browserLocalPersistence`
- Sign-out — explicit user action clears auth state
- Firestore user-scoped data model — `/users/{uid}/tasks/{taskId}` with security rules matching `request.auth.uid`
- Offline persistence — Firestore queues pending writes when offline, flushes on reconnect automatically
- Real-time cross-device sync — `onSnapshot` listener propagates changes within ~1 second
- One-time Dexie-to-Firestore migration — on first sign-in, existing local tasks are uploaded without data loss
- Firebase Hosting deploy — HTTPS, SPA rewrites, correct cache headers for PWA service worker
- Multi-tab safety — `persistentMultipleTabManager` prevents `FAILED_PRECONDITION` errors

**Should have (P2 — add after core sync works):**
- Offline sync status indicator — `metadata.hasPendingWrites` and `metadata.fromCache` flags are readable at no cost; shows "synced" vs. "saving"
- Auth error handling UX — graceful messages for popup blocked, network failure, sign-in cancelled
- Sign-in gate UI — landing page with sign-in prompt for unauthenticated users

**Defer (v2+):**
- Additional auth providers — Google Sign-In alone is sufficient for a personal app
- Selective date-range sync — cost optimization only relevant at higher task volumes
- Shared task lists and multi-user collaboration — out of scope for personal-first approach
- Export/import JSON backup

**Anti-features to explicitly reject:**
- Anonymous auth — adds account-upgrade complexity with no benefit over Dexie-only mode
- Firestore as UI source (replacing Dexie) — would require rewriting all 62 files
- Custom conflict resolution — last-write-wins via `updatedAt` is correct for single-user; CRDT adds weeks of complexity for zero benefit
- Firebase Cloud Messaging push notifications — intrusive for ADHD users; in-app prompts already exist

### Architecture Approach

The architecture is a layered addition on top of unchanged existing code. All React components, `useLiveQuery` hooks, and Dexie schema remain untouched. A new `src/firebase/` module isolates all SDK calls so no component imports Firebase directly. A `useSyncEngine` hook orchestrates bidirectional sync: outbound writes go to Dexie first (instant), then Firestore asynchronously; inbound changes arrive via `onSnapshot`, pass through a `hasPendingWrites` guard (to avoid echo loops) and an `updatedAt` last-write-wins check, then write into Dexie, triggering existing `useLiveQuery` re-renders automatically.

**Major components:**
1. `src/firebase/config.ts` — Firebase app init, `initializeFirestore` with `persistentLocalCache` + `persistentMultipleTabManager`, `getAuth`
2. `src/firebase/auth.ts` — `signInWithPopup`/`signInWithRedirect` helpers, `signOut`
3. `src/firebase/sync.ts` — Firestore path helpers, type converters (Dexie `Task` to/from `FirestoreTask`), mutation wrappers (`syncAddTask`, `syncUpdateTask`, `syncDeleteTask`)
4. `src/hooks/useAuth.ts` — `AuthProvider` context + `useAuth` hook; exposes `{ user, loading, signIn, signOut }`
5. `src/hooks/useSyncEngine.ts` — `onSnapshot` subscription lifecycle, inbound change handler, migration trigger on first sign-in
6. `src/components/auth/AuthGate.tsx` — renders loading spinner, login screen, or app depending on auth state
7. `App.tsx` (modified only) — wraps existing JSX with `AuthProvider` and `AuthGate`, calls `useSyncEngine(user)`

**ID mapping decision (must be made in Phase 1):** Use `String(task.id)` as the Firestore document ID. No Dexie schema migration required. Dexie integer IDs remain the local primary key; sync wrappers convert at the boundary with `String(id)` / `Number(doc.id)`. This is the zero-risk path.

**Data flow:**
```
Write path:  User action → Dexie (immediate) → Firestore (async, when online)
Read path:   UI ← useLiveQuery ← Dexie (always)
Sync path:   Firestore onSnapshot → hasPendingWrites guard → LWW check → Dexie.put → useLiveQuery fires
```

### Critical Pitfalls

1. **Integer-to-string ID mismatch breaks subtask foreign keys across devices** — Design the ID mapping strategy before writing any sync code. Use `String(task.id)` as Firestore doc ID; parse `Number(doc.id)` on inbound. Never use Firestore's `addDoc` for syncing existing records — use `setDoc` with a stable pre-determined ID. Failing to do this causes subtasks to become orphaned on the second device.

2. **Auth state is async — causes flash of sign-in screen and permission errors on startup** — Always use `onAuthStateChanged` with a `loading` state; render a spinner until `authLoading === false`. Never start Firestore listeners until `user !== null`. Never read `auth.currentUser` synchronously at startup — it always returns `null` before the async check completes.

3. **`signInWithPopup` fails silently in iOS Safari PWA standalone mode** — Use `signInWithRedirect` on mobile. Detect mobile with `isMobile` check (already available in the codebase). Verify `authDomain` in Firebase config exactly matches the deployed domain. Test explicitly on real iOS device in PWA standalone mode before marking auth complete.

4. **Firestore's IndexedDB persistence conflicts with Dexie as source of truth** — Either disable Firestore's own persistence (`memoryLocalCache`) and rely entirely on Dexie, or use `persistentLocalCache` as a Firestore-internal write buffer while Dexie remains the sole read source. Running both as competing read sources causes cache divergence and post-`Clear site data` corruption (confirmed SDK issue #8593). The architecture choice must be documented and committed to before any sync code is written.

5. **Open security rules expose all data before first production deploy** — Write the production security rules (`/users/{uid}/{document=**}` scoped to `request.auth.uid`) before or simultaneously with the first Firebase Hosting deploy. The `firebaseConfig` is publicly visible in the deployed JS bundle, so an open ruleset means anyone can read or delete all data.

6. **Firestore reconnect billing: 30-minute offline gap triggers full-collection re-read** — With 500 tasks, reconnecting after 30+ minutes costs 500 reads. Mitigate by: unsubscribing `onSnapshot` on `visibilitychange` (app backgrounded), resubscribing with a `where('updatedAt', '>', lastSyncTimestamp)` delta query on foreground resume. Track `lastSyncTimestamp` in Dexie.

7. **`onSnapshot` unsubscribe omission causes memory leaks and zombie read billing** — Every `onSnapshot` call must return the unsubscribe function from its `useEffect` cleanup. Centralizing all listeners in `useSyncEngine` makes this easy to enforce and audit.

---

## Implications for Roadmap

Based on the hard dependency chain discovered in research, the implementation must follow a strict sequential order. Auth must precede Firestore (security rules reject unauthenticated writes). The data model and ID strategy must be decided before any sync code is written. Migration must complete before the sync listener starts (or the listener could overwrite local data with empty state from Firestore on a fresh device).

### Phase 1: Firebase Project Setup and Configuration

**Rationale:** Everything else depends on having a Firebase project with credentials. This phase has no code output but unblocks all subsequent phases. The billing architecture (Spark vs. GCP trial) must also be resolved here to avoid the trial-expiry disruption pitfall. The ID mapping decision (Option A: `String(task.id)`) should be confirmed as a design checkpoint at the end of this phase.
**Delivers:** Firebase project with Firestore (Native mode) and Google Auth enabled; `.env.local` with `VITE_FIREBASE_*` vars; `firebase.json` and `.firebaserc` skeleton committed; Firestore security rules deployed (not left open); billing plan confirmed (Spark vs. GCP trial); `npm install firebase firebase-tools` complete; ID mapping strategy documented.
**Addresses:** Google sign-in (setup prerequisite), Firebase Hosting deploy (config prerequisite), HTTPS requirement
**Avoids:** Open security rules (Pitfall 7), GCP trial/Spark confusion (Pitfall 8 from PITFALLS.md)

### Phase 2: Firebase Auth Layer

**Rationale:** Auth must be working and confirmed before any Firestore writes are attempted. The `user.uid` is the key for all Firestore paths. The auth loading state and iOS PWA sign-in failure must both be addressed and verified here — auth is not complete until tested on real iOS hardware in PWA standalone mode.
**Delivers:** `src/firebase/config.ts`, `src/firebase/auth.ts`, `src/hooks/useAuth.ts`, `src/components/auth/AuthGate.tsx`, `src/components/auth/SignInButton.tsx`; `App.tsx` wrapped with `AuthProvider`; sign-in and sign-out working on desktop and mobile; auth loading state renders spinner with no sign-in flash for already-authenticated users.
**Uses:** `firebase/auth`, `signInWithPopup`, `signInWithRedirect`, `onAuthStateChanged`, `GoogleAuthProvider`
**Implements:** Auth Context pattern (React Context + `onAuthStateChanged` from ARCHITECTURE.md)
**Avoids:** Auth state race (Pitfall 2), iOS Safari popup failure (Pitfall 3)

### Phase 3: Firestore Sync Engine

**Rationale:** The most complex phase. Requires auth (for `user.uid`) and must open with a confirmation of the ID mapping strategy (Pitfall 1) before writing a line. Inbound and outbound sync paths, the `hasPendingWrites` echo guard, the `updatedAt` last-write-wins conflict resolution, and the one-time Dexie-to-Firestore migration all belong here. Migration is included in this phase because it must run before the `onSnapshot` listener starts for the first time — separating them creates a sequencing failure risk.
**Delivers:** `src/firebase/sync.ts` (type converters, path helpers, `syncAddTask`/`syncUpdateTask`/`syncDeleteTask` wrappers); `src/hooks/useSyncEngine.ts` (bidirectional sync, `onSnapshot` subscription, migration trigger); `App.tsx` calling `useSyncEngine(user)`; `firestore.indexes.json` for date and delta-sync queries; real-time sync verified on two devices including subtask parent/child relationships.
**Uses:** `firebase/firestore`, `onSnapshot`, `setDoc`, `updateDoc`, `deleteDoc`, `persistentMultipleTabManager`, `serverTimestamp`
**Implements:** Dexie-as-cache pattern, per-user subcollection data model, last-write-wins conflict resolution (Patterns 1, 2, 4, 5 from ARCHITECTURE.md)
**Avoids:** Integer/string ID mismatch (Pitfall 1), Firestore cache vs. Dexie conflict (Pitfall 4), full-document write amplification (PITFALLS.md Pitfall 9), unsubscribe memory leak (Pitfall 7)

### Phase 4: Firebase Hosting Deployment

**Rationale:** Hosting can technically be configured independently of Auth/Firestore, but is most meaningful as the "ship it" moment after sync is proven working locally. The service worker cache header configuration (no-cache for `sw.js` and `index.html`, immutable for hashed assets) must be in place before the first real user deploy to avoid the PWA update propagation failure.
**Delivers:** `firebase.json` with SPA rewrites and correct cache headers; `.firebaserc` with project alias; `npm run deploy` script (`npm run build && firebase deploy --only hosting`); app accessible at `[project-id].web.app` over HTTPS; PWA installable from Firebase Hosting URL; deploy confirmed not to touch Firestore data.
**Avoids:** vite-plugin-pwa service worker conflict with Firebase service worker (Pitfall 4 from PITFALLS.md), CDN caching of `index.html` blocking PWA updates (Anti-Pattern 4 from ARCHITECTURE.md)

### Phase 5: Polish and UX Hardening

**Rationale:** Core sync is now working. Add the P2 features that meaningfully improve trust and reliability without changing the sync architecture. The delta sync strategy (visibility-change unsubscribe + `lastSyncTimestamp` query on foreground resume) belongs here as a billing safeguard once baseline usage patterns are observable.
**Delivers:** Offline sync status indicator using `metadata.hasPendingWrites` and `metadata.fromCache`; auth error handling UX (popup blocked, network failure messages); offline/online banner using `navigator.onLine`; delta sync with `lastSyncTimestamp` (background/foreground lifecycle management to contain Firestore billing at scale).
**Addresses:** P2 features from FEATURES.md — offline sync status indicator, auth error handling UX, sign-in gate UI
**Avoids:** Reconnect billing spike (Pitfall 6), UX pitfalls from PITFALLS.md (no sync feedback, blocking UI on write)

### Phase Ordering Rationale

- **Sequential dependency chain:** Project setup → Auth → Sync → Hosting is a hard dependency chain; no phase can be reordered without creating either a blocked implementation or a security gap.
- **ID strategy is a Phase 1/2 boundary decision:** The ID mapping approach must be confirmed before Phase 3. Treating it as a design checkpoint at the end of Phase 1 ensures it cannot be skipped.
- **Migration inside Phase 3:** The one-time Dexie-to-Firestore migration is tightly coupled to sync engine initialization. Keeping it in the same phase prevents a sequencing error where the listener fires before migration completes, potentially overwriting local data.
- **Hosting last among core phases:** Firebase Hosting serves the compiled app. Deploying before sync works means deploying an incomplete product to a public URL. Phase 4 is the intentional "ship it" gate.
- **P2 features in their own phase:** The sync status indicator, error handling UX, and delta sync are low-risk additions that do not touch the sync architecture. Isolating them prevents scope creep in the critical Phase 3.

### Research Flags

Phases requiring deeper research or implementation-level spiking:

- **Phase 3 (Sync Engine — migration function):** The one-time idempotent Dexie-to-Firestore migration has no established Firebase template. It must be both safe to run multiple times (in case of partial failure) and guaranteed to complete before the `onSnapshot` listener starts. Recommend a focused spike task at the start of Phase 3 before writing any production sync code.
- **Phase 3 (ID mapping — validation):** Option A (`String(task.id)`) is the recommendation, but the PITFALLS research identifies subtask `parentId` foreign key propagation as a known failure mode. Validate with a small prototype (create a task tree locally, sync to Firestore, verify subtask hierarchy on a second device) before committing the full sync layer.
- **Phase 2 (iOS PWA auth — hardware gate):** iOS Safari standalone mode sign-in is a documented failure mode that no emulator can reliably reproduce. Phase 2 is not complete until tested on an actual iOS device with the PWA installed in standalone mode.

Phases with well-documented patterns (standard implementation, no additional research needed):

- **Phase 1 (Firebase project setup):** Entirely console-driven with comprehensive official documentation. No code output, no research uncertainty.
- **Phase 4 (Hosting deploy):** `firebase.json` configuration is thoroughly documented, verified HIGH confidence. The `firebase init hosting` CLI wizard handles the basics; only the cache header additions require manual editing.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against Firebase JS SDK release notes (v12.10.0 Feb 27 2026), official Firebase docs, and reactfire GitHub repo. Version compatibility confirmed for React 19, Vite 5, TypeScript 5.9, Dexie 4.3. |
| Features | HIGH | Firebase official docs are the authoritative source for all features researched. Spark plan limits verified against Firebase pricing docs. Feature dependency chain verified against Firebase SDK behavior. |
| Architecture | HIGH | Core patterns (Dexie-as-cache, Firestore-as-sync-transport, per-user subcollection, auth context) all verified against official Firebase docs and cloud.google.com. `persistentMultipleTabManager` API verified against Firebase JS API reference. |
| Pitfalls | HIGH | All pitfalls verified against official Firebase docs, confirmed GitHub issues (SDK #8593 cache corruption, #6716 iOS Safari, vite-plugin-pwa #777 service worker conflict), and Firebase billing documentation. |

**Overall confidence:** HIGH

### Gaps to Address

- **`firebase-tools` version uncertainty:** v15.8.0 cited from WebSearch (March 2026), not directly verified against the npm registry. Use `npm install -D firebase-tools@latest` and pin the resolved version. Low risk — CLI version does not affect app behavior.

- **`memoryLocalCache` vs. `persistentLocalCache` for Firestore:** PITFALLS.md recommends disabling Firestore's own persistence (`memoryLocalCache`) while STACK.md and ARCHITECTURE.md recommend `persistentLocalCache` + `persistentMultipleTabManager` as a secondary write buffer. The contradiction is intentional — both are valid. Recommended resolution: use `persistentLocalCache` with `persistentMultipleTabManager` (as STACK/ARCHITECTURE recommend) because it lets Firestore queue offline writes independently. The PITFALLS concern (two caches diverging) is mitigated by Dexie always being the read source and Firestore persistence being write-only from the app's perspective. Lock this decision in Phase 1 and document it as an architecture decision record (ADR).

- **Delta sync composite index:** The `lastSyncTimestamp` delta query (`where('updatedAt', '>', lastSyncTimestamp)`) requires a Firestore composite index. Create `firestore.indexes.json` in Phase 3 to include this index even though the delta query itself is implemented in Phase 5.

- **Dexie mutation call site audit:** Components currently call `db.tasks.add/put/delete` directly. Replacing these with `syncAddTask/syncUpdateTask/syncDeleteTask` wrappers requires identifying all mutation call sites. Grep for `db.tasks.add`, `db.tasks.put`, `db.tasks.delete`, `db.tasks.update` before planning Phase 3 execution to scope the work accurately.

---

## Sources

### Primary (HIGH confidence)
- Firebase JavaScript SDK Release Notes — https://firebase.google.com/support/release-notes/js — v12.10.0 confirmed, v12 requirements (Node 20+, ES2020)
- Firebase Firestore offline persistence — https://firebase.google.com/docs/firestore/manage-data/enable-offline — `persistentLocalCache`, `persistentMultipleTabManager`
- Firebase Auth: Best practices for signInWithRedirect — https://firebase.google.com/docs/auth/web/redirect-best-practices — Chrome M115+, iOS Safari, PWA requirements
- Firebase Hosting full configuration — https://firebase.google.com/docs/hosting/full-config — SPA rewrites, cache headers
- Firebase Auth: Google Sign-In for Web — https://firebase.google.com/docs/auth/web/google-signin — popup vs redirect patterns
- Firestore: Access data offline — https://cloud.google.com/firestore/docs/manage-data/enable-offline — confirmed against cloud.google.com
- Firebase: Use Firebase in a PWA — https://firebase.google.com/docs/web/pwa — service worker integration
- Firestore: Security rules per-user permissions — https://firebase.google.com/docs/rules/rules-and-auth
- Firestore data model — https://firebase.google.com/docs/firestore/data-model — subcollection pattern
- Firestore onSnapshot metadata — https://firebase.google.com/docs/firestore/query-data/listen — `hasPendingWrites`, `fromCache`
- Firebase pricing: Spark plan — https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firebase: Avoid surprise bills — https://firebase.google.com/docs/projects/billing/avoid-surprise-bills
- Firestore: Understand billing (reconnect reads) — https://firebase.google.com/docs/firestore/pricing

### Secondary (MEDIUM confidence)
- reactfire GitHub — https://github.com/FirebaseExtended/reactfire — confirmed experimental, v4.2.3 June 2023, not an official Firebase product
- Firebase Auth state persistence — https://firebase.google.com/docs/auth/web/auth-state-persistence — async loading behavior
- Firebase Hosting quickstart — https://firebase.google.com/docs/hosting/quickstart — `dist/` as public dir for Vite apps
- Firebase: Get started with Free Trial credits — https://firebase.blog/posts/2024/11/claim-300-to-get-started/ — GCP trial vs. Spark plan clarification
- Firebase Enable Firestore caching (multi-tab code) — https://puf.io/posts/enable-firestore-caching-on-web/
- Firebase Security Rules patterns — https://medium.com/firebase-developers/patterns-for-security-with-firebase-per-user-permissions-for-cloud-firestore-be67ee8edc4a

### Tertiary (confirmed GitHub issues — HIGH confidence for documented bugs)
- firebase/firebase-js-sdk #8593 — Firestore IndexedDB cache corrupted after clear site data
- firebase/firebase-js-sdk #6716 — Safari 16.1+ signInWithPopup failure in PWA standalone mode
- firebase/firebase-js-sdk #2755 — Offline listener reconnect behavior
- vite-pwa/vite-plugin-pwa #777 — Second service worker causes constant reload loop

---

*Research completed: 2026-03-01*
*Ready for roadmap: yes*
