# Architecture Research: Firebase Integration

**Domain:** React + Vite PWA — Adding Firebase Auth, Firestore sync, and Hosting to existing Dexie.js app
**Researched:** 2026-03-01
**Confidence:** HIGH (Firebase Web SDK v10 modular API verified against official docs and cloud.google.com)

---

## Context: What We're Adding

This document covers only the v1.1 milestone additions. The v1.0 app is a fully functional 62-file React+Vite+Dexie.js PWA. The three new capabilities are:

1. **Firebase Auth** — Google sign-in, one user
2. **Firestore real-time sync** — Cross-device task sync on top of existing IndexedDB
3. **Firebase Hosting** — HTTPS deployment with proper cache headers for PWA

**The existing architecture does not change.** Dexie.js remains the source of truth for reads. All UI components continue to use `useLiveQuery` exactly as they do today. Firestore sync is an additive layer.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         React App (unchanged)                     │
│                                                                   │
│  CalendarGrid  ListView  TaskModal  TaskForm  DayCell  DayGroup   │
│       │           │         │         │         │        │        │
│       └───────────┴─────────┴─────────┴─────────┴────────┘        │
│                              │                                    │
│                    useLiveQuery (Dexie)  ← no change              │
├──────────────────────────────────────────────────────────────────┤
│                        Dexie.js (IndexedDB)                       │
│                                                                   │
│    tasks table    categories table    aiSettings table            │
│         │                                                         │
│    [Source of truth for all UI reads — unchanged]                 │
├──────────────────────────────────────────────────────────────────┤
│                      NEW: Sync Layer                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    useSyncEngine hook                     │    │
│  │                                                           │    │
│  │  onSnapshot (Firestore) → write to Dexie                 │    │
│  │  Dexie mutations → write to Firestore (via wrappers)     │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                     NEW: Firebase Layer                           │
│                                                                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Firebase Auth │  │    Firestore     │  │ Firebase Hosting │  │
│  │                │  │                  │  │                  │  │
│  │  Google OAuth  │  │ users/{uid}/     │  │  dist/ served    │  │
│  │  onAuthState   │  │  tasks/{taskId}  │  │  over HTTPS/CDN  │  │
│  │  Changed       │  │  categories/...  │  │                  │  │
│  └────────────────┘  └─────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Status |
|-----------|----------------|--------|
| All existing UI components | Render tasks, handle user interaction | **Unchanged** |
| `useLiveQuery` hooks in `db/hooks.ts` | Reactive reads from IndexedDB | **Unchanged** |
| Dexie `db` (database.ts) | Local persistence, IndexedDB | **Unchanged** |
| `src/firebase/config.ts` | Firebase app init, Firestore init with persistence | **New** |
| `src/firebase/auth.ts` | Google sign-in, sign-out, onAuthStateChanged | **New** |
| `src/hooks/useAuth.ts` | Auth context hook, exposes `user`, `loading`, `signIn`, `signOut` | **New** |
| `src/firebase/sync.ts` | Firestore read/write wrappers, collection path helpers | **New** |
| `src/hooks/useSyncEngine.ts` | Bidirectional sync orchestration — Firestore ↔ Dexie | **New** |
| `src/components/auth/AuthGate.tsx` | Renders login screen when no user, app when authenticated | **New** |
| `src/components/auth/SignInButton.tsx` | Google sign-in trigger | **New** |
| `App.tsx` | Wrap with AuthGate, start sync engine when authenticated | **Modified** |

---

## Recommended Project Structure

The new files slot into the existing structure without reorganizing anything:

