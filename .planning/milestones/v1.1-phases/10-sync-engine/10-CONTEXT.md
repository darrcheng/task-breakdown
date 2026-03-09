# Phase 10: Sync Engine - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Bidirectional Dexie-Firestore sync with offline-first, conflict resolution, echo guard, and data migration. Tasks created, edited, or deleted on one device appear on all other devices in real-time. The app works offline and existing local tasks are preserved on first sign-in. No sync status indicator or error UX -- those are Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Sync scope
- All three Dexie tables sync: tasks, categories, aiSettings
- AI settings: sync model preferences (provider, model name) but NOT API keys -- keys stay local-only, re-entered per device
- Categories: all categories sync (defaults + any user-created)
- On fresh device with Firestore data: pull categories from Firestore, do NOT re-seed defaults locally (avoids duplicates)
- Only seed default categories if Firestore has no categories (first device ever)

### Migration behavior
- On first sign-in, automatically upload all local tasks, categories, and AI prefs to Firestore (no user confirmation dialog)
- Show "Setting up sync..." spinner during migration -- no per-task progress bar
- On second device sign-in with existing local tasks: merge both -- upload local to Firestore, pull down cloud tasks that don't exist locally (union of all data)
- ID conflict resolution: Firestore doc ID is source of truth, not Dexie auto-increment IDs. Generate unique Firestore doc IDs on migration, update parentId references for subtask hierarchy accordingly

### Firestore data shape
- Subcollections under user doc: `users/{uid}/tasks/{taskId}`, `users/{uid}/categories/{catId}`, `users/{uid}/aiSettings/{settingId}`
- Matches existing wildcard security rule `users/{userId}/{document=**}`
- Subtasks stored flat in same `tasks` collection with `parentId` field (mirrors Dexie structure)
- Firestore documents mirror exact Dexie schema -- same field names and types, only ID type differs (string in Firestore, number in Dexie)
- Hard delete -- when a task is deleted locally, delete the Firestore doc. No soft-delete tombstones
- Conflict resolution: last-write-wins using `updatedAt` timestamp (per SYNC-04 requirement)

### Sync lifecycle
- Firestore onSnapshot listener active at all times while authenticated -- start on sign-in, stop on sign-out
- Firestore SDK handles offline/online transitions automatically (no manual visibility tracking)
- Local-to-Firestore writes via Dexie hooks/middleware -- every Dexie write automatically triggers Firestore write. Existing app code stays unchanged
- Echo guard: use `hasPendingWrites` from snapshot metadata to skip re-processing own writes (per SYNC-05 requirement)
- Sign-out order: unsubscribe Firestore listener FIRST, then db.delete() to wipe Dexie. Prevents Dexie hooks from firing deletes to Firestore during wipe
- All tabs sync independently -- every tab runs its own onSnapshot listener and Dexie hooks. No leader election. Echo guard prevents duplicate processing. Slightly more Firestore reads but negligible for personal use on Spark plan

### Claude's Discretion
- Dexie hook implementation details (creating/updating/deleting middleware)
- Firestore persistence configuration (initializeFirestore with persistentLocalCache)
- ID generation strategy for Firestore doc IDs during migration
- Migration detection mechanism (how to know it's "first sign-in")
- Error handling for failed Firestore writes during sync
- Batch write strategy for migration (Firestore batch vs individual writes)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/database.ts`: Dexie DB with 3 tables (tasks, categories, aiSettings) -- Dexie hooks can be added here
- `src/db/hooks.ts`: All useLiveQuery hooks -- these stay UNCHANGED (SYNC-03 requirement)
- `src/firebase/config.ts`: Firebase app + `firestore` export (currently uses `getFirestore`, needs `initializeFirestore` for persistence)
- `src/firebase/auth.ts`: Auth module with `signOutUser()` -- sign-out cleanup order ties in here
- `src/components/auth/AuthProvider.tsx`: Auth context with `useAuth()` hook -- sync init can trigger here on auth state change

### Established Patterns
- Dexie.js is sole UI data source via `useLiveQuery` -- Firestore is sync transport only, never directly read by UI
- Auto-increment numeric IDs in Dexie -- need mapping layer to/from Firestore string doc IDs
- `db.delete()` on sign-out (Phase 9 decision) -- sync must unsubscribe before this call
- Firebase exports use `firestore` (not `db`) to avoid shadowing Dexie export

### Integration Points
- `src/firebase/config.ts`: Switch from `getFirestore` to `initializeFirestore` with persistence config
- `src/db/database.ts`: Add Dexie hooks for outbound sync (creating/updating/deleting)
- `src/components/auth/AuthProvider.tsx` or new sync provider: Start/stop onSnapshot on auth change
- `src/firebase/auth.ts` `signOutUser()`: Add sync unsubscribe before `db.delete()`
- New file: `src/firebase/sync.ts` (or similar) for sync engine logic

</code_context>

<specifics>
## Specific Ideas

- All tabs sync independently was chosen specifically to avoid leader election complexity and the "what if the leader tab closes" problem
- Dexie hooks approach chosen so existing app code needs zero changes -- sync is transparent to UI layer
- API keys explicitly excluded from sync for security -- user re-enters on each device

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 10-sync-engine*
*Context gathered: 2026-03-08*
