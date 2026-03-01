# Stack Research

**Domain:** Firebase deployment, Google Auth, and real-time Firestore sync for existing React + Vite PWA
**Researched:** 2026-03-01
**Confidence:** HIGH — verified against Firebase JS SDK release notes (v12.10.0, Feb 27 2026) and official Firebase documentation

---

## Context: What Already Exists (Do Not Re-Research)

The v1.0 codebase is validated and working:

| Technology | Version | Status |
|------------|---------|--------|
| React | ^19.2.0 | Locked — do not change |
| Vite | ^5.4.21 | Locked |
| Tailwind CSS | ^4.2.0 | Locked |
| Dexie.js | ^4.3.0 | Locked — primary offline store |
| dexie-react-hooks | ^4.2.0 | Locked |
| vite-plugin-pwa | ^1.2.0 | Locked |
| TypeScript | ~5.9.3 | Locked |
| @dnd-kit | 6.x / 10.x / 3.x | Locked |

The additions below are ONLY for Firebase v1.1 features: Firebase Hosting, Google Auth, and real-time Firestore sync with Dexie.js as the offline cache.

---

## Recommended Stack Additions

### Core Firebase Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| firebase | ^12.10.0 | Firebase SDK (app, auth, firestore) | Current stable release (Feb 27 2026). Modular tree-shaking API means you only pay bundle-cost for what you import. Importing just `firebase/app`, `firebase/auth`, and `firebase/firestore` is far smaller than pulling the full SDK. |
| firebase-tools | ^15.8.0 | Firebase CLI for Hosting deploy | Required for `firebase deploy`. Install as dev dependency or globally. Current release is 15.8.0 (March 2026). |

### Supporting Libraries (No New Installs Needed)

| Library | Status | Reason |
|---------|--------|--------|
| dexie ^4.3.0 | Already installed | Acts as the offline-first local cache. Firestore syncs into Dexie on connect; UI reads from Dexie always. No change needed. |
| dexie-react-hooks ^4.2.0 | Already installed | `useLiveQuery` remains the reactive source for UI — Dexie changes trigger re-renders, Firestore changes just write to Dexie. |
| vite-plugin-pwa ^1.2.0 | Already installed | Service worker handles asset caching. Firebase Auth persists auth state independently via its own IndexedDB store. No conflict. |

### What NOT to Install

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `reactfire` | Last release v4.2.3 (June 2023), marked experimental, not an officially supported Firebase product, React 19 compatibility unknown | Raw Firebase SDK hooks in a thin custom `useFirestore` hook |
| `firebase/analytics` | Analytics adds ~40KB and has no value for a single-user personal tool | Omit entirely — import only `firebase/app`, `firebase/auth`, `firebase/firestore` |
| `firebase/functions` | Cloud Functions are not needed for this milestone | Skip |
| `firebase/storage` | No file storage needed for task data | Skip |
| `firebase/database` | Realtime Database is the legacy product; Firestore is the current offering | Use Firestore |
| `firebase/compat/*` | The compat namespace (v8-style API) disables tree-shaking for the entire product it wraps | Always use modular imports from `firebase/auth`, `firebase/firestore` |
| `firebase/firestore/lite` | Lite removes real-time `onSnapshot` listeners, which are the core of the sync feature | Use full `firebase/firestore` |

---

## Firebase SDK: Modular Import Pattern

Firebase v9+ uses a modular (tree-shakeable) API. Import only the functions you call.

**App initialization** (`src/firebase/config.ts`):
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// Firestore with IndexedDB offline persistence (multi-tab aware)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

**Why `initializeFirestore` over `getFirestore`:** `initializeFirestore` must be called before any other Firestore usage and is the only place to configure `localCache`. `getFirestore` retrieves an already-initialized instance.

**Why `persistentMultipleTabManager`:** The app is a PWA that users may open in multiple browser tabs. Multi-tab manager coordinates offline cache across all tabs using IndexedDB. Single-tab manager would fail if the user has the app open in two places simultaneously.

---

## Firestore Offline Persistence: Role in the Dexie.js Architecture

This is the critical integration decision. Two viable strategies exist:

### Strategy A: Firestore-as-source-of-truth with Firestore offline cache (simpler)

Firestore's built-in `persistentLocalCache` stores a copy of all queried documents in its own IndexedDB store (separate from Dexie's). The UI reads from Firestore via `onSnapshot`; Firestore serves from cache when offline and syncs on reconnect.

**Problem for this project:** The existing UI is tightly coupled to Dexie's `useLiveQuery`. Replacing every data access point would require rewriting all 62 files.

### Strategy B: Firestore syncs into Dexie (layered approach — RECOMMENDED)

Firestore `onSnapshot` listeners write incoming changes into Dexie. The UI continues reading from Dexie via `useLiveQuery` — zero component changes needed. Writes go to Dexie first (instant, offline-safe), then to Firestore when online.

```
Write path:  User action → Dexie (immediate) → Firestore (async, when online)
Read path:   UI ← useLiveQuery ← Dexie (always)
Sync path:   Firestore onSnapshot → write to Dexie
```

**Why Strategy B is correct for this codebase:**
- Preserves all existing UI code (62 files, 6945 LOC)
- `useLiveQuery` remains the reactive data source — no change needed
- Dexie is the offline-first store; Firestore is the cloud mirror
- Auth-gated: only start Firestore listeners after `onAuthStateChanged` fires with a user
- Conflict resolution: Firestore's server timestamp wins on conflict (last-write-wins is acceptable for a single-user app)

**Important nuance:** With Strategy B, Firestore's own `persistentLocalCache` is still enabled but acts as a secondary safety net. The primary offline store remains Dexie. You can also initialize Firestore without `persistentLocalCache` (memory cache only) and rely purely on Dexie — valid for this single-user case.