```
src/
├── firebase/               # NEW: all Firebase integration
│   ├── config.ts           # initializeApp, initializeFirestore, getAuth
│   ├── auth.ts             # signInWithPopup, signOut, onAuthStateChanged
│   └── sync.ts             # Firestore collection paths, read/write helpers
│
├── hooks/                  # EXISTING — add new hooks here
│   ├── useAuth.ts          # NEW: Auth context consumer hook
│   ├── useSyncEngine.ts    # NEW: Bidirectional sync orchestration
│   ├── useAIProvider.ts    # existing
│   ├── useBreakdown.ts     # existing
│   └── useSettings.ts      # existing
│
├── components/
│   ├── auth/               # NEW: auth UI components
│   │   ├── AuthGate.tsx    # Login gate wrapping entire app
│   │   └── SignInButton.tsx # Google OAuth button
│   ├── calendar/           # existing — unchanged
│   ├── task/               # existing — unchanged
│   ├── mobile/             # existing — unchanged
│   └── ...                 # all other existing components unchanged
│
├── db/                     # existing — unchanged
│   ├── database.ts         # Dexie schema — may add firebaseId field (v4)
│   └── hooks.ts            # useLiveQuery hooks — unchanged
│
├── types/
│   └── index.ts            # Add firebaseId?: string to Task interface
│
├── App.tsx                 # Modified: wrap with AuthGate, start sync
└── main.tsx                # Unchanged
```

Config files added at project root:
```
.env.local                  # VITE_FIREBASE_* vars (gitignored)
firebase.json               # Hosting config: public=dist, SPA rewrite, headers
.firebaserc                 # Project alias
firestore.rules             # Security rules: only owner can read/write
firestore.indexes.json      # Composite index for tasks by date
```

### Structure Rationale

- **`src/firebase/`:** Isolates all Firebase SDK calls. If Firebase ever needs to be replaced, only this folder changes. Nothing in components imports from `firebase/*` directly — they use hooks.
- **`src/hooks/useAuth.ts` and `useSyncEngine.ts`:** Follows existing hook-per-concern pattern already established in `src/hooks/`. Components stay unaware of Firebase specifics.
- **No new component folders except `auth/`:** The auth gate and sign-in button are the only new visible UI.
- **`db/database.ts` unchanged (or minor v4 migration):** Adding `firebaseId?: string` to tasks lets us map Dexie numeric IDs to Firestore string doc IDs without a full rewrite.

---

## Architectural Patterns

### Pattern 1: Dexie as Read Cache, Firestore as Sync Transport

**What:** All UI reads come from Dexie (IndexedDB) via existing `useLiveQuery` hooks. Firestore's `onSnapshot` listener writes incoming remote changes into Dexie. Local mutations write to Dexie first, then to Firestore.

**When to use:** Correct for offline-first PWAs where you already have a working local store and want to add sync without rewriting UI.

**Trade-offs:** Pro: zero changes to existing component code. Con: two writes per local mutation (Dexie + Firestore), requires careful sequencing to avoid duplicate `onSnapshot` triggers for own writes.

**Example:**
```typescript
// src/hooks/useSyncEngine.ts

export function useSyncEngine(user: FirebaseUser | null) {
  const firestoreRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user) {
      firestoreRef.current?.(); // unsubscribe on sign-out
      return;
    }

    // Subscribe to Firestore, write changes into Dexie
    const q = collection(firestore, `users/${user.uid}/tasks`);
    firestoreRef.current = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data() as FirestoreTask;
        if (change.type === 'added' || change.type === 'modified') {
          // Don't re-write if this was our own write (hasPendingWrites guard)
          if (change.doc.metadata.hasPendingWrites) return;
          await db.tasks.put(firestoreTaskToDexie(data));
        }
        if (change.type === 'removed') {
          const local = await db.tasks
            .where('firebaseId').equals(change.doc.id).first();
          if (local?.id) await db.tasks.delete(local.id);
        }
      });
    });

    return () => firestoreRef.current?.();
  }, [user?.uid]);
}
```

### Pattern 2: Firestore Persistence — Built-In IndexedDB Cache

**What:** `initializeFirestore` with `persistentLocalCache` and `persistentMultipleTabManager` gives Firestore its own IndexedDB cache alongside Dexie's. This is a Firestore-internal optimization — not the same as Dexie's database. Firestore persistence ensures offline writes queued in Firestore are retried when connectivity returns.

**When to use:** Always. Enables Firestore to function offline independently of Dexie. When the app is offline, Firestore buffers writes to its own cache and replays them on reconnect.

