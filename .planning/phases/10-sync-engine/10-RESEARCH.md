# Phase 10: Sync Engine - Research

**Researched:** 2026-03-08
**Domain:** Bidirectional Dexie-Firestore sync with offline-first, conflict resolution, echo guard, and data migration
**Confidence:** HIGH

## Summary

This phase implements a transparent sync layer between the existing Dexie.js local database and Firebase Firestore. The architecture is "Dexie as source of truth, Firestore as sync transport" -- the UI never reads from Firestore directly, and all existing `useLiveQuery` hooks remain unchanged (SYNC-03). Outbound sync uses Dexie table hooks (`creating`, `updating`, `deleting`) to automatically push local writes to Firestore. Inbound sync uses Firestore `onSnapshot` collection listeners that write received changes into Dexie. An echo guard using `hasPendingWrites` from snapshot metadata prevents the inbound listener from re-processing the current client's own writes, avoiding infinite loops.

The migration path (DATA-02) uploads all existing local data to Firestore on first sign-in, with ID translation from Dexie auto-increment numbers to Firestore string doc IDs. The sign-out flow must unsubscribe the Firestore listener before calling `db.delete()` to prevent Dexie hooks from firing delete operations to Firestore during the local wipe.

**Primary recommendation:** Build a single `src/firebase/sync.ts` module that exports `startSync(uid)` and `stopSync()` functions. Wire `startSync` into the auth state change handler when user becomes authenticated. Wire `stopSync` into the sign-out flow before `db.delete()`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All three Dexie tables sync: tasks, categories, aiSettings
- AI settings: sync model preferences (provider, model name) but NOT API keys -- keys stay local-only, re-entered per device
- Categories: all categories sync (defaults + any user-created)
- On fresh device with Firestore data: pull categories from Firestore, do NOT re-seed defaults locally (avoids duplicates)
- Only seed default categories if Firestore has no categories (first device ever)
- On first sign-in, automatically upload all local tasks, categories, and AI prefs to Firestore (no user confirmation dialog)
- Show "Setting up sync..." spinner during migration -- no per-task progress bar
- On second device sign-in with existing local tasks: merge both -- upload local to Firestore, pull down cloud tasks that don't exist locally (union of all data)
- ID conflict resolution: Firestore doc ID is source of truth, not Dexie auto-increment IDs. Generate unique Firestore doc IDs on migration, update parentId references for subtask hierarchy accordingly
- Subcollections under user doc: `users/{uid}/tasks/{taskId}`, `users/{uid}/categories/{catId}`, `users/{uid}/aiSettings/{settingId}`
- Matches existing wildcard security rule `users/{userId}/{document=**}`
- Subtasks stored flat in same `tasks` collection with `parentId` field (mirrors Dexie structure)
- Firestore documents mirror exact Dexie schema -- same field names and types, only ID type differs (string in Firestore, number in Dexie)
- Hard delete -- when a task is deleted locally, delete the Firestore doc. No soft-delete tombstones
- Conflict resolution: last-write-wins using `updatedAt` timestamp (per SYNC-04 requirement)
- Firestore onSnapshot listener active at all times while authenticated -- start on sign-in, stop on sign-out
- Firestore SDK handles offline/online transitions automatically (no manual visibility tracking)
- Local-to-Firestore writes via Dexie hooks/middleware -- every Dexie write automatically triggers Firestore write. Existing app code stays unchanged
- Echo guard: use `hasPendingWrites` from snapshot metadata to skip re-processing own writes (per SYNC-05 requirement)
- Sign-out order: unsubscribe Firestore listener FIRST, then db.delete() to wipe Dexie. Prevents Dexie hooks from firing deletes to Firestore during wipe
- All tabs sync independently -- every tab runs its own onSnapshot listener and Dexie hooks. No leader election

