# Phase 9: Authentication - Research

**Researched:** 2026-03-07
**Domain:** Firebase Authentication (Google sign-in), React auth context, Firestore security rules
**Confidence:** HIGH

## Summary

Phase 9 implements Google sign-in using Firebase Auth (already installed as `firebase@^12.10.0`), an auth-gated React app shell, and per-user Firestore security rules. The core implementation is straightforward: `getAuth(app)`, `GoogleAuthProvider`, `onAuthStateChanged` listener in a React context, and conditional rendering in App.tsx.

The primary complexity is iOS Safari PWA standalone mode. Safari 16.1+ blocks third-party storage access, which breaks `signInWithRedirect` when the `authDomain` differs from the hosting domain. The current config uses `taskpad-app.firebaseapp.com` as `authDomain`. Once the app is deployed to Firebase Hosting (Phase 11), `authDomain` must be updated to match the hosting domain (`taskpad-app.web.app`) so the `__/auth` handler runs on the same origin. For local development and pre-deployment, `signInWithPopup` works fine on desktop. The redirect flow can only be fully verified once deployed.

**Primary recommendation:** Use `signInWithPopup` for desktop, `signInWithRedirect` for mobile. Implement the auth context + gate pattern first. Defer iOS PWA standalone verification to post-deployment (Phase 11), but build the redirect code path now. Update `authDomain` to the Firebase Hosting domain when deployment is configured.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Minimal centered card sign-in screen: "taskpad" text + Google sign-in button on plain white background
- No tagline or subtitle -- ultra-minimal
- Google-branded sign-in button (official white button with G logo, not custom styled)
- Sign-in errors shown inline below the button (red text, e.g., "Sign-in failed. Please try again.")
- Popup-blocked errors should have a specific helpful message
- Account section added to existing SettingsModal -- at the top, above existing settings
- Shows user avatar, display name, and email
- Sign-out button in the account section
- Immediate sign-out on click -- no confirmation dialog
- Same layout on both desktop and mobile (SettingsModal already works on both)
- Centered "taskpad" text on white background while auth state resolves
- If auth takes >2 seconds, a small spinner fades in below the text
- Instant swap (no animation) when auth resolves to sign-in screen or app
- AuthProvider React context wrapping `<App />` in main.tsx
- `useAuth()` hook exposes `{ user, loading }` to any component
- App.tsx conditionally renders: loading screen, sign-in screen, or task UI
- Clear IndexedDB data on sign-out (clean slate)
- `signInWithPopup` on desktop, `signInWithRedirect` on mobile/PWA (iOS Safari requirement)
- iOS Safari standalone PWA auth is a hardware gate -- must test on real device
- Update deny-all rules from Phase 8 to allow authenticated per-user access
- Each user can only read/write their own documents

### Claude's Discretion
- Auth provider implementation details (onAuthStateChanged listener setup)
- Firestore security rule structure (collection paths, rule conditions)
- How to detect mobile vs desktop for popup/redirect decision
- Sign-in button loading state while auth is in progress
- Error message wording for specific failure scenarios

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in with their Google account | Firebase Auth GoogleAuthProvider + signInWithPopup/signInWithRedirect |
| AUTH-02 | Auth session persists across browser refresh | Firebase Auth default persistence is LOCAL (browserLocalPersistence) -- no extra config needed |
| AUTH-03 | User can sign out | `signOut(auth)` + clear IndexedDB via Dexie `db.delete()` |
| AUTH-04 | App is gated behind auth -- must sign in to access tasks | AuthProvider context + conditional rendering in App.tsx |
| AUTH-05 | Sign-in uses popup on desktop and redirect on mobile/PWA | `useIsMobile()` hook drives strategy; popup for desktop, redirect for mobile |
| AUTH-06 | Sign-in works in iOS Safari standalone PWA mode | Requires `authDomain` matching hosting domain; hardware-verified post-deployment |
| DATA-01 | Firestore security rules restrict each user to only their own data | Rules using `request.auth.uid == userId` pattern on `users/{userId}/**` paths |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/auth | 12.10.0 (part of firebase) | Authentication | Already installed; provides getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut |
| React Context | 19.2.0 (part of react) | Auth state management | Standard React pattern for cross-cutting state; no additional dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.575.0 | Icons (spinner, user avatar fallback) | Already installed; use Loader2 for spinner |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Context | zustand/jotai | Overkill for single auth state; context is standard for auth |
| Custom auth UI | FirebaseUI | FirebaseUI is a separate package, harder to customize to "ultra-minimal" spec, last released as firebaseui-web June 2023 |
| reactfire | Manual Firebase calls | reactfire explicitly out of scope per REQUIREMENTS.md |