**Trade-offs:** Pro: automatic conflict resolution (last-server-write-wins for Firestore's own cache). Con: two IndexedDB databases exist (Dexie's `TaskBreaker` and Firestore's internal db) — this is acceptable and standard for this architecture.

**Example:**
```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache,
         persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// Multi-tab persistence so phone + PC tabs stay in sync
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
```

**Browser support note (MEDIUM confidence):** Offline persistence requires Chrome, Safari, or Firefox. Edge and other browsers may not support it — fall back silently if persistence fails.

### Pattern 3: Auth Context via React Context + onAuthStateChanged

**What:** A single `AuthProvider` wraps the app at the root. It subscribes to Firebase's `onAuthStateChanged` and exposes `{ user, loading }` via context. A `useAuth()` hook consumes it. All auth decisions (show login gate, start sync engine) happen through this hook.

**When to use:** Correct pattern for React apps with Firebase Auth. Ensures auth state is available app-wide without prop drilling.

**Trade-offs:** Pro: clean separation, components don't import Firebase directly. Con: adds one more React context to the tree (acceptable — app already uses Dexie's live query internally).

**Example:**
```typescript
// src/hooks/useAuth.ts
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup,
         GoogleAuthProvider, signOut as firebaseSignOut,
         type User } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged fires automatically — no manual setUser needed
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### Pattern 4: Firestore Data Model — Per-User Subcollection

**What:** All user data lives under `users/{uid}/tasks/{taskId}` and `users/{uid}/categories/{categoryId}`. Firestore Security Rules enforce that only the authenticated user matching `{uid}` can read or write their own data.

**When to use:** Standard pattern for personal-use apps. Scales naturally if multi-user is added later (just add more UIDs).

**Trade-offs:** Pro: complete data isolation, trivial security rules. Con: cross-user queries impossible (not needed for this app). Firestore IDs are strings, Dexie IDs are auto-increment integers — need a mapping field.

**Firestore document shape (maps from Task type):**
```typescript
// src/firebase/sync.ts
export interface FirestoreTask {
  dexieId: number;            // Dexie auto-increment ID — round-trips back
  title: string;
  description: string;
  date: string;               // 'YYYY-MM-DD'
  status: 'todo' | 'in-progress' | 'done';
  categoryId: number;
  parentId: number | null;
  depth: number;
  sortOrder: number | null;
  energyLevel: string | null;
  timeEstimate: number | null;
  timeEstimateOverride: number | null;
  isSomeday: boolean;
  createdAt: string;          // ISO string (Firestore Timestamp alternative)
  updatedAt: string;          // ISO string — used for LWW conflict resolution
  uid: string;                // Owner's Firebase UID (for security rule enforcement)
}

export function taskCollectionPath(uid: string) {
  return `users/${uid}/tasks`;
}

export function categoryCollectionPath(uid: string) {
  return `users/${uid}/categories`;
}
```

**Security Rules (firestore.rules):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### Pattern 5: Last-Write-Wins Conflict Resolution via `updatedAt`

**What:** For a single-user personal app across two devices, conflicts are rare. When they occur (edit on phone and PC simultaneously while offline), the side with the later `updatedAt` timestamp wins. This is implemented by checking `updatedAt` before applying an incoming Firestore snapshot to Dexie.

**When to use:** Sufficient for single-user, non-collaborative task management. Do not use for collaborative scenarios where merging field-level changes matters.

**Trade-offs:** Pro: simple, no CRDT complexity. Con: if clocks are skewed, wrong write could win — acceptable for personal use.

**Example:**
```typescript
// In useSyncEngine.ts, when applying a Firestore change to Dexie:
async function applyRemoteTask(firestoreTask: FirestoreTask) {
  const existing = await db.tasks
    .where('id').equals(firestoreTask.dexieId).first();

  // Skip if local version is newer (LWW)
  if (existing && existing.updatedAt > new Date(firestoreTask.updatedAt)) {
    return;
  }

  await db.tasks.put(firestoreTaskToDexie(firestoreTask));
}
```

---

## Data Flow

### Existing Flow (Unchanged)

```
User Action (create/edit/delete/drag)
    ↓
