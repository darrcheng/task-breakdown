# Pitfalls Research

**Domain:** Adding Firebase (Firestore sync, Google Auth, Hosting) to an existing React PWA with Dexie.js/IndexedDB
**Researched:** 2026-03-01
**Confidence:** HIGH — verified against official Firebase docs, GitHub issue tracker, and multiple independent sources

---

## Critical Pitfalls

### Pitfall 1: Integer ID → String ID Mismatch Breaks the Entire Data Model

**What goes wrong:**
Dexie.js uses auto-incrementing integer IDs (`++id`). The current schema has `tasks.id: number`, `tasks.parentId: number`, `tasks.categoryId: number`. Firestore uses string document IDs (e.g., `"abc123xyz"`). When syncing, if you naively map Dexie's integer IDs to Firestore document IDs, every foreign key relationship (`parentId`, `categoryId`) breaks — because the new Firestore record has a string ID but all existing subtasks still reference the old integer `parentId`.

**Why it happens:**
Developers see IndexedDB `++id` (auto-increment) as equivalent to a database primary key and assume Firestore will accept integers as document IDs. Firestore doesn't auto-increment — you must supply a string ID or call `addDoc` which generates one. The mismatch only becomes obvious when querying subtasks by `parentId`.

**How to avoid:**
Design the sync layer ID strategy before writing a single line of Firebase code:
- Option A (Recommended): Add a `firestoreId: string` field to each Dexie record. Use `firestoreId` as the Firestore document ID. Keep Dexie's integer `id` as the local-only primary key. All cross-device lookups use `firestoreId`; Dexie queries use integer `id`. Write a Dexie schema migration (version 4) to add the `firestoreId` index.
- Option B: Generate UUIDs client-side (`crypto.randomUUID()`) and use them as both the Dexie primary key (replacing `++id`) and the Firestore document ID. Requires a one-time migration of all existing data.
- Never use Firestore's `addDoc` for syncing existing local records — use `setDoc` with a stable, pre-determined ID.

**Warning signs:**
- Subtask query by `parentId` returns empty after sync
- Categories show as "Unknown" on second device
- Console errors: `Invalid document ID` or missing foreign key references

**Phase to address:** Firebase setup phase — before writing any Firestore sync code.

---

### Pitfall 2: Auth State Is Async, Causing a Flash-of-Unauthenticated-Content

**What goes wrong:**
`onAuthStateChanged` fires asynchronously after app load. During the gap (typically 200-800ms), `currentUser` is `null`. If you render "Sign In" screen whenever `user === null`, the app flashes the sign-in screen on every page load — even for already-authenticated users. Worse: if you start a Firestore sync based on auth state, it may fire before auth resolves and crash with a permission-denied error.

**Why it happens:**
Firebase Auth needs to check persisted auth tokens in IndexedDB or localStorage, which is async. The pattern `const user = auth.currentUser` checked synchronously immediately after `initializeApp` always returns `null`. The search results confirm this fires twice — once with null, then again with the user object.

**How to avoid:**
Introduce a loading state that blocks rendering until auth settles:
```typescript
const [user, setUser] = useState<User | null>(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser);
    setAuthLoading(false);
  });
  return unsubscribe;
}, []);

if (authLoading) return <AppLoadingSpinner />;
```
Do not start any Firestore listeners until `authLoading === false` and `user !== null`.

**Warning signs:**
- Brief sign-in screen flash on reload for signed-in users
- Firestore permission-denied errors in console on startup
- `onAuthStateChanged` fires twice in logs

**Phase to address:** Google Auth integration phase.

---

### Pitfall 3: signInWithPopup Fails in PWA Standalone Mode on iOS Safari

**What goes wrong:**
When the app is installed as a PWA and opened in iOS Safari standalone mode, `signInWithPopup` is blocked. Safari's ITP (Intelligent Tracking Prevention) blocks the OAuth popup from communicating back to the opener window. The sign-in flow silently fails or throws a cross-origin error. On iOS 16.4+, this is a documented Firebase SDK issue (#6716 on GitHub).