### Claude's Discretion
- Dexie hook implementation details (creating/updating/deleting middleware)
- Firestore persistence configuration (initializeFirestore with persistentLocalCache)
- ID generation strategy for Firestore doc IDs during migration
- Migration detection mechanism (how to know it's "first sign-in")
- Error handling for failed Firestore writes during sync
- Batch write strategy for migration (Firestore batch vs individual writes)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-01 | Tasks created/edited/deleted on one device appear on other devices in real-time | Dexie hooks for outbound + onSnapshot for inbound; Firestore real-time listeners deliver sub-second latency |
| SYNC-02 | App works offline -- tasks are saved locally and sync when connection returns | Dexie is always local; Firestore `persistentLocalCache` buffers outbound writes; onSnapshot resumes on reconnect |
| SYNC-03 | Dexie.js remains the UI data source -- existing useLiveQuery hooks unchanged | Hooks in `src/db/hooks.ts` read from Dexie only; sync layer writes to Dexie from inbound Firestore data |
| SYNC-04 | Conflict resolution uses last-write-wins with updatedAt timestamp | Inbound snapshot handler compares `updatedAt` before writing to Dexie; Firestore doc always gets latest `updatedAt` |
| SYNC-05 | Sync engine prevents echo loops (own writes don't trigger re-writes via hasPendingWrites) | onSnapshot `docChanges()` entries have `metadata.hasPendingWrites`; skip entries where this is `true` |
| DATA-02 | On first sign-in, existing local tasks are migrated to Firestore | Migration function reads all Dexie tables, generates Firestore doc IDs, batch-writes to Firestore, then starts normal sync |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/firestore | ^12.10.0 (already installed) | Real-time sync transport, offline write buffer | Already in project; provides onSnapshot, batch writes, persistence |
| dexie | ^4.3.0 (already installed) | Local database, UI data source | Already sole data layer; hooks API enables transparent sync |
| dexie-react-hooks | ^4.2.0 (already installed) | React bindings for Dexie queries | Already used by all UI hooks; stays unchanged |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No new libraries needed | - | - | All functionality covered by existing Firebase + Dexie |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie hooks | Dexie middleware (DBCore) | DBCore is lower-level and more powerful but hooks are simpler for this use case and well-documented |
| Firestore persistence | memoryLocalCache | memoryLocalCache loses buffered writes on tab close; persistentLocalCache retains them (STATE.md decision) |
| Manual online/offline tracking | navigator.onLine + visibilitychange | Firestore SDK handles this internally; manual tracking adds complexity with no benefit |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── firebase/
│   ├── config.ts          # Modified: initializeFirestore with persistentLocalCache
│   ├── auth.ts            # Modified: signOutUser adds stopSync() call
│   └── sync.ts            # NEW: sync engine (startSync, stopSync, migration)
├── db/
│   ├── database.ts        # Modified: add Dexie hooks for outbound sync
│   └── hooks.ts           # UNCHANGED (SYNC-03)
├── contexts/
│   └── AuthContext.tsx     # Modified: trigger startSync on auth state change
└── components/
    └── ...                # UNCHANGED
```

### Pattern 1: Outbound Sync via Dexie Hooks
**What:** Every Dexie write (add/put/update/delete) automatically triggers a corresponding Firestore write via table hooks.
**When to use:** All three tables (tasks, categories, aiSettings).
**Example:**
```typescript
// Source: dexie.org/docs/Table/Table.hook('creating')
// Hook runs synchronously; Firestore write is fire-and-forget
db.tasks.hook('creating', function (primKey, obj, trans) {
  // `this.onsuccess` fires after Dexie write succeeds with the actual key
  this.onsuccess = (resultKey: number) => {
    if (!syncEnabled) return;
    const docRef = doc(firestore, `users/${uid}/tasks/${resultKey}`);
    setDoc(docRef, serializeForFirestore(obj, resultKey)).catch(handleSyncError);
  };
});

db.tasks.hook('updating', function (modifications, primKey, obj, trans) {
  this.onsuccess = () => {
    if (!syncEnabled) return;
    const docRef = doc(firestore, `users/${uid}/tasks/${primKey}`);
    updateDoc(docRef, serializeModifications(modifications)).catch(handleSyncError);
  };
});

db.tasks.hook('deleting', function (primKey, obj, trans) {
  this.onsuccess = () => {
    if (!syncEnabled) return;
    const docRef = doc(firestore, `users/${uid}/tasks/${primKey}`);
    deleteDoc(docRef).catch(handleSyncError);
  };
});
```

### Pattern 2: Inbound Sync via onSnapshot with Echo Guard
**What:** Firestore collection listener receives real-time changes and writes them into Dexie. Uses `hasPendingWrites` to skip own writes.
**When to use:** Active whenever authenticated.
**Example:**
```typescript
// Source: firebase.google.com/docs/firestore/query-data/listen
import { collection, onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  collection(firestore, `users/${uid}/tasks`),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // ECHO GUARD: skip changes that originated from this client
      if (change.doc.metadata.hasPendingWrites) return;

      const data = change.doc.data();
      const firestoreId = change.doc.id;
      const dexieId = Number(firestoreId); // ID mapping

      if (change.type === 'added' || change.type === 'modified') {
        // LWW: check updatedAt before writing
        db.tasks.get(dexieId).then(existing => {
          if (!existing || data.updatedAt > existing.updatedAt) {
            db.tasks.put({ ...deserializeFromFirestore(data), id: dexieId });
          }
        });
      }
      if (change.type === 'removed') {
        db.tasks.delete(dexieId).catch(() => {}); // ignore if already gone
      }
    });
  }
);
```

### Pattern 3: Migration on First Sign-in
**What:** Detect first sign-in by checking if Firestore user doc or subcollections are empty. Upload all local Dexie data using batch writes.
**When to use:** Once per user, on first authentication.
**Example:**
```typescript
async function migrateLocalData(uid: string): Promise<void> {
  const tasksRef = collection(firestore, `users/${uid}/tasks`);
  const snapshot = await getDocs(tasksRef);

  if (snapshot.empty) {
    // First device: upload everything
    const localTasks = await db.tasks.toArray();
    const batch = writeBatch(firestore);
    for (const task of localTasks) {
      const docRef = doc(tasksRef, String(task.id));
      batch.set(docRef, serializeForFirestore(task, task.id!));
    }
    await batch.commit(); // max 500 per batch
  } else {
    // Second device: merge (union of local + cloud)
    // Upload local tasks that don't exist in Firestore
    // Pull cloud tasks that don't exist locally
  }
}
```

### Pattern 4: Firestore Persistence Configuration
**What:** Switch from `getFirestore` to `initializeFirestore` with persistent local cache for offline write buffering.
**Example:**
```typescript
// Source: firebase.google.com/docs/firestore/manage-data/enable-offline
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