React Component (TaskForm, DayCell, DraggableTask...)
    ↓
db.tasks.add/put/delete  (direct Dexie call)
    ↓
Dexie IndexedDB
    ↓ (reactive)
useLiveQuery fires
    ↓
All subscribed components re-render
```

### New: Sync Layer Flow (Additive)

```
[Outbound — local → Firestore]

User Action → Dexie write (as above, unchanged)
                    ↓
              syncToFirestore(task, uid)
                    ↓
              Firestore doc set/update/delete
              at users/{uid}/tasks/{dexieId}
                    ↓
              Firestore ACKs (hasPendingWrites → false)


[Inbound — Firestore → local]

Firestore onSnapshot fires (remote change from another device)
    ↓
hasPendingWrites check (skip own writes, avoid echo)
    ↓
updatedAt LWW check (skip if local is newer)
    ↓
db.tasks.put(firestoreTaskToDexie(doc))
    ↓
useLiveQuery fires → components re-render automatically
```

### Auth Flow

```
App starts
    ↓
AuthProvider mounts → onAuthStateChanged subscribes
    ↓
  [No cached user]         [Cached user exists]
        ↓                          ↓
  AuthGate renders          Skip login screen
  login screen              Start useSyncEngine
        ↓
  User taps "Sign in with Google"
        ↓
  signInWithPopup (redirect fallback on mobile)
        ↓
  onAuthStateChanged fires → user set
        ↓
  AuthGate renders app
  useSyncEngine starts with user.uid
        ↓
  Initial sync: pull all Firestore tasks into Dexie
  (first device: push Dexie tasks to Firestore)
```

### Firebase Hosting Deploy Flow

```
npm run build (vite build)
    ↓
dist/ produced (hashed assets + service-worker.js)
    ↓
firebase deploy --only hosting
    ↓
Firebase CDN picks up dist/
    ↓