**No additional installation needed.** Firebase auth is part of the `firebase` package already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── firebase/
│   ├── config.ts          # Existing -- app + firestore exports
│   └── auth.ts            # NEW: auth instance, GoogleAuthProvider, sign-in/out helpers
├── contexts/
│   └── AuthContext.tsx     # NEW: AuthProvider + useAuth hook
├── components/
│   ├── auth/
│   │   └── SignInScreen.tsx  # NEW: minimal sign-in card
│   └── ui/
│       ├── SettingsModal.tsx # MODIFIED: add Account section at top
│       └── AuthLoadingScreen.tsx # NEW: "taskpad" + delayed spinner
├── hooks/
│   └── useMediaQuery.ts   # Existing -- useIsMobile for popup vs redirect
└── main.tsx               # MODIFIED: wrap App with AuthProvider
```

### Pattern 1: Firebase Auth Module
**What:** Centralize auth instance and helpers in `src/firebase/auth.ts`
**When to use:** Always -- keeps Firebase imports out of components
**Example:**
```typescript
// src/firebase/auth.ts
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as firebaseSignOut } from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(useRedirect: boolean): Promise<void> {
  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
  } else {
    await signInWithPopup(auth, googleProvider);
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
```

### Pattern 2: AuthContext Provider
**What:** React context that subscribes to `onAuthStateChanged` and exposes `{ user, loading }`
**When to use:** Wrap entire app; consumed by any component needing auth state
**Example:**
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
```

### Pattern 3: Auth Gate in App.tsx
**What:** Top-level conditional rendering based on auth state
**When to use:** App.tsx renders loading screen, sign-in, or task UI
**Example:**
```typescript
// In App.tsx (top of component body)
const { user, loading } = useAuth();

if (loading) return <AuthLoadingScreen />;
if (!user) return <SignInScreen />;

// ... existing App content
```

### Pattern 4: Mobile Detection for Auth Strategy
**What:** Use existing `useIsMobile()` to decide popup vs redirect
**When to use:** SignInScreen component
**Rationale:** `useIsMobile()` already exists and matches the mobile/desktop layout split. `signInWithPopup` fails on some mobile browsers (popup blocked), while `signInWithRedirect` has Safari cross-origin issues on desktop during local dev.
```typescript
const isMobile = useIsMobile();
// In sign-in handler:
await signInWithGoogle(isMobile);
```

### Pattern 5: Redirect Result Handling
**What:** Call `getRedirectResult(auth)` on app load to complete redirect sign-in
**When to use:** When using `signInWithRedirect`, the result arrives after page reload
**Example:**
```typescript
// In AuthProvider or auth.ts initialization
import { getRedirectResult } from 'firebase/auth';

// Call once on app startup
getRedirectResult(auth).catch((error) => {
  // Handle redirect errors (e.g., account-exists-with-different-credential)
  console.error('Redirect sign-in error:', error);
});
```

### Anti-Patterns to Avoid
- **Checking `auth.currentUser` directly:** It is `null` on page load before `onAuthStateChanged` fires. Always use the listener.
- **Multiple `onAuthStateChanged` subscriptions:** Subscribe once in AuthProvider, distribute via context. Never subscribe in individual components.
- **Calling `signInWithRedirect` without `getRedirectResult`:** The redirect returns to your page but the result must be explicitly retrieved.
- **Custom-styling the Google button against brand guidelines:** Use official colors (white background, Google G logo, "Sign in with Google" text). Google has brand guidelines for this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth state persistence | Custom localStorage token management | Firebase Auth default LOCAL persistence | Firebase handles token refresh, expiration, cross-tab sync automatically |
| OAuth flow | Custom OAuth redirect handling | `signInWithPopup` / `signInWithRedirect` | OAuth has CSRF, state validation, token exchange -- Firebase handles all of it |
| User session validation | Custom JWT verification | `onAuthStateChanged` | Firebase validates tokens server-side, refreshes automatically |
| Google sign-in button | Custom Google logo + button | Follow Google's brand guidelines with Tailwind | Must comply with Google's sign-in branding guidelines |
| Firestore auth enforcement | Application-level access checks | Firestore Security Rules | Client-side checks can be bypassed; rules are server-enforced |

**Key insight:** Firebase Auth handles the entire OAuth lifecycle, token refresh, and session persistence. The only code needed is: initialize, call sign-in, listen for state changes, call sign-out.

## Common Pitfalls

### Pitfall 1: signInWithRedirect Broken on Safari 16.1+ and iOS PWA
**What goes wrong:** Redirect auth fails silently -- user is redirected to Google, authenticates, but returns to the app without being signed in.
**Why it happens:** Safari blocks third-party storage access. Firebase Auth uses a cross-origin iframe at `{authDomain}/__/auth/handler`. When `authDomain` (e.g., `taskpad-app.firebaseapp.com`) differs from the app's hosting domain, the auth state can't be passed back.
**How to avoid:** When deploying to Firebase Hosting (Phase 11), set `authDomain` in firebase config to match the hosting domain (e.g., `taskpad-app.web.app`). Firebase Hosting automatically serves the `/__/auth/handler` endpoint. Also add the new domain to Google OAuth authorized redirect URIs in Google Cloud Console.
**Warning signs:** Auth works on Chrome desktop but fails on Safari or iOS devices. `getRedirectResult` returns null.

### Pitfall 2: Auth State Flash (FOUC)
**What goes wrong:** User sees the sign-in screen briefly before `onAuthStateChanged` fires with their existing session.
**Why it happens:** Firebase Auth reads the persisted token from IndexedDB/localStorage asynchronously. The initial state is `{ user: null, loading: true }` until the callback fires.
**How to avoid:** Start with `loading: true`, show the loading screen (centered "taskpad" text), and only render sign-in or app content after `loading` becomes `false`.
**Warning signs:** Authenticated users see a flash of the sign-in screen on page load.

### Pitfall 3: Popup Blocked on Mobile
**What goes wrong:** `signInWithPopup` opens a new window that mobile browsers block or the user can't navigate back from.
**Why it happens:** Mobile browsers aggressively block popups. Even when allowed, the popup UX is poor on mobile (small screens, navigation confusion).
**How to avoid:** Use `signInWithRedirect` on mobile (driven by `useIsMobile()`). Only use popup on desktop.
**Warning signs:** Sign-in button does nothing on mobile; user reports "nothing happened."

### Pitfall 4: IndexedDB Not Cleared on Sign-Out
**What goes wrong:** After sign-out and sign-in as a different user, the old user's tasks appear briefly.
**Why it happens:** Dexie's IndexedDB contains the previous user's data. Without clearing, it persists.
**How to avoid:** On sign-out, call `db.delete()` (deletes and recreates the database) or `db.tables.forEach(t => t.clear())` before calling `signOut(auth)`. The `db.delete()` approach is cleaner for a "clean slate."
**Warning signs:** Data from previous user visible after switching accounts.

### Pitfall 5: getRedirectResult Not Called
**What goes wrong:** User completes Google sign-in via redirect, returns to the app, but `onAuthStateChanged` doesn't fire immediately or errors are silently lost.
**Why it happens:** `getRedirectResult` must be called on the page that receives the redirect. Without it, redirect errors (like `auth/account-exists-with-different-credential`) are invisible.
**How to avoid:** Call `getRedirectResult(auth)` once during app initialization (in AuthProvider or auth module). Handle errors and surface them to the user.
**Warning signs:** Redirect sign-in seems to "do nothing" after returning from Google.

### Pitfall 6: Firestore Rules Not Deployed
**What goes wrong:** Security rules still deny all access (Phase 8 default), so auth works but Firestore reads/writes fail.
**Why it happens:** `firestore.rules` is updated locally but not deployed to Firebase.
**How to avoid:** After updating rules, deploy with `npx firebase deploy --only firestore:rules`. Verify in Firebase Console > Firestore > Rules.
**Warning signs:** Auth succeeds but app can't read/write data. Console shows permission-denied errors.

## Code Examples

### Firebase Auth Initialization
```typescript
// src/firebase/auth.ts
// Source: Firebase Auth Web SDK docs
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Handle redirect result on app load (call once)
export const redirectResultPromise = getRedirectResult(auth).catch((error) => {
  console.error('Redirect sign-in error:', error.code, error.message);
  return null;
});

export async function signInWithGoogle(useRedirect: boolean): Promise<void> {
  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
    // Page will redirect -- no code runs after this
  } else {
    await signInWithPopup(auth, googleProvider);
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
```

### Sign-In Screen Component
```typescript
// src/components/auth/SignInScreen.tsx
// Minimal card: "taskpad" + Google sign-in button
import { useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { signInWithGoogle } from '../../firebase/auth';

export function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const isMobile = useIsMobile();

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle(isMobile);
      // If popup: user is now signed in, onAuthStateChanged will fire
      // If redirect: page navigates away, this code doesn't continue
    } catch (err: unknown) {
      setSigningIn(false);
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/popup-closed-by-user') {
        // User cancelled -- not an error to display
      } else {
        setError('Sign-in failed. Please try again.');
      }
    }
  };

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800 mb-8">taskpad</h1>
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="..." // Google-branded button styles
        >
          {/* Google G logo SVG + "Sign in with Google" text */}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
```

### Auth Loading Screen
```typescript
// src/components/ui/AuthLoadingScreen.tsx
import { useState, useEffect } from 'react';

export function AuthLoadingScreen() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSpinner(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">taskpad</h1>
        {showSpinner && (
          <div className="mt-4 animate-spin ...">
            {/* Loader2 from lucide-react or CSS spinner */}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Account Section in SettingsModal
```typescript
// Added at top of SettingsModal content area
// user comes from useAuth() hook
{user && (
  <div className="pb-4 border-b border-slate-200">
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{user.displayName}</p>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
      </div>
    </div>
    <button
      onClick={handleSignOut}
      className="mt-3 w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
    >
      Sign out
    </button>
  </div>
)}
```

### Firestore Security Rules (Per-User)
```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Per-user data: users/{userId}/tasks/{taskId}
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### IndexedDB Cleanup on Sign-Out
```typescript
// In sign-out handler
import { db } from '../db/database';
import { signOutUser } from '../firebase/auth';

async function handleSignOut() {
  await db.delete(); // Deletes entire Dexie database
  await signOutUser(); // Firebase sign-out
  // onAuthStateChanged will fire -> user = null -> sign-in screen renders
  // On next sign-in, Dexie will recreate with populate callback
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `firebase.auth()` namespace API | `getAuth(app)` modular API | Firebase v9 (2021) | Tree-shakeable; this project already uses modular imports |
| `signInWithRedirect` "just works" | Requires same-origin `authDomain` for Safari/Firefox | Safari 16.1 (Oct 2022) | Must configure `authDomain` to match hosting domain |
| `firebase.auth.Auth.Persistence.LOCAL` | `browserLocalPersistence` import | Firebase v9 | Import enum constant instead of class property |
| Default persistence needs `setPersistence` | LOCAL is default -- no call needed | Firebase v9+ | Simplification: auth persists by default |

**Deprecated/outdated:**
- `firebase.auth()` compat API: Still works but doubles bundle size. Use modular `getAuth()`.
- `firebaseui-web`: Last release June 2023, React 19 unverified, explicitly out of scope per REQUIREMENTS.md.

## Open Questions

1. **iOS Safari PWA Standalone Auth Verification**
   - What we know: `signInWithRedirect` requires `authDomain` to match hosting domain. Firebase Hosting auto-serves `/__/auth/handler`.
   - What's unclear: Whether redirect flow works correctly in iOS Safari standalone/home-screen mode even with correct `authDomain`. Some GitHub issues suggest it may still fail in standalone mode.
   - Recommendation: Build the redirect code path now. When deployed (Phase 11), update `authDomain` to `taskpad-app.web.app`, add it to OAuth authorized redirect URIs, and test on a real iOS device. If standalone mode still fails, fallback to popup (iOS Safari does allow popups in some contexts).

2. **Dexie Database Recreation After Delete**
   - What we know: `db.delete()` removes the entire database. Dexie's `on('populate')` callback seeds default categories.
   - What's unclear: Whether `db.delete()` + immediate re-use triggers `on('populate')` automatically, or if a page reload is needed.
   - Recommendation: Test this during implementation. If needed, manually re-open the database after delete: `await db.delete(); await db.open();`.

3. **Firestore Collection Path for Phase 10 Compatibility**
   - What we know: Phase 10 will sync tasks to Firestore. Security rules must match the collection structure.
   - What's unclear: The exact collection path Phase 10 will use (e.g., `users/{uid}/tasks/{taskId}` vs `tasks/{taskId}` with `userId` field).
   - Recommendation: Use `users/{userId}/tasks/{taskId}` subcollection pattern. This naturally scopes data per user and maps cleanly to security rules with `request.auth.uid == userId`. The wildcard `{document=**}` rule covers subcollections (tasks, categories, etc.).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected -- no test framework configured |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Google sign-in works | manual-only | Manual: click sign-in on desktop + mobile | N/A |
| AUTH-02 | Session persists across refresh | manual-only | Manual: sign in, refresh, verify still signed in | N/A |
| AUTH-03 | User can sign out | manual-only | Manual: click sign-out, verify redirected to sign-in | N/A |
| AUTH-04 | App gated behind auth | manual-only | Manual: open app without session, verify sign-in screen | N/A |
| AUTH-05 | Popup on desktop, redirect on mobile | manual-only | Manual: test on desktop browser + mobile browser | N/A |
| AUTH-06 | iOS Safari PWA standalone | manual-only | Manual: test on real iOS device with PWA installed | N/A |
| DATA-01 | Per-user Firestore rules | manual-only | `npx firebase deploy --only firestore:rules` + Firebase Console Rules Playground | N/A |

**Justification for manual-only:** All auth requirements involve real browser OAuth flows (Google sign-in popup/redirect) that cannot be automated without a test account and browser automation framework. Firestore rules can be tested via Firebase Console's Rules Playground or the `@firebase/rules-unit-testing` package, but setting up that framework is out of scope for this phase.

### Sampling Rate
- **Per task commit:** Manual smoke test -- sign in, verify app loads, sign out
- **Per wave merge:** Full manual walkthrough of all 7 requirements
- **Phase gate:** All requirements verified manually; Firestore rules verified via Firebase Console Rules Playground

### Wave 0 Gaps
None -- no automated test infrastructure to set up. All validation is manual for this phase. If the project later adds vitest, auth context can be unit-tested with mocked `onAuthStateChanged`.

## Sources

### Primary (HIGH confidence)
- [Firebase Auth Web SDK - Google Sign-in](https://firebase.google.com/docs/auth/web/google-signin) - signInWithPopup, signInWithRedirect, GoogleAuthProvider API
- [Firebase Auth State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) - LOCAL/SESSION/NONE persistence types, default behavior
- [Firebase Redirect Best Practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) - Safari 16.1+ authDomain fix, same-origin requirements
- [Firestore Security Rules Conditions](https://firebase.google.com/docs/firestore/security/rules-conditions) - request.auth.uid pattern, per-user rules

### Secondary (MEDIUM confidence)
- [Firebase JS SDK Issue #6716](https://github.com/firebase/firebase-js-sdk/issues/6716) - Safari 16.1+ redirect failure, community workarounds
- [CodeJam: Firebase Auth Safari Fix](https://www.codejam.info/2024/05/nextjs-firebase-auth-safari.html) - authDomain proxy approach for non-Firebase-hosted apps
- [Firebase JS SDK Issue #8329](https://github.com/firebase/firebase-js-sdk/issues/8329) - Chrome 115+, Safari 16.1+, Firefox 109+ redirect issues

### Tertiary (LOW confidence)
- [Firebase JS SDK Issue #1044](https://github.com/firebase/firebase-js-sdk/issues/1044) - iOS standalone mode redirect issues (older, may be partially resolved)
- [Firebase JS SDK Issue #77](https://github.com/firebase/firebase-js-sdk/issues/77) - iOS home screen auth (very old issue, uncertain current status)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase Auth is well-documented, modular API is stable, no additional packages needed
- Architecture: HIGH - React context + onAuthStateChanged is the established pattern, widely documented
- Pitfalls: HIGH - Safari redirect issues are extensively documented in Firebase issues and official docs
- iOS PWA standalone: MEDIUM - Known problem space with documented solutions, but real-device verification required

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- Firebase Auth API changes infrequently)