### Anti-Patterns to Avoid
- **Reading from Firestore in UI components:** Firestore is sync transport only. All UI reads go through Dexie `useLiveQuery` hooks.
- **Using `enableIndexedDbPersistence` (deprecated):** Use `persistentLocalCache` in `initializeFirestore` instead.
- **Calling `signOut` before unsubscribing onSnapshot:** This triggers auth state change which may cause race conditions. Unsubscribe first, then `db.delete()`, then `signOut`.
- **Using `doc.data()` timestamps as-is:** Firestore Timestamps must be converted to JS Date objects for Dexie compatibility. Use `.toDate()` on Firestore Timestamp fields.
- **Syncing API keys:** Security risk. AI settings sync should explicitly exclude `value` field when `key` is an API key.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline write buffering | Custom queue with localStorage | Firestore `persistentLocalCache` | Handles retry, conflict, multi-tab coordination automatically |
| Real-time change detection | Polling or manual WebSocket | Firestore `onSnapshot` | Sub-second latency, automatic reconnection, built-in offline support |
| Multi-tab coordination | Leader election / SharedWorker | Independent listeners per tab + echo guard | Simpler, fewer failure modes; Firestore SDK deduplicates network traffic internally |
| Batch write orchestration | Manual promise batching | Firestore `writeBatch()` | Atomic commits, auto-retry, 500-op limit handled |
| ID generation | UUID library / crypto.randomUUID | `String(dexieId)` for Dexie records; `doc(collection(ref)).id` for new-from-cloud | Simplest mapping; Dexie auto-increment IDs are already unique per user |