firebase.json rewrites: all routes → index.html (SPA)
firebase.json headers:
  - index.html: Cache-Control: no-cache
  - /assets/*: Cache-Control: max-age=31536000,immutable
  - service-worker.js: Cache-Control: no-cache
    ↓
vite-plugin-pwa service worker registered by browser
Service worker caches static assets (precache manifest)
Firestore handles its own offline persistence
```

---

## Integration Points with Existing Dexie.js Code

This is the most critical section for implementation.

### `db/database.ts` — One Possible Addition

The existing schema stores tasks with auto-increment integer IDs. Firestore uses string document IDs. The cleanest mapping is to use the Dexie ID (as a string) as the Firestore document ID.

**Option A (recommended): Use `String(task.id)` as Firestore doc ID.** No schema change needed. When writing to Firestore, use `doc(collection, String(task.id!))`. When reading from Firestore, parse `Number(doc.id)` to get back the Dexie ID.

**Option B:** Add `firebaseId?: string` field to Task and a v4 Dexie migration. More flexible if Firestore IDs need to be server-assigned, but adds migration complexity for no gain in this use case.

**Recommendation: Option A.** Zero schema change, zero migration risk. The Dexie auto-increment ID is the single identity for a task across both stores.

### `db/hooks.ts` — Unchanged

All `useLiveQuery` hooks remain exactly as-is. Components continue to call `useTasksByDate`, `useSubtasks`, etc. The sync engine writes to Dexie, which triggers `useLiveQuery` reactivity automatically. No hooks need modification.

### Dexie Mutation Wrappers

Instead of modifying `db/hooks.ts`, create thin wrappers that call Dexie AND Firestore. These replace direct `db.tasks.add/put/delete` calls in components.

```typescript
// src/firebase/sync.ts

export async function syncAddTask(task: Omit<Task, 'id'>, uid: string): Promise<number> {
  // Write to Dexie first (gets auto-increment ID)
  const id = await db.tasks.add(task as Task);

  // Write to Firestore using Dexie ID as doc ID
  const docRef = doc(firestore, taskCollectionPath(uid), String(id));
  await setDoc(docRef, dexieTaskToFirestore({ ...task, id }, uid));

  return id;
}

export async function syncUpdateTask(
  id: number,
  updates: Partial<Task>,
  uid: string
): Promise<void> {
  await db.tasks.update(id, updates);

  const docRef = doc(firestore, taskCollectionPath(uid), String(id));
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function syncDeleteTask(id: number, uid: string): Promise<void> {
  await db.tasks.delete(id);

  const docRef = doc(firestore, taskCollectionPath(uid), String(id));
  await deleteDoc(docRef);
}
```

### `App.tsx` — Minimal Changes

Add `AuthProvider` at the root, `AuthGate` inside, and start `useSyncEngine` when the user is authenticated.

```typescript
// App.tsx (additions only)
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthGate } from './components/auth/AuthGate';
import { useSyncEngine } from './hooks/useSyncEngine';

function AppWithSync() {
  const { user } = useAuth();
  useSyncEngine(user);   // no-op when user is null
  // ... existing App JSX unchanged
}

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppWithSync />
      </AuthGate>
    </AuthProvider>
  );
}
```

---

## New vs Modified Components

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/firebase/config.ts` | New | Firebase app init, Firestore with persistence, Auth instance |
| `src/firebase/auth.ts` | New | signInWithPopup, signOut helpers |
| `src/firebase/sync.ts` | New | Firestore read/write wrappers, path helpers, type converters |
| `src/hooks/useAuth.ts` | New | AuthContext + AuthProvider + useAuth hook |
| `src/hooks/useSyncEngine.ts` | New | Bidirectional sync, onSnapshot subscription |
| `src/components/auth/AuthGate.tsx` | New | Loading screen + login gate |
| `src/components/auth/SignInButton.tsx` | New | Google sign-in button |
| `src/App.tsx` | Modified | Add AuthProvider wrap, AuthGate, useSyncEngine call |
| `src/types/index.ts` | Maybe modified | No change needed if using Option A for ID mapping |
| `src/db/database.ts` | Unchanged | Dexie schema stays at v3 |
| `src/db/hooks.ts` | Unchanged | All useLiveQuery hooks unchanged |
| All other components | Unchanged | CalendarGrid, DayCell, TaskModal, etc. — zero changes |
| `firebase.json` | New | Hosting config |
| `.firebaserc` | New | Project alias |
| `firestore.rules` | New | Security rules |
| `firestore.indexes.json` | New | Composite index for date queries |
| `.env.local` | New | Firebase env vars (gitignored) |

---

## Scaling Considerations

This app targets a single user. Scale analysis is for completeness.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user, 2 devices | Current architecture — Firestore free tier handles comfortably |
| 1 user, 10K tasks | onSnapshot listener returns all tasks on reconnect — add `updatedAt > lastSync` query filter |
| Multi-user (future) | Data model already supports it — each user gets their own `users/{uid}` subtree |
| Real-time collaboration (out of scope) | Would require CRDT (Yjs/Automerge) — do not design for this now |

**Firestore free tier limits (Spark plan) for 1 user:**
- 50K reads/day, 20K writes/day, 20K deletes/day
- 1GB storage
- A typical day of heavy use: ~200 reads, ~50 writes — well within free tier

---

## Anti-Patterns

### Anti-Pattern 1: Using Firestore as the Read Source

**What people do:** Replace `useLiveQuery(db.tasks...)` with `onSnapshot` directly driving component state.

**Why it's wrong:** Loses Dexie's reactive per-cell query pattern. All 42 `DayCell` components would each hold their own Firestore listener, creating 42 subscriptions. More importantly, offline reads from Firestore's persistence layer are slower and less flexible than Dexie for complex queries (date range, parent/child, energy filters).

**Do this instead:** Keep Dexie as the sole read source. Firestore's `onSnapshot` writes into Dexie, not directly into component state.

### Anti-Pattern 2: Writing to Dexie and Firestore in Components

**What people do:** Add `await setDoc(...)` calls alongside existing `db.tasks.add(...)` calls scattered across TaskForm, DndProvider, TaskCard, etc.

**Why it's wrong:** Auth context (user's UID) must be threaded into every component. Firestore errors need handling everywhere. Sync logic is duplicated and hard to disable for logged-out state.

**Do this instead:** Create sync wrapper functions in `src/firebase/sync.ts`. Only these functions know about Firestore. Components call the wrappers exactly as they called `db.tasks.*` before. The wrapper handles both stores atomically.

### Anti-Pattern 3: Syncing Before Auth is Confirmed

**What people do:** Start `useSyncEngine` before `onAuthStateChanged` has fired, using a `user` that might be `null` on initial render.

**Why it's wrong:** Firestore security rules reject unauthenticated reads/writes. Sync attempts throw permission errors on app load. The `loading` state from `onAuthStateChanged` is `true` until Firebase confirms session.

**Do this instead:** `useSyncEngine(user)` is a no-op (early return) when `user === null`. Render a loading spinner while `loading === true`. Only start listening once `loading === false && user !== null`.

### Anti-Pattern 4: Caching `index.html` on Firebase Hosting

**What people do:** Let Firebase Hosting apply its default CDN caching to all files, including `index.html`.

**Why it's wrong:** The service worker is registered from `index.html`. If `index.html` is cached at the CDN, PWA updates won't reach users until cache expiry. Old service workers serve stale assets.

**Do this instead:** Explicitly set `Cache-Control: no-cache` for `index.html` and `service-worker.js` in `firebase.json`. Let hashed asset files (`/assets/*`) get long-lived caching (`max-age=31536000,immutable`).

### Anti-Pattern 5: signInWithRedirect on Desktop

**What people do:** Use `signInWithRedirect` uniformly for all platforms to avoid popup blockers.

**Why it's wrong:** On desktop browsers, redirect causes a full page navigation that loses in-memory app state. Popup is better for desktop. Redirect is genuinely needed only on mobile browsers where popups are blocked by default.

**Do this instead:** Use `signInWithPopup` on desktop, `signInWithRedirect` on mobile. Detect with `isMobile` (already available via `useMediaQuery` hook in this codebase).

---

## Build Order and Dependencies

This is the recommended implementation sequence, ordered by dependency.

### Step 1: Firebase Project Setup (no code yet)
```
Firebase Console → new project
Enable Firestore (Native mode)
Enable Authentication → Google provider
Copy SDK config values
Create .env.local with VITE_FIREBASE_* vars
Install: npm install firebase
```

Dependency: None. Can be done before any code changes.

### Step 2: Firebase Config and Auth Layer

```
Create src/firebase/config.ts    (initializeApp, initializeFirestore, getAuth)
Create src/firebase/auth.ts      (signInWithPopup, signOut)
Create src/hooks/useAuth.ts      (AuthProvider, useAuth)
Create src/components/auth/AuthGate.tsx
Create src/components/auth/SignInButton.tsx
Modify App.tsx: wrap with AuthProvider + AuthGate
```

Dependency: Step 1 (needs Firebase project config).
Verify: Sign in works, user.uid is accessible, sign out clears user.

### Step 3: Firestore Sync Engine

```
Create src/firebase/sync.ts      (path helpers, type converters, write wrappers)
Create src/hooks/useSyncEngine.ts (onSnapshot → Dexie, Dexie → Firestore)
Modify App.tsx: call useSyncEngine(user) when authenticated
Deploy firestore.rules            (read/write only if uid matches)
```

Dependency: Step 2 (needs `user.uid` from auth).
Verify: Task created on device A appears on device B after brief delay. Offline create on device A syncs when back online.

### Step 4: Initial Data Migration

```
On first sign-in: push all existing local Dexie tasks to Firestore
(handled in useSyncEngine's initial load logic)
```

Dependency: Step 3 (needs sync wrappers).
Verify: Existing tasks from IndexedDB appear in Firestore after first sign-in.

### Step 5: Firebase Hosting Deployment

```
npm install -D firebase-tools
firebase login
firebase init hosting (select dist, configure SPA rewrite)
Create firebase.json with cache headers
npm run build && firebase deploy --only hosting
```

Dependency: Steps 1-4 for a complete deployment. Can be done after Step 1 for a skeleton deploy.
Verify: App loads at Firebase Hosting URL. PWA installs. Offline mode works.

### Dependency Graph

```
Firebase Project (console setup)
         ↓
Firebase Config (config.ts)
         ↓
Auth Layer (auth.ts, useAuth.ts, AuthGate)
         ↓
Sync Engine (sync.ts, useSyncEngine.ts)
         ↓
Initial Migration (first sign-in sync)
         ↓
Hosting Deploy (firebase.json, firebase deploy)
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Firebase Auth | `onAuthStateChanged` in `AuthProvider`, Google OAuth via `signInWithPopup` | Keep auth state in React context, not component state |
| Firestore | `initializeFirestore` with `persistentLocalCache`, `onSnapshot` for inbound, `setDoc/updateDoc/deleteDoc` for outbound | Use `persistentMultipleTabManager` so phone and PC tab share one cache |
| Firebase Hosting | `firebase deploy --only hosting` from `dist/` | firebase.json rewrite + no-cache headers for index.html critical |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Auth ↔ Sync | `useAuth` hook passes `user` to `useSyncEngine` | Sync is a no-op until user is authenticated |
| Sync ↔ Dexie | `db.tasks.put/delete` calls inside `onSnapshot` handler | Must use `hasPendingWrites` guard to avoid echo loop |
| Sync ↔ Firestore | `setDoc/updateDoc/deleteDoc` in sync wrappers | Firestore persistence handles offline queuing automatically |
| Components ↔ Sync | Components call sync wrappers instead of `db.*` directly | Only the wrappers need auth context; components stay clean |
| vite-plugin-pwa ↔ Hosting | Service worker generated at build time, served with no-cache headers | Service worker handles static asset offline; Firestore handles data offline |

---

## Firebase.json Configuration

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/index.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      },
      {
        "source": "/service-worker.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" },
          { "key": "Service-Worker-Allowed", "value": "/" }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000,immutable" }
        ]
      }
    ]
  }
}
```

**Rationale:** `index.html` and `service-worker.js` must never be CDN-cached — they gate PWA updates. Hashed assets in `/assets/` (Vite's output) can be cached forever since their content hash changes with each build.

---

## Sources

- [Firebase Firestore — Access data offline (offline persistence, initializeFirestore, persistentLocalCache)](https://cloud.google.com/firestore/docs/manage-data/enable-offline) — VERIFIED
- [Firebase — Enable Firestore caching on web (multi-tab setup code)](https://puf.io/posts/enable-firestore-caching-on-web/) — HIGH confidence
- [Firebase — Use Firebase in a PWA (PWA integration guidance)](https://firebase.google.com/docs/web/pwa) — VERIFIED
- [Firebase Auth — Authenticate Using Google with JavaScript](https://firebase.google.com/docs/auth/web/google-signin) — VERIFIED
- [Firebase Hosting — Full configuration reference (firebase.json)](https://firebase.google.com/docs/hosting/full-config) — VERIFIED
- [Firebase Security Rules — Per-user permissions pattern](https://medium.com/firebase-developers/patterns-for-security-with-firebase-per-user-permissions-for-cloud-firestore-be67ee8edc4a) — MEDIUM confidence
- [Firestore data model — subcollections](https://firebase.google.com/docs/firestore/data-model) — VERIFIED
- [Firestore onSnapshot — hasPendingWrites, fromCache metadata](https://firebase.google.com/docs/firestore/query-data/listen) — VERIFIED
- PersistentMultipleTabManager API reference — VERIFIED against Firebase JS API reference

---

*Architecture research for: Firebase Auth + Firestore sync + Hosting integration into React+Vite+Dexie.js PWA*
*Researched: 2026-03-01*
