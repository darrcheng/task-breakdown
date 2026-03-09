# Phase 12: Sync Polish - Research

**Researched:** 2026-03-09
**Domain:** Sync status UI, error recovery UX, online/offline detection
**Confidence:** HIGH

## Summary

Phase 12 adds a sync status indicator and error recovery UX to the existing Firestore sync engine. The core challenge is bridging the gap between the sync module's internal state (pending writes, errors, online/offline) and a React-consumable state that drives a header icon with popover.

The existing `sync.ts` module has all the write hooks but exposes sync state only via boolean getters (`isSyncEnabled`, `isMigrating`). It needs to be extended with an observable sync status (synced/syncing/offline/error) and retry logic. The `handleSyncError` function currently only does `console.error` -- it becomes the central point for retry counting and error state propagation.

**Primary recommendation:** Create a `useSyncStatus` hook backed by a simple event emitter in `sync.ts`, plus a `SyncStatusIcon` component that renders the cloud icon and popover. Replace the existing `OfflineIndicator` entirely.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cloud icon in header bar, top-right area (near Settings button)
- Desktop: icon in header alongside existing controls; Mobile: in top status area
- Replace existing `OfflineIndicator` banner entirely
- Icon states: CloudCheck (green, static) = synced; CloudUpload with spinner (blue) = syncing; CloudOff (amber, static) = offline; CloudAlert (red, static) = error
- Use lucide-react cloud icons
- Synced state always visible (no fade-out)
- Popover on ALL states with specific wording: "All changes synced", "Syncing changes...", "Offline -- changes saved locally", "Sync failed -- check your connection and try again" with [Retry] and [Dismiss]
- Simple user-friendly messages only -- no technical details
- Auto-retry 2 times silently (2s then 4s delay) before showing error
- After 3rd failure, red icon; Retry button clears error and lets Firestore SDK retry
- Icon changes immediately on `navigator.onLine` -- no debounce
- On reconnect: cloud-off -> cloud-syncing (brief) -> cloud-check
- No "back online" banner or toast
- App-level only -- one global sync indicator, no per-task badges
- No last-synced timestamp
- ADHD-friendly: minimal information

### Claude's Discretion
- Exact cloud icon variants from lucide-react
- Popover component implementation (custom or reuse existing pattern)
- How to track pending writes count in sync module
- Spinner animation approach for syncing state
- Mobile popover positioning

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-03 | Sync status indicator shows synced/syncing/offline state | SyncStatusIcon component with useSyncStatus hook; cloud icons confirmed in lucide-react |
| DATA-04 | Sync errors surface to user with recovery guidance (not silent failures) | Error popover with retry/dismiss; handleSyncError expanded with retry counting and error state |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | ^0.575.0 | Cloud icons (CloudCheck, CloudUpload, CloudOff, CloudAlert) | Already in project, all 4 icons confirmed exported |
| React 19 | ^19.2.0 | useSyncExternalStore for subscribing to sync module state | Built-in, zero-dependency way to subscribe to external mutable state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.2.0 | Styling popover, icon colors, spinner animation | Already in project for all styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useSyncExternalStore | Custom context + useState | Context causes unnecessary re-renders; useSyncExternalStore is purpose-built for external stores |
| Custom popover | Radix/headlessui popover | Overkill for a single simple popover; custom is fine for this scope |

**Installation:**
No new dependencies needed. All required packages are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  firebase/
    sync.ts              # Expand: add SyncState type, event emitter, retry logic
  hooks/
    useSyncStatus.ts     # New: React hook wrapping sync module state
  components/
    ui/
      SyncStatusIcon.tsx  # New: icon + popover component
```

### Pattern 1: External Store with useSyncExternalStore
**What:** The sync module maintains mutable state (syncStatus, pendingCount, lastError) and exposes subscribe/getSnapshot functions. React components use `useSyncExternalStore` to subscribe.
**When to use:** When state lives outside React (module-level variables in sync.ts) and multiple components need to read it.
**Example:**
```typescript
// In sync.ts -- the store
type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let syncStatus: SyncStatus = 'synced';
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

export function subscribeSyncStatus(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSyncStatusSnapshot(): SyncStatus {
  return syncStatus;
}

// In useSyncStatus.ts -- the hook
import { useSyncExternalStore } from 'react';
import { subscribeSyncStatus, getSyncStatusSnapshot } from '../firebase/sync';

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatusSnapshot);
}
```

### Pattern 2: Retry with Exponential Backoff in handleSyncError
**What:** Wrap each outbound Firestore write's `.catch()` with retry logic. Track failure count per-write. After 2 silent retries (2s, 4s), set error state.
**When to use:** For the outbound Dexie hooks (creating, updating, deleting) that call setDoc/updateDoc/deleteDoc.
**Example:**
```typescript
// Retry state
let retryCount = 0;
const MAX_SILENT_RETRIES = 2;
const RETRY_DELAYS = [2000, 4000]; // 2s, 4s