**Key insight:** Firestore SDK already solves offline queuing, multi-tab sync, and real-time delivery. The sync engine only needs to bridge Dexie writes to Firestore writes and Firestore changes to Dexie writes.

## Common Pitfalls

### Pitfall 1: Echo Loop (Infinite Sync Cycle)
**What goes wrong:** Dexie hook fires on inbound write -> triggers Firestore write -> triggers onSnapshot -> triggers Dexie write -> repeat.
**Why it happens:** Inbound snapshot handler writes to Dexie, which triggers the outbound Dexie hook.
**How to avoid:** Two guards needed: (1) `hasPendingWrites` echo guard on inbound to skip own writes, (2) a `syncInProgress` flag that Dexie hooks check -- when the sync engine is writing to Dexie from an inbound snapshot, outbound hooks should be suppressed.
**Warning signs:** Rapid Firestore writes in console, browser tab freezing, Firestore quota exhaustion.

### Pitfall 2: Sign-Out Race Condition
**What goes wrong:** `db.delete()` fires Dexie deleting hooks which try to delete Firestore docs, wiping the user's cloud data.
**Why it happens:** Dexie hooks are globally registered and fire on any write, including the bulk delete during `db.delete()`.
**How to avoid:** Set `syncEnabled = false` and unsubscribe onSnapshot BEFORE calling `db.delete()`. The current code in SettingsModal calls `db.delete()` then `signOutUser()` -- this order must be changed to: `stopSync()` -> `db.delete()` -> `signOutUser()`.
**Warning signs:** User signs out and all their Firestore data disappears.

### Pitfall 3: Firestore Timestamp vs JavaScript Date
**What goes wrong:** Firestore stores dates as Timestamp objects. Dexie expects JavaScript Date objects. Direct storage causes type mismatches.
**Why it happens:** Firestore SDK automatically converts JS Date to Firestore Timestamp on write, but returns Timestamp on read.
**How to avoid:** In the inbound deserializer, call `.toDate()` on `createdAt` and `updatedAt` fields from Firestore documents.
**Warning signs:** `useLiveQuery` results show Timestamp objects instead of Date objects; date comparisons fail.

### Pitfall 4: Batch Write 500-Document Limit
**What goes wrong:** Migration of a large local database fails because Firestore `writeBatch` has a 500-operation limit.
**Why it happens:** Users with extensive task history may have hundreds of tasks + categories + AI settings.
**How to avoid:** Chunk batch writes into groups of 450 (leaving margin). Process chunks sequentially.
**Warning signs:** Migration error in console mentioning batch size.

### Pitfall 5: Dexie `db.delete()` Destroys the Database Schema
**What goes wrong:** After `db.delete()`, the Dexie database no longer exists. Subsequent Dexie operations fail until the database is re-opened.
**Why it happens:** `db.delete()` removes the entire IndexedDB database, not just the data.
**How to avoid:** After `db.delete()`, call `db.open()` to recreate the database with schema. Or rely on the page refresh that typically follows sign-out. The current app navigates away after sign-out (auth gate shows SignInScreen), so Dexie hooks won't fire again until next sign-in.
**Warning signs:** "DatabaseClosedError" in console after sign-out.

### Pitfall 6: Category Default Seeding Duplication
**What goes wrong:** Fresh device pulls categories from Firestore, but Dexie's `on('populate')` also seeds defaults, creating duplicates.
**Why it happens:** `db.on('populate')` fires when the database is first created (fresh install or after `db.delete()`).
**How to avoid:** After sign-in on a second device, check if Firestore has categories. If yes, skip the Dexie populate event or delete the defaults and replace with Firestore data. Alternatively, run migration/sync before the populate event fires (but this is tricky with Dexie lifecycle). The cleanest approach: let populate run, then when inbound sync arrives, use `db.categories.clear()` followed by bulk-adding the Firestore categories.
**Warning signs:** Duplicate "Work", "Personal", etc. categories in the UI.