---

## Firebase Authentication: Google Sign-In

**Recommended pattern for desktop + mobile PWA:**

```typescript
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';

// Detect mobile for redirect vs popup decision
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

export async function signInWithGoogle(auth, provider) {
  if (isMobile) {
    // Redirect is more reliable on mobile browsers (especially iOS Safari)
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

// On app load, check for redirect result
const result = await getRedirectResult(auth);
if (result) {
  // User just completed redirect sign-in
}
```

**Why popup on desktop, redirect on mobile:**
- `signInWithPopup` is blocked by iOS Safari and some Android browsers in PWA mode
- `signInWithRedirect` navigates away and back, which works in all browsers including PWA standalone mode
- As of June 2024, Chrome M115+ requires redirect best practices for third-party cookie phaseout
- Firebase Auth automatically handles the redirect result on return

**Auth state pattern (React context):**
```typescript
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth(auth) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, [auth]);

  return { user, loading };
}
```

Firebase Auth persists sign-in state to its own IndexedDB store automatically. Users stay signed in across sessions and when offline.

---

## Firebase Hosting Configuration

**firebase.json** (Vite SPA with PWA service worker):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      }
    ]
  }
}
```

**Why these settings:**
- `public: "dist"` — Vite outputs to `dist/`, not `public/`
- `rewrites: **` → `index.html` — required for client-side routing in a SPA
- Immutable cache on hashed JS/CSS — Vite adds content hashes, these files never change
- `no-cache` on `sw.js` — service worker must always be fresh so PWA updates propagate

**.firebaserc** (project linking):
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

**Deploy workflow:**
```bash
npm run build          # Vite outputs to dist/
firebase deploy --only hosting   # Push dist/ to Firebase CDN
```

---

## Firestore Security Rules: Single-User Pattern

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tasks collection: user can only access their own tasks
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Subtasks nested under tasks
    match /users/{userId}/tasks/{taskId}/subtasks/{subtaskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Firestore data structure recommendation:**
```
users/{uid}/tasks/{taskId}  →  { title, date, completed, energyLevel, order, ... }
users/{uid}/tasks/{taskId}/subtasks/{subtaskId}  →  { title, completed, order, depth, ... }
```

Scoping all data under `users/{uid}/` means security rules are simple, and the path structure naturally supports multi-user in the future without schema changes.

---

## Installation

```bash
# Production dependency — Firebase SDK
npm install firebase@^12.10.0

# Dev dependency — Firebase CLI for deployment
npm install -D firebase-tools@^15.8.0
```

Add deploy script to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

Add environment variables to `.env.local` (never commit):
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Raw Firebase SDK hooks | reactfire | reactfire is not an officially supported product, last released June 2023, React 19 compatibility unverified. The raw SDK is 4 functions and a useEffect — no abstraction needed. |
| `persistentMultipleTabManager` | `persistentSingleTabManager` | Single-tab is acceptable for apps where users never open multiple tabs (e.g., Electron). For a web PWA, multi-tab is the correct default. |
| Dexie as primary store + Firestore sync | Firestore-only (replace Dexie) | Only viable for a greenfield project. Replacing Dexie would require rewriting all 62 files. |
| `firebase/firestore` (full) | `firebase/firestore/lite` | Use Lite only when you need one-time reads and no real-time listeners. Real-time sync requires the full SDK. |
| Environment variables (VITE\_\*) | Hardcoded config | Firebase API keys are not secret (they identify the project, not grant access), but using env vars allows different keys per environment and keeps config out of source control. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| firebase@^12.10.0 | React 19, Vite 5, TypeScript 5.9 | Firebase v12 requires Node 20+ and ES2020 targets. Vite 5 defaults satisfy this. No React dependency — Firebase SDK is framework-agnostic. |
| firebase-tools@^15.8.0 | Node 20+ | CLI only, dev dependency, never shipped to browser |
| firebase@^12.x | Dexie@^4.3.0 | No conflict — both use IndexedDB internally but in separate stores. Firebase uses `firestore/[project-id]/` namespace; Dexie uses its own DB name. |
| firebase@^12.x | vite-plugin-pwa@^1.2.0 | No conflict. PWA service worker caches static assets; Firebase Auth uses its own persistence layer. |

---

## Sources

- Firebase JavaScript SDK Release Notes — https://firebase.google.com/support/release-notes/js (version 12.10.0 confirmed Feb 27 2026; v12.0.0 July 2025 dropped Node <20 and ES2020 requirement noted)
- Firebase Firestore offline persistence docs — https://firebase.google.com/docs/firestore/manage-data/enable-offline (`persistentLocalCache`, `persistentMultipleTabManager` API confirmed HIGH confidence)
- Firebase Auth Google sign-in best practices — https://firebase.google.com/docs/auth/web/redirect-best-practices (redirect required Chrome M115+ June 2024, confirmed MEDIUM confidence via WebSearch)
- Firebase Hosting SPA configuration — https://firebase.google.com/docs/hosting/full-config (rewrites pattern confirmed HIGH confidence via multiple sources)
- firebase-tools version — WebSearch result citing v15.8.0, March 2026 (MEDIUM confidence — npm registry not directly fetchable)
- reactfire status — GitHub repo https://github.com/FirebaseExtended/reactfire (experimental, v4.2.3, June 2023 — HIGH confidence, directly verified)
- Firebase modular API bundle size — https://firebase.blog/posts/2021/07/introducing-the-new-firebase-js-sdk/ (80% size reduction with modular imports confirmed HIGH confidence)

---

*Stack research for: Firebase v1.1 additions to TaskBreaker PWA*
*Researched: 2026-03-01*