async function handleSyncError(error: unknown, retryFn: () => Promise<void>): Promise<void> {
  console.error('Sync write failed:', error);

  if (retryCount < MAX_SILENT_RETRIES) {
    const delay = RETRY_DELAYS[retryCount];
    retryCount++;
    await new Promise(r => setTimeout(r, delay));
    try {
      await retryFn();
      retryCount = 0; // Reset on success
      setSyncStatus('synced');
    } catch (retryError) {
      await handleSyncError(retryError, retryFn);
    }
  } else {
    // 3rd failure -- show error to user
    setSyncStatus('error');
  }
}
```

### Pattern 3: Online/Offline Detection via navigator.onLine Events
**What:** Listen for `online`/`offline` window events to immediately update sync status icon. On reconnect, transition through syncing state briefly.
**When to use:** Already established in OfflineIndicator.tsx -- reuse the same pattern but in the sync module.
**Example:**
```typescript
function setupOnlineListener(): () => void {
  const handleOnline = () => {
    // Transition: offline -> syncing -> synced (after Firestore reconnects)
    setSyncStatus('syncing');
    // Firestore SDK auto-retries buffered writes on reconnect
    // The onSnapshot listener will fire when sync completes
  };
  const handleOffline = () => {
    setSyncStatus('offline');
  };
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
```

### Anti-Patterns to Avoid
- **Polling for sync status:** Never use setInterval to check Firestore connection state. Use event-driven approach only.
- **Separate online/offline and sync state machines:** Keep ONE status variable with ONE state machine. Don't have separate `isOnline` and `syncState` that can conflict.
- **Reading Firestore metadata for "synced" confirmation:** The Firestore `onSnapshot` metadata `hasPendingWrites` is already used for echo-guarding. Don't add a second listener. Track pending writes by counting outbound hook invocations and confirmations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| External store subscription | Custom event bus with manual React re-renders | `useSyncExternalStore` (React built-in) | Handles concurrent mode, SSR, tearing prevention automatically |
| Icon spinning animation | JS-based animation with requestAnimationFrame | Tailwind `animate-spin` class | Already available, GPU-accelerated, zero JS overhead |
| Popover dismiss on outside click | Manual document click listener | React `useEffect` with `mousedown` listener on document | Standard React pattern; alternatively a `<dialog>` or data attribute approach |

**Key insight:** This phase is primarily UI wiring, not complex logic. The Firestore SDK already handles offline buffering, reconnection, and write retry internally. Our job is to surface that state to the user, not to re-implement it.

## Common Pitfalls

### Pitfall 1: Stale Closure in useSyncExternalStore
**What goes wrong:** The `getSnapshot` function returns a new object each call, causing infinite re-renders.
**Why it happens:** If getSnapshot returns `{ status, error }` as a new object reference each time.
**How to avoid:** Return a primitive (the status string) or memoize the object. Since our status is a string union type, returning the string directly avoids this entirely.
**Warning signs:** Component re-renders on every tick without state change.

### Pitfall 2: Race Between Online Event and Firestore Reconnection
**What goes wrong:** `navigator.onLine` fires `true` but Firestore hasn't reconnected yet. Icon shows "synced" prematurely.
**Why it happens:** `navigator.onLine` only checks network adapter, not actual Firestore connectivity.
**How to avoid:** On `online` event, transition to "syncing" (not "synced"). Only transition to "synced" when pending write count reaches 0 or when the next successful onSnapshot fires. Use a brief timeout (e.g., 3 seconds) as a fallback if no pending writes exist.
**Warning signs:** Icon flickers green immediately on reconnect, before data is actually synced.

### Pitfall 3: Error State Persists After Successful Retry
**What goes wrong:** User taps Retry, write succeeds, but icon stays red.
**Why it happens:** The retry success path doesn't reset error state and pending count.
**How to avoid:** The retry function must explicitly call `setSyncStatus('synced')` on success and reset `retryCount`.
**Warning signs:** Red icon that never clears without page reload.

### Pitfall 4: Pending Write Counter Gets Out of Sync
**What goes wrong:** Syncing spinner shows forever because pending count never reaches 0.
**Why it happens:** If an error path doesn't decrement the counter, or if the counter is incremented but the write promise is swallowed.
**How to avoid:** Use a simple approach: increment on Dexie hook fire, decrement in both `.then()` and `.catch()` of the Firestore call. Or even simpler: don't count individual writes -- just set "syncing" when any write starts and "synced" after a short debounce (300ms) of no new writes.
**Warning signs:** Blue spinner that never stops.

### Pitfall 5: Popover Blocks Header Interaction on Mobile
**What goes wrong:** Popover opens but covers critical header elements or extends off-screen.
**Why it happens:** Mobile header is narrow (px-4 py-2); popover needs careful positioning.
**How to avoid:** Position popover below the icon, right-aligned. Use `position: absolute` relative to the icon container. Add max-width and ensure it doesn't extend past viewport edges.
**Warning signs:** Popover text cut off on small screens.

## Code Examples

### Cloud Icon Mapping (Verified: lucide-react 0.575.0 exports confirmed)
```typescript
import { CloudCheck, CloudUpload, CloudOff, CloudAlert } from 'lucide-react';

const SYNC_ICONS = {
  synced:  { Icon: CloudCheck,  color: 'text-emerald-500', spin: false },
  syncing: { Icon: CloudUpload, color: 'text-blue-500',    spin: true  },
  offline: { Icon: CloudOff,    color: 'text-amber-500',   spin: false },
  error:   { Icon: CloudAlert,  color: 'text-red-500',     spin: false },
} as const;
```

### Header Integration Point (Desktop)
```typescript
// In App.tsx desktop header, add after the Settings button:
<SyncStatusIcon />

// The icon sits in the existing flex container with gap-3
```

### Header Integration Point (Mobile)
```typescript
// In MobileLayout.tsx header, add to the right side:
<header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
  <h1 className="text-lg font-semibold text-slate-800">taskpad</h1>
  <SyncStatusIcon />
</header>
```

### Popover Messages
```typescript
const SYNC_MESSAGES = {
  synced:  'All changes synced',
  syncing: 'Syncing changes...',
  offline: 'Offline \u2014 changes saved locally',
  error:   'Sync failed \u2014 check your connection and try again',
} as const;
```

### Spinner Animation (Tailwind)
```typescript
// For the syncing state, wrap icon in a spinning container:
<div className={spin ? 'animate-spin' : ''}>
  <Icon className={`w-5 h-5 ${color}`} />
</div>
```
Note: `animate-spin` rotates continuously. If that feels too fast for a cloud icon, use a custom slower spin via Tailwind arbitrary animation: `animate-[spin_2s_linear_infinite]`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom event emitters for React | `useSyncExternalStore` (React 18+) | React 18 (2022) | Built-in, concurrent-safe, no library needed |
| Firestore `enableNetwork`/`disableNetwork` for manual offline | Firestore SDK auto-handles offline/online | Firebase SDK v9+ | SDK buffers writes and retries automatically on reconnect |

**Deprecated/outdated:**
- `navigator.connection` API: Still experimental, inconsistent support. Stick with `navigator.onLine` + `online`/`offline` events.
- Firestore `waitForPendingWrites()`: Exists but returns a promise that resolves when ALL pending writes complete. Could be useful for the synced->syncing transition but must be used carefully (it resolves once, not continuously).

## Open Questions

1. **How to detect "all writes synced" after reconnect?**
   - What we know: Firestore SDK buffers writes and auto-retries on reconnect. `waitForPendingWrites()` resolves when all pending writes are flushed.
   - What's unclear: Whether `waitForPendingWrites()` is reliable in all edge cases (e.g., if new writes come in during flush).
   - Recommendation: Use a debounce approach -- after the last outbound write completes (via `.then()`), wait 300ms. If no new writes start, transition to "synced". This is simpler and more predictable than `waitForPendingWrites()`.

2. **Should the popover auto-dismiss?**
   - What we know: CONTEXT.md specifies popover on click/tap for all states, with Retry/Dismiss on error.
   - What's unclear: Whether non-error popovers should auto-dismiss after a timeout.
   - Recommendation: Auto-dismiss non-error popovers after 3 seconds or on outside click. Error popover stays until Retry or Dismiss is clicked.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/firebase/sync.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-03 | Sync status transitions (synced/syncing/offline) | unit | `npx vitest run src/firebase/sync.test.ts -t "sync status"` | Extend existing |
| DATA-03 | useSyncStatus hook returns correct status | unit | `npx vitest run src/hooks/useSyncStatus.test.ts` | Wave 0 |
| DATA-04 | handleSyncError retries 2x then sets error state | unit | `npx vitest run src/firebase/sync.test.ts -t "retry"` | Extend existing |
| DATA-04 | Retry button clears error and re-triggers write | unit | `npx vitest run src/firebase/sync.test.ts -t "retry clear"` | Extend existing |

### Sampling Rate
- **Per task commit:** `npx vitest run src/firebase/sync.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `src/firebase/sync.test.ts` -- add tests for sync status state machine, retry logic, online/offline transitions
- [ ] `src/hooks/useSyncStatus.test.ts` -- test hook subscription (may require jsdom environment or mock useSyncExternalStore)

Note: Component rendering tests (SyncStatusIcon) are not practical with the current `environment: 'node'` vitest config. The unit tests focus on the sync module logic (state machine, retry counting) which runs in Node fine. Visual behavior (icon rendering, popover) is verified manually.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/firebase/sync.ts`, `src/App.tsx`, `src/components/mobile/MobileLayout.tsx`, `src/components/mobile/OfflineIndicator.tsx`, `src/contexts/AuthContext.tsx`
- lucide-react 0.575.0 -- CloudCheck, CloudUpload, CloudOff, CloudAlert all confirmed exported via Node require
- React 19 useSyncExternalStore -- stable API since React 18, available in project's React 19

### Secondary (MEDIUM confidence)
- Firestore `waitForPendingWrites()` -- documented in Firebase JS SDK docs but edge case behavior unverified

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, icon exports verified
- Architecture: HIGH -- follows existing patterns (context/hook pattern from AuthContext, event listeners from OfflineIndicator)
- Pitfalls: MEDIUM -- race condition between online event and Firestore reconnect is real but mitigation is straightforward

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, no fast-moving dependencies)