### Pitfall 7: parentId Reference Integrity During Migration
**What goes wrong:** Subtasks reference parent by Dexie numeric ID. If parent ID changes during migration, subtask hierarchy breaks.
**Why it happens:** CONTEXT.md says to use Dexie auto-increment ID as Firestore doc ID (`String(task.id)`), so IDs should NOT change. But on a second device, cloud tasks arrive with string IDs that become numeric Dexie IDs -- the parentId field must also be numeric.
**How to avoid:** Since the decision is to use `String(task.id)` as Firestore doc ID and `Number(doc.id)` on inbound, parentId must be stored as a number in both Dexie and Firestore. When writing to Firestore, store `parentId` as-is (number). When reading from Firestore, ensure `parentId` is parsed as number.
**Warning signs:** Subtasks appear as root tasks; parent-child relationships are broken.

## Code Examples

### Firestore Config Update (config.ts)
```typescript
// Replace getFirestore with initializeFirestore
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

### Serialization Helpers
```typescript
// Convert Dexie record to Firestore-safe document
function serializeForFirestore(record: Record<string, unknown>, id: number): Record<string, unknown> {
  const doc = { ...record };
  delete doc.id; // Firestore doc ID is separate from document fields
  return doc;
}

// Convert Firestore document to Dexie-safe record
function deserializeFromFirestore(data: Record<string, unknown>, docId: string): Record<string, unknown> {
  return {
    ...data,
    id: Number(docId),
    // Convert Firestore Timestamps to JS Dates
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
    // Ensure parentId stays numeric
    parentId: data.parentId != null ? Number(data.parentId) : undefined,
  };
}
```

### Sign-Out Flow (Updated)
```typescript
// In SettingsModal.tsx or auth.ts
async function handleSignOut(): Promise<void> {
  stopSync();              // 1. Unsubscribe Firestore listeners, disable hooks
  await db.delete();       // 2. Wipe local Dexie (hooks won't fire to Firestore)
  await signOutUser();     // 3. Firebase sign-out
}
```

### Sync Enable/Disable Flag Pattern
```typescript
// In sync.ts
let syncEnabled = false;
let syncWriteInProgress = false; // guards against echo in Dexie hooks

export function startSync(uid: string) {
  syncEnabled = true;
  // Set up onSnapshot listeners for all 3 collections
  // ...
}

export function stopSync() {
  syncEnabled = false;
  // Unsubscribe all listeners
  // ...
}

// In Dexie hooks, check both flags:
// if (!syncEnabled || syncWriteInProgress) return;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `enableIndexedDbPersistence()` | `initializeFirestore({ localCache: persistentLocalCache() })` | Firebase JS SDK v10+ | Old API deprecated; new API is simpler and supports multi-tab natively |
| `getFirestore()` then configure | `initializeFirestore()` with config | Firebase JS SDK v10+ | Must be called before any Firestore operation; cannot reconfigure after |
| Dexie Cloud (commercial) | Custom sync via Dexie hooks + Firestore | N/A | Dexie Cloud requires paid subscription; custom sync is free and uses existing Firestore |

**Deprecated/outdated:**
- `enableIndexedDbPersistence()`: Deprecated in favor of `persistentLocalCache` in `initializeFirestore`
- `enableMultiTabIndexedDbPersistence()`: Deprecated in favor of `persistentMultipleTabManager()` in `persistentLocalCache`

## Open Questions

1. **Dexie `on('populate')` vs Firestore category sync timing**
   - What we know: `on('populate')` fires when DB is first created; Firestore categories arrive via onSnapshot after auth
   - What's unclear: Exact ordering -- can we suppress populate, or must we clean up after?
   - Recommendation: Let populate seed defaults, then replace with Firestore data if available. If Firestore has categories, clear+replace local. If Firestore is empty (first device ever), the defaults are correct.