**Why it happens:**
iOS Safari in standalone/PWA mode has strict cross-origin restrictions. `signInWithPopup` relies on a popup window that postMessages back to the opener — this mechanism is blocked. `signInWithRedirect` also has problems in PWA mode because navigation away from the PWA scope can exit standalone mode.

**How to avoid:**
Use `signInWithRedirect` with the Firebase Auth persistence set to `LOCAL`, and configure the `firebaseapp.com/__/auth/handler` redirect. Verify that the `authDomain` in the Firebase config matches the actual deployed domain (e.g., `yourdomain.web.app`). Test sign-in flow explicitly in iOS Safari PWA standalone mode before shipping. As a fallback, consider adding a non-standalone sign-in path that opens the browser.

Official Firebase docs specifically address this: [Best practices for signInWithRedirect on browsers that block third-party storage access](https://firebase.google.com/docs/auth/web/redirect-best-practices).

**Warning signs:**
- Sign-in button appears to do nothing on mobile
- Cross-origin error in Safari developer console
- Sign-in works in browser but not in installed PWA

**Phase to address:** Google Auth integration phase — must test on iOS standalone before shipping.

---

### Pitfall 4: vite-plugin-pwa and Firebase Service Worker Conflict

**What goes wrong:**
The existing `vite-plugin-pwa` generates a Workbox service worker that precaches all static assets. If Firebase Cloud Messaging (FCM) is added later, or if Firebase's `firebase-messaging-sw.js` is introduced, the app enters an infinite reload loop. The root cause is that only one service worker can be active per origin. Competing registrations cause constant update-then-reload cycles.

**Why it happens:**
vite-plugin-pwa registers its generated service worker at the root scope. A separately registered `firebase-messaging-sw.js` tries to claim the same scope. The browser sees two service workers fighting for control and triggers update cycles. GitHub issue #777 on vite-pwa/vite-plugin-pwa documents the constant reload behavior.

**How to avoid:**
For this milestone, Firebase Messaging is out of scope — do not introduce `firebase-messaging-sw.js`. If FCM is added in a future milestone, merge Firebase messaging handling into the existing Workbox service worker using Workbox's `messagingBackgroundHandler` inside the custom service worker. Do not register a second service worker file.

Additionally, configure Firebase Hosting to serve `sw.js` with `Cache-Control: no-cache` so new service worker versions are picked up immediately:
```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "/sw.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

**Warning signs:**
- App reloads immediately after updating to a new deploy
- Service worker update loop visible in Chrome DevTools > Application > Service Workers
- Old app version persists despite new deployment

**Phase to address:** Firebase Hosting deployment phase.

---

### Pitfall 5: Firestore's Built-in Offline Cache Conflicts with Dexie as the Source of Truth

**What goes wrong:**
Firestore SDK has its own IndexedDB persistence layer (`enableIndexedDbPersistence` / `persistentLocalCache`). If you enable both Firestore's offline cache AND keep Dexie as the primary data store, you have two IndexedDB databases storing the same data with no defined authority. After a clear-site-data event, Firestore's cache returns `null` for documents that exist in Dexie — causing the UI to show empty state when data is actually there. GitHub issue #8593 confirms cache corruption after `Clear site data`.

**Why it happens:**
Developers enable Firestore persistence thinking it's "free offline support," not realizing it competes with Dexie for being the source of truth. The two caches can diverge silently.

**How to avoid:**
Pick one of these two clear architectures and commit to it:

- **Architecture A (Recommended for this project):** Dexie is the source of truth. Firestore is the sync target. Disable Firestore offline persistence (use `memoryLocalCache`). All reads go to Dexie. Writes go to Dexie first, then sync to Firestore. On startup, fetch latest from Firestore to hydrate Dexie. `useLiveQuery` from Dexie drives all UI rendering.

- **Architecture B:** Firestore with persistence is the source of truth. Remove Dexie entirely. Use Firestore's offline cache for local reads. This requires a full data layer rewrite and is NOT recommended for this milestone given existing Dexie investment.

Architecture A preserves all existing Dexie/`useLiveQuery` code and keeps the migration incremental.

**Warning signs:**
- UI shows empty state after clear-site-data, but data is in Dexie
- Multi-tab errors: `failed-precondition` from Firestore persistence
- Data inconsistency between what Dexie shows and what Firestore shows

**Phase to address:** Firebase setup and architecture phase — this is the foundational decision.

---

### Pitfall 6: Firestore Offline Listener Reconnect Costs Money

**What goes wrong:**
If Firestore's `onSnapshot` listener is disconnected for more than 30 minutes (app backgrounded, device offline), when it reconnects Firestore charges reads as if you issued a brand-new query — reading every document in the result set. For a single user with 500 tasks, that's 500 reads on every reconnect after 30+ minutes offline. At 50,000 reads/day free tier, this can exceed the quota surprisingly fast during heavy mobile use.

**Why it happens:**
The 30-minute reconnect window is documented in Firestore's billing docs but easy to miss. Most developers assume "offline-then-online" is free because no user action occurred.

**How to avoid:**
Since this project uses Dexie as the source of truth (Architecture A above), minimize use of persistent `onSnapshot` listeners. Instead:
- Use a single `onSnapshot` listener on the user's task collection, only while the app is in the foreground
- Unsubscribe the listener when the app goes to the background (`document.addEventListener('visibilitychange')`)
- On foreground resume, fetch only documents changed since the last known server timestamp (`where('updatedAt', '>', lastSyncTimestamp)`)
- Track `lastSyncTimestamp` in Dexie to enable delta syncs

**Warning signs:**
- Firestore read count spikes in Firebase console after mobile background usage
- Daily read quota exceeded unexpectedly
- Firebase console shows full collection reads on reconnect

**Phase to address:** Firestore sync implementation phase.

---

### Pitfall 7: Firestore Security Rules Left Open During Development Exposes Data

**What goes wrong:**
Default Firestore rules during project setup are `allow read, write: if false` (lock everything) or `allow read, write: if true` (open everything). Developers often set open rules to unblock development, deploy, and forget to lock them down. Since Firebase projects have guessable project IDs (they appear in the app's `firebaseConfig`), anyone who finds the config string can read or delete all data.

**Why it happens:**
Rules feel like a "later" concern. The app is "just for me." But Firebase Hosting makes the `firebaseConfig` publicly visible in the JavaScript bundle — it has to be, since client SDKs use it to connect.

**How to avoid:**
Write the production security rules before deploying to Firebase Hosting, even for a personal app. For a single-user personal app where data is scoped per user:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Deploy rules with `firebase deploy --only firestore:rules` as part of the first deploy. Use the Firebase Rules Simulator in the console to verify they work before going live.

**Warning signs:**
- Firebase console shows "Your security rules are not secure" warning
- Rules allow `if true` (open access)
- Data collection is at root level without user-scoped paths

**Phase to address:** Firebase setup phase — rules must be deployed before or simultaneously with the first public deployment.

---

### Pitfall 8: GCP Free Trial Is Not the Same as Firebase Spark Plan

**What goes wrong:**
The user is on a GCP free trial with $300 credit. When the trial ends, the project automatically downgrades and services stop — it does NOT automatically switch to Firebase Spark (permanent free tier). If the project was created as a Blaze plan project on GCP (which trials require for full access), after the trial ends Firebase may require explicit migration to Spark to avoid charges. Budget alerts do NOT cap spending on Blaze; they only send emails.

**Why it happens:**
The GCP free trial and Firebase Spark plan are separate things. Firebase Spark is a free-forever plan with hard limits. GCP trials use temporary credits. Many developers conflate the two and are surprised when the trial ends.

**How to avoid:**
- Before the trial expires: decide whether to stay on Spark (free, with limits) or upgrade to Blaze (pay-as-you-go)
- For a single-user personal app, Spark limits are sufficient: 50K reads/day, 20K writes/day, 1GB storage
- If staying on Spark, ensure the Firebase project billing is set to "No billing account" and verify in Firebase console under Project Settings > Usage and billing
- Set up a budget alert with a low threshold ($1/month) to detect unexpected charges
- Do NOT enable Google Cloud Functions without moving to Blaze — Functions are not available on Spark

The Firebase blog post [Get started with Firebase using Free Trial credits](https://firebase.blog/posts/2024/11/claim-300-to-get-started/) confirms the trial and Spark are separate entitlements.

**Warning signs:**
- Trial expiry email from Google Cloud
- Firebase console shows billing warning
- Services stop working without warning after trial period

**Phase to address:** Firebase project setup phase — billing architecture decided first.

---

### Pitfall 9: Writing Full Documents Instead of Partial Updates Multiplies Write Counts

**What goes wrong:**
When a user marks a task complete, you call `setDoc(taskRef, localTask)` — syncing the entire Task object (all 15+ fields). Firestore counts this as one write, which seems fine. But if a task has subtasks, naive sync might write the entire parent document every time any subtask changes. With 3 levels of subtasks (up to ~35 nodes per root task), completing one leaf subtask could trigger writes for the whole tree, burning 35 writes for what should be 1.

**Why it happens:**
Fetching the whole Dexie record and passing it to `setDoc` is the simplest code. Developers don't think through write amplification until they see the Firebase console.

**How to avoid:**
Use `updateDoc` with only the changed fields for updates, not `setDoc` for the entire document:
```typescript
// Bad: writes all fields
await setDoc(taskRef, { ...task });

// Good: writes only what changed
await updateDoc(taskRef, {
  status: 'done',
  updatedAt: serverTimestamp()
});
```
Only use `setDoc` for initial document creation. Use Firestore's `serverTimestamp()` for `updatedAt` to avoid clock skew between devices.

**Warning signs:**
- Write count in Firebase console is 10-50x higher than expected task mutation count
- Network tab shows large payloads for simple status changes
- Approaching 20K writes/day limit with low user activity

**Phase to address:** Firestore sync implementation phase.

---

### Pitfall 10: Not Unsubscribing Firestore Listeners Causes Memory Leaks and Zombie Reads

**What goes wrong:**
`onSnapshot` returns an unsubscribe function. If a React component that calls `onSnapshot` inside `useEffect` is unmounted without calling the unsubscribe function, the listener continues running in the background. It still fires callbacks on every document change, updating state on an unmounted component (React warning), and counting as active read operations. With multiple route changes, zombie listeners accumulate.

**Why it happens:**
`onSnapshot` looks like a `useEffect` dependency but is actually a subscription that needs explicit cleanup. Developers familiar with `useState` + `useEffect` for one-time data fetching don't realize the subscription semantics.

**How to avoid:**
```typescript
useEffect(() => {
  if (!user) return;

  const unsubscribe = onSnapshot(
    query(collection(db, `users/${user.uid}/tasks`)),
    (snapshot) => { /* handle updates */ }
  );

  // Critical: return the cleanup function
  return unsubscribe;
}, [user]);
```
Every `onSnapshot` call must have a corresponding `return unsubscribe` in the `useEffect` cleanup. Consider creating a custom hook (`useFirestoreSync`) that centralizes all listeners so cleanup is in one place.

**Warning signs:**
- React warning: "Can't perform a React state update on an unmounted component"
- Firebase console shows unexpected read activity after user navigates away
- Memory usage grows over time without stabilizing

**Phase to address:** Firestore sync implementation phase.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep integer IDs, map to Firestore string IDs only on write | Preserves existing Dexie queries | Brittle mapping layer; `parentId` references break on second device | Never — choose one ID type at sync design time |
| Enable Firestore's IndexedDB persistence alongside Dexie | "Free" offline support | Two caches diverge, post-clear-data corruption, multi-tab `failed-precondition` errors | Never — pick one source of truth |
| Use `setDoc` for all syncs (create and update) | Simpler code | Write amplification, overwrites partial updates from other devices | Acceptable only if single-device and no real concurrency |
| Leave security rules open during development, harden later | Unblocks development speed | Rules will be forgotten; data is public until caught | Never — write rules before first deployment |
| Store API keys (AI provider keys) in Firestore | "Central storage" | Keys visible to anyone who authenticates; treat Firestore as public | Never — keep AI keys in environment variables / client-only localStorage |
| Single top-level Firestore collection (no user scoping) | Simple queries | Security rules cannot scope per-user without user-scoped paths | Never — always scope under `/users/{uid}/` |

---

## Integration Gotchas

Common mistakes when connecting Firebase services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firestore + Dexie | Enabling both Firestore persistence and Dexie, letting them compete | Disable Firestore persistence (`memoryLocalCache`); Dexie is sole source of truth |
| Firebase Auth + React | Reading `auth.currentUser` synchronously at startup | Always use `onAuthStateChanged` with a loading state |
| Firebase Auth + iOS PWA | Using `signInWithPopup` in standalone mode | Use `signInWithRedirect` with correct `authDomain` matching deployed domain |
| Firebase Hosting + vite-plugin-pwa | Deploying without `no-cache` header on service worker file | Add `Cache-Control: no-cache` for `/sw.js` in `firebase.json` headers |
| Firestore + Dexie IDs | Using Dexie integer IDs as Firestore document IDs | Add `firestoreId: string` field to Dexie schema, use it for Firestore paths |
| Firestore + Dexie parentId | Syncing `parentId` as integer to Firestore | Sync `parentId` as the corresponding `firestoreId` string |
| Firestore Security Rules | Testing rules only with Firebase console simulator | Also test with actual app sign-in + sign-out + anonymous access from browser |
| Firebase Hosting + GCP trial | Assuming GCP trial = Firebase Spark plan | Explicitly check billing plan in Firebase console; Spark is separate from trial |

---

## Performance Traps

Patterns that work at small scale but cause problems with real usage.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-collection `onSnapshot` listener | All N tasks re-read on reconnect after 30+ min offline | Scope to user UID path; unsubscribe when app backgrounded; use delta sync with `updatedAt` filter | >200 tasks, frequent mobile background/foreground cycles |
| Write full document on every Dexie change | Write count 10-50x expected | Use `updateDoc` with only changed fields for updates | >500 task mutations/day |
| Sync triggered on every `useLiveQuery` emission | Firestore write on every letter typed in task title | Debounce sync trigger (500ms after last change), or sync only on blur/explicit save | Typing speed of a normal user |
| Unbounded Firestore query for tasks | All tasks fetched on startup regardless of date range | Query by date range matching the visible calendar window | >1,000 tasks total |
| Creating Firestore documents at Dexie write time on mobile | High latency writes block UI on slow connections | Write to Dexie immediately; sync to Firestore in background (fire-and-forget with retry) | 3G/LTE with high latency (subway, rural areas) |

---

## Security Mistakes

Firebase-specific security issues for a personal app.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Open Firestore rules (`allow read, write: if true`) during development, never locked | Anyone with the project ID (visible in deployed bundle) can read/write/delete all data | Write user-scoped rules before first deployment; `firebase.json` deploy block includes `firestore:rules` |
| Data stored at root collection without user UID scoping (e.g., `/tasks/{taskId}`) | Rules cannot distinguish which user owns which task | Always scope under `/users/{uid}/tasks/{taskId}`; rules enforce `request.auth.uid == userId` |
| AI provider API keys stored in Firestore | Anyone authenticated can read API keys; keys are billable credentials | Keep AI keys in client-side `localStorage` or environment variables; they never go to Firestore |
| Firestore rules only tested via console simulator | Rules may pass simulator but fail in real app auth context | Test with actual browser sign-in + DevTools network inspection |
| Not validating `updatedAt` field in security rules | Client can backdate `updatedAt` to win last-write-wins conflicts | Add rules validation: `request.resource.data.updatedAt == request.time` |

---

## UX Pitfalls

Integration-specific UX mistakes that harm the user experience.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No sync status indicator | User doesn't know if changes are saved to cloud or not | Show subtle sync state: "Saved locally" → "Synced" → "Sync failed — will retry" |
| Blocking UI on Firestore write | Typing/task completion feels slow on bad connections | Write to Dexie immediately (instant UI feedback), sync to Firestore in background |
| Sign-in gate before seeing any app content | ADHD users abandon on-boarding friction | Let users create tasks locally first; prompt sign-in when they want cross-device sync |
| Sign-out clears all local data | User is locked out of their tasks if sign-out is accidental | Keep Dexie data on sign-out; only clear sync metadata; re-associate on next sign-in |
| No offline indicator | User makes changes, gets confused why they're not showing on other device | Show "Offline — changes saved locally" banner when `navigator.onLine === false` |
| Google sign-in popup on mobile breaks PWA flow | Sign-in appears to fail; user retries repeatedly | Use redirect-based sign-in on mobile (`isMobile()` check before calling auth method) |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Firebase setup:** App connects and writes data locally — verify security rules are NOT open (`allow write: if true`) before calling this done
- [ ] **Google Auth:** Sign-in works in Chrome desktop — verify it also works in iOS Safari PWA standalone mode and Android PWA before marking complete
- [ ] **Firestore sync:** Tasks appear on second device — verify subtask `parentId` relationships are preserved correctly (subtasks appear under the right parent, not orphaned)
- [ ] **Offline support:** App works without internet (Dexie handles this already) — verify changes made offline successfully sync to Firestore when connection restores
- [ ] **Firestore sync:** Sync appears to work — check Firebase console to confirm actual write counts are sane (not 10x expected due to full-document writes)
- [ ] **Service worker:** Deploy appears successful — verify installed PWA on mobile picks up the new version within 24 hours (not serving stale cached shell)
- [ ] **Firebase Hosting:** Site loads at Firebase URL — verify `firebase.json` rewrites are configured for SPA (all routes return `index.html`, not 404)
- [ ] **Data safety:** New data syncs — verify that `firebase deploy` does NOT destroy existing Firestore data (hosting deploy is code only; Firestore data is separate)
- [ ] **Auth state:** User stays signed in across sessions — verify `AUTH_PERSISTENCE` is set to `LOCAL` (not `SESSION` which signs out on browser close)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Integer/string ID mismatch discovered after sync built | HIGH | Pause sync, write Dexie migration to add `firestoreId` field, migrate all Firestore documents to use new string IDs, update all sync code to use `firestoreId` |
| Firestore data corrupted by open security rules | MEDIUM | Audit Firestore console for unexpected documents, delete unauthorized data, lock down rules immediately, rotate any exposed credentials |
| Two Firestore caches (Dexie + Firestore persistence) diverged | MEDIUM | Disable Firestore persistence, clear Firestore local cache (`clearIndexedDbPersistence()`), re-hydrate Dexie from canonical Firestore data |
| Service worker serving stale app after deploy | LOW | Force update: in Chrome DevTools, Service Workers tab, click "Update" and "Skip waiting"; for users, add `skipWaiting()` call in service worker or cache-bust the sw.js URL |
| Zombie `onSnapshot` listeners causing memory leak | LOW | Add unsubscribe calls to all `useEffect` cleanup functions; restart the app to clear accumulated listeners |
| GCP trial ended, services stopped unexpectedly | MEDIUM | Decide: migrate to Spark (free, limited) or enable Blaze (pay-as-you-go); Firestore data is preserved during billing transition |
| iOS Safari sign-in broken after deploy | LOW | Switch auth method to `signInWithRedirect`; verify `authDomain` in Firebase config matches deployed domain exactly |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Integer/string ID mismatch | Firebase project setup (first phase) | Write a Dexie schema migration for `firestoreId` field before any Firestore writes |
| Auth state race / null user flash | Google Auth integration phase | Confirm loading state renders on hard refresh; no sign-in flash for authenticated user |
| signInWithPopup iOS PWA failure | Google Auth integration phase | Test on actual iOS device in PWA standalone mode before marking auth complete |
| vite-plugin-pwa service worker conflict | Firebase Hosting deployment phase | Verify `firebase.json` includes `no-cache` header for `sw.js` |
| Firestore cache vs. Dexie conflict | Firebase architecture design (pre-code) | Code review: confirm `memoryLocalCache` is configured; no Firestore persistence enabled |
| 30-min reconnect read cost | Firestore sync implementation phase | Test: background app 31 minutes, foreground, observe Firebase console read count |
| Open security rules | Firebase setup phase | Firebase console Security Rules tab shows user-scoped rules; test with unauthenticated request being denied |
| GCP trial vs. Spark plan | Firebase project setup phase | Firebase console Project Settings > Usage and billing shows "Spark plan" or confirmed billing plan |
| Full document writes on update | Firestore sync implementation phase | Firebase console shows write counts within expected range after 50 task operations |
| Missing `onSnapshot` unsubscribe | Firestore sync implementation phase | React DevTools Profiler shows no "state update on unmounted component" warnings |

---

## Sources

- [Firebase Auth: Authentication State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) — official docs on persistence modes and async loading
- [Best practices for signInWithRedirect on browsers blocking third-party storage](https://firebase.google.com/docs/auth/web/redirect-best-practices) — official docs on iOS Safari PWA auth
- [Firebase: Use Firebase in a progressive web app](https://firebase.google.com/docs/web/pwa) — official PWA integration guide
- [Firestore: Access data offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — persistence modes, multi-tab constraints
- [Firestore: Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing) — read/write costs, reconnect billing
- [Firestore: Fix insecure rules](https://firebase.google.com/docs/firestore/security/insecure-rules) — security rule patterns
- [Firebase: Avoid surprise bills](https://firebase.google.com/docs/projects/billing/avoid-surprise-bills) — budget alerts, Spark vs. Blaze
- [GitHub: vite-pwa/vite-plugin-pwa issue #777 — second service worker causes constant reload](https://github.com/vite-pwa/vite-plugin-pwa/issues/777) — confirmed service worker conflict
- [GitHub: firebase/firebase-js-sdk issue #8593 — Firestore IndexedDB cache corrupted after clear site data](https://github.com/firebase/firebase-js-sdk/issues/8593) — confirmed cache corruption bug
- [GitHub: firebase/firebase-js-sdk issue #6716 — Safari 16.1+ signInWithPopup failure](https://github.com/firebase/firebase-js-sdk/issues/6716) — confirmed iOS Safari issue
- [GitHub: firebase/firebase-js-sdk issue #2755 — Offline mode improvements: listener reconnect without restart](https://github.com/firebase/firebase-js-sdk/issues/2755) — confirmed reconnect issue
- [Firebase: Deploying Firebase Hosting — firebase.json headers configuration](https://firebase.github.io/firebase-tools/#hosting) — service worker cache control headers
- [Dexie.js: Version.upgrade() documentation](https://dexie.org/docs/Version/Version.upgrade()) — schema migration patterns
- [wild.codes: How do you design offline-first sync & conflict resolution on Firebase?](https://wild.codes/candidate-toolkit-question/how-do-you-design-offline-first-sync-conflict-resolution-on-firebase) — LWW vs. CRDT patterns

---
*Pitfalls research for: Adding Firebase (Firestore, Auth, Hosting) to existing TaskBreaker PWA with Dexie.js*
*Researched: 2026-03-01*