2. **Dexie hooks and `db.delete()` interaction**
   - What we know: `db.delete()` deletes the entire IndexedDB database. It's unclear if Dexie `deleting` hooks fire for each record during `db.delete()`.
   - What's unclear: Whether `db.delete()` triggers per-record hooks or bypasses them entirely.
   - Recommendation: Set `syncEnabled = false` before `db.delete()` regardless. This is the safest approach even if hooks don't fire.

3. **AI settings key filtering during sync**
   - What we know: API keys must not sync. AI settings table stores `{ key: string, value: string }` pairs.
   - What's unclear: Which specific `key` values are API keys vs model preferences.
   - Recommendation: Maintain an explicit allowlist of syncable keys (e.g., `provider`, `model`) or a blocklist of API key names. Research the actual key names used in the AI settings during implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- no test framework installed |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-01 | Task CRUD appears on other devices in real-time | manual-only | Manual: open two browser tabs, create/edit/delete task | N/A -- requires real Firestore |
| SYNC-02 | Works offline, syncs on reconnect | manual-only | Manual: DevTools Network offline toggle, create tasks, go online | N/A -- requires network control |
| SYNC-03 | useLiveQuery hooks unchanged | unit | `npx vitest run src/db/hooks.test.ts` | No -- Wave 0 |
| SYNC-04 | LWW conflict resolution with updatedAt | unit | `npx vitest run src/firebase/sync.test.ts` | No -- Wave 0 |
| SYNC-05 | Echo guard prevents re-writes | unit | `npx vitest run src/firebase/sync.test.ts` | No -- Wave 0 |
| DATA-02 | Local tasks migrated on first sign-in | unit | `npx vitest run src/firebase/sync.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual multi-device verification

### Wave 0 Gaps
- [ ] `vitest` -- install as devDependency: `npm install -D vitest`
- [ ] `vitest.config.ts` -- configure for src/ directory
- [ ] `src/firebase/sync.test.ts` -- covers SYNC-04, SYNC-05, DATA-02 (mock Firestore)
- [ ] `src/db/hooks.test.ts` -- covers SYNC-03 (verify hooks.ts unchanged)

## Sources

### Primary (HIGH confidence)
- [Firebase Firestore onSnapshot docs](https://firebase.google.com/docs/firestore/query-data/listen) - real-time listeners, docChanges(), hasPendingWrites metadata
- [Firebase Firestore offline docs](https://firebase.google.com/docs/firestore/manage-data/enable-offline) - persistentLocalCache, persistentMultipleTabManager configuration
- [Dexie.js Table.hook('creating')](https://dexie.org/docs/Table/Table.hook('creating')) - hook API, primKey, this.onsuccess
- [Dexie.js Table.hook('updating')](https://dexie.org/docs/Table/Table.hook('updating')) - modifications object, async patterns
- [Dexie.js Table.hook('deleting')](https://dexie.org/docs/Table/Table.hook('deleting')) - deletion hook API
- Existing codebase: `src/db/database.ts`, `src/firebase/config.ts`, `src/firebase/auth.ts`, `src/contexts/AuthContext.tsx`

### Secondary (MEDIUM confidence)
- [Firebase PersistentMultipleTabManager API reference](https://firebase.google.com/docs/reference/js/firestore_.persistentmultipletabmanager) - interface details
- [Firebase PersistentLocalCache API reference](https://firebase.google.com/docs/reference/js/firestore_.persistentlocalcache) - configuration options

### Tertiary (LOW confidence)
- [Dexie hooks async behavior](https://github.com/dfahlander/Dexie.js/issues/372) - async in hooks is not natively supported; fire-and-forget pattern needed
- Behavior of `db.delete()` with respect to table hooks -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, APIs well-documented
- Architecture: HIGH - pattern is well-established (Dexie hooks + Firestore onSnapshot); decisions are locked in CONTEXT.md
- Pitfalls: HIGH - echo loop, sign-out race, and timestamp conversion are well-known issues with documented solutions

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- Firebase and Dexie APIs are mature)
