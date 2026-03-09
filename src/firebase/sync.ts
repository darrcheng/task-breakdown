import { collection, onSnapshot, setDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import type { DocumentChange, DocumentData } from 'firebase/firestore';
import { firestore } from './config';
import { db } from '../db/database';
import type { Task, Category, AISettings } from '../types';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** Guards Dexie hooks from firing during sign-out */
let syncEnabled = false;

/** Guards against echo loop (inbound writes don't trigger outbound hooks) */
let syncWriteInProgress = false;

/** Current authenticated user */
let currentUid: string | null = null;

/** Guards migration state for UI spinner */
let migrating = false;

/** Active onSnapshot unsubscribe functions */
let unsubscribers: (() => void)[] = [];

// ---------------------------------------------------------------------------
// Sync status state machine
// ---------------------------------------------------------------------------

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let syncStatus: SyncStatus = 'synced';
const statusListeners = new Set<() => void>();
let retryCount = 0;
const MAX_SILENT_RETRIES = 2;
const RETRY_DELAYS = [2000, 4000];
let pendingWrites = 0;
let syncedDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let onlineListenerCleanup: (() => void) | null = null;

function emitChange(): void {
  for (const listener of statusListeners) {
    listener();
  }
}

function setSyncStatus(status: SyncStatus): void {
  if (syncStatus !== status) {
    syncStatus = status;
    emitChange();
  }
}

/**
 * Subscribe to sync status changes.
 * Returns an unsubscribe function (compatible with useSyncExternalStore).
 */
export function subscribeSyncStatus(callback: () => void): () => void {
  statusListeners.add(callback);
  return () => {
    statusListeners.delete(callback);
  };
}

/**
 * Returns the current sync status snapshot (compatible with useSyncExternalStore).
 */
export function getSyncStatusSnapshot(): SyncStatus {
  return syncStatus;
}

/**
 * Clears error state and sets status to 'syncing'.
 * The Firestore SDK's persistentLocalCache will auto-retry buffered writes;
 * this just clears the UI error state.
 */
export function retrySync(): void {
  retryCount = 0;
  setSyncStatus('syncing');
  // Fallback: if still syncing after 3s with no pending writes, set synced
  setTimeout(() => {
    if (syncStatus === 'syncing' && pendingWrites === 0) {
      setSyncStatus('synced');
    }
  }, 3000);
}

/**
 * Sets up window online/offline event listeners.
 * Returns a cleanup function.
 */
export function setupOnlineListener(): () => void {
  const handleOffline = () => {
    setSyncStatus('offline');
  };

  const handleOnline = () => {
    setSyncStatus('syncing');
    // Fallback: if still syncing after 3s with no pending writes, set synced
    setTimeout(() => {
      if (syncStatus === 'syncing' && pendingWrites === 0) {
        setSyncStatus('synced');
      }
    }, 3000);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

// ---------------------------------------------------------------------------
// Getter functions
// ---------------------------------------------------------------------------

export function isSyncEnabled(): boolean {
  return syncEnabled;
}

export function isSyncWriteInProgress(): boolean {
  return syncWriteInProgress;
}

export function getCurrentUid(): string | null {
  return currentUid;
}

export function isMigrating(): boolean {
  return migrating;
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

type DexieRecord = Task | Category | AISettings;

/**
 * Prepares a Dexie record for Firestore storage.
 * Removes the `id` field since Firestore uses the doc ID separately.
 * All other fields are preserved as-is (Firestore SDK auto-converts Date to Timestamp).
 */
export function serializeForFirestore(
  record: DexieRecord,
  _id: number
): Record<string, unknown> {
  const { id, ...rest } = record as DexieRecord & { id?: number };
  return rest;
}

/**
 * Serializes only the modified fields for a Firestore updateDoc call.
 * Removes `id` if present in modifications.
 */
export function serializeModifications(
  modifications: Record<string, unknown>
): Record<string, unknown> {
  const { id, ...rest } = modifications as Record<string, unknown> & { id?: number };
  return rest;
}

/**
 * Converts Firestore document data back to a Dexie-compatible record.
 * - Sets `id` from the Firestore doc ID (parsed as number)
 * - Converts Timestamp fields (createdAt, updatedAt) via `.toDate()`
 * - Converts `parentId` to number if present
 */
export function deserializeFromFirestore(
  data: Record<string, unknown>,
  docId: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...data,
    id: Number(docId),
  };

  // Convert Firestore Timestamps to JS Dates
  for (const field of ['createdAt', 'updatedAt']) {
    const value = result[field];
    if (value && typeof value === 'object' && 'toDate' in (value as object)) {
      result[field] = (value as { toDate: () => Date }).toDate();
    }
  }

  // Convert parentId to number if present
  if (result.parentId !== undefined && result.parentId !== null) {
    result.parentId = Number(result.parentId);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Inbound sync: process a single onSnapshot document change
// ---------------------------------------------------------------------------

type TableName = 'tasks' | 'categories' | 'aiSettings';

/**
 * Processes a single inbound Firestore document change.
 * Exported for testability.
 *
 * - Echo guard: skips changes where hasPendingWrites is true
 * - LWW: for tasks, only accepts remote changes with newer updatedAt
 * - For categories/aiSettings: always overwrites (simpler data)
 * - Removed docs trigger Dexie delete
 */
export async function processInboundChange(
  change: DocumentChange<DocumentData>,
  tableName: TableName
): Promise<void> {
  // Echo guard: skip our own pending writes echoed back via onSnapshot
  if (change.doc.metadata.hasPendingWrites) {
    return;
  }

  const docId = change.doc.id;
  const numericId = Number(docId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = db[tableName] as any;

  if (change.type === 'removed') {
    syncWriteInProgress = true;
    try {
      await table.delete(numericId);
    } catch {
      // Ignore "not found" errors
    } finally {
      syncWriteInProgress = false;
    }
    return;
  }

  // 'added' or 'modified'
  const rawData = change.doc.data();
  const deserialized = deserializeFromFirestore(rawData, docId);

  // LWW for tasks: compare updatedAt timestamps
  if (tableName === 'tasks') {
    const existing = await db.tasks.get(numericId);
    if (existing) {
      const localUpdatedAt = existing.updatedAt instanceof Date
        ? existing.updatedAt.getTime()
        : 0;
      const remoteUpdatedAt = deserialized.updatedAt instanceof Date
        ? (deserialized.updatedAt as Date).getTime()
        : 0;

      if (remoteUpdatedAt <= localUpdatedAt) {
        // Remote is older or same -- reject
        return;
      }
    }
    // Either no existing record or remote is newer -- accept
  }

  syncWriteInProgress = true;
  try {
    await table.put(deserialized);
  } finally {
    syncWriteInProgress = false;
  }
}

// ---------------------------------------------------------------------------
// Error handler for outbound sync writes with retry logic
// ---------------------------------------------------------------------------

async function handleSyncError(error: unknown, retryFn?: () => Promise<void>): Promise<void> {
  console.error('Sync write failed:', error);

  if (retryFn && retryCount < MAX_SILENT_RETRIES) {
    const delay = RETRY_DELAYS[retryCount];
    retryCount++;
    await new Promise(resolve => setTimeout(resolve, delay));
    try {
      await retryFn();
      retryCount = 0;
      setSyncStatus('synced');
    } catch (retryError) {
      await handleSyncError(retryError, retryFn);
    }
  } else if (retryFn) {
    // Exhausted retries
    setSyncStatus('error');
    retryCount = 0;
  }
}

/**
 * Tracks an outbound write promise for sync status transitions.
 * Increments pendingWrites, sets status to 'syncing', and on settle
 * decrements pendingWrites. When pendingWrites reaches 0, debounces 300ms
 * then sets status to 'synced'.
 */
function trackOutboundWrite(promise: Promise<void>): void {
  pendingWrites++;
  if (syncStatus !== 'offline' && syncStatus !== 'error') {
    setSyncStatus('syncing');
  }

  const onSettle = () => {
    pendingWrites--;
    if (pendingWrites === 0 && syncStatus === 'syncing') {
      if (syncedDebounceTimer) clearTimeout(syncedDebounceTimer);
      syncedDebounceTimer = setTimeout(() => {
        if (pendingWrites === 0 && syncStatus === 'syncing') {
          setSyncStatus('synced');
        }
        syncedDebounceTimer = null;
      }, 300);
    }
  };

  promise.then(onSettle, onSettle);
}

// ---------------------------------------------------------------------------
// Dexie hooks for outbound sync
// ---------------------------------------------------------------------------

/**
 * Registers Dexie table hooks on all 3 tables for outbound sync.
 * Should be called once at app startup (before any writes).
 * Hooks check isSyncEnabled() and isSyncWriteInProgress() on each invocation,
 * so they are safe to register even before auth.
 */
export function setupDexieHooks(): void {
  const tables = ['tasks', 'categories', 'aiSettings'] as const;

  for (const tableName of tables) {
    // Use Dexie.Table to access hook() with looser typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = db[tableName] as any;

    // Creating hook: fire setDoc after successful Dexie insert
    table.hook('creating', function (
      this: { onsuccess: ((resultKey: number) => void) | undefined },
      _primKey: number,
      obj: DexieRecord,
    ) {
      this.onsuccess = (resultKey: number) => {
        if (!isSyncEnabled() || isSyncWriteInProgress()) return;
        const uid = getCurrentUid();
        if (!uid) return;
        const docRef = doc(firestore, `users/${uid}/${tableName}/${resultKey}`);
        const doWrite = () => setDoc(docRef, serializeForFirestore(obj, resultKey));
        trackOutboundWrite(
          doWrite().catch(err => handleSyncError(err, doWrite))
        );
      };
    });

    // Updating hook: fire updateDoc/setDoc after successful Dexie update
    table.hook('updating', function (
      this: { onsuccess: (() => void) | undefined },
      modifications: Record<string, unknown>,
      primKey: number,
      obj: DexieRecord,
    ) {
      this.onsuccess = () => {
        if (!isSyncEnabled() || isSyncWriteInProgress()) return;
        const uid = getCurrentUid();
        if (!uid) return;
        const docRef = doc(firestore, `users/${uid}/${tableName}/${primKey}`);
        const doWrite = tableName === 'tasks'
          ? () => updateDoc(docRef, serializeModifications(modifications))
          : () => setDoc(docRef, serializeForFirestore({ ...obj, ...modifications } as DexieRecord, primKey), { merge: true });
        trackOutboundWrite(
          doWrite().catch(err => handleSyncError(err, doWrite))
        );
      };
    });

    // Deleting hook: fire deleteDoc after successful Dexie delete
    table.hook('deleting', function (
      this: { onsuccess: (() => void) | undefined },
      primKey: number,
    ) {
      this.onsuccess = () => {
        if (!isSyncEnabled() || isSyncWriteInProgress()) return;
        const uid = getCurrentUid();
        if (!uid) return;
        const docRef = doc(firestore, `users/${uid}/${tableName}/${primKey}`);
        const doWrite = () => deleteDoc(docRef);
        trackOutboundWrite(
          doWrite().catch(err => handleSyncError(err, doWrite))
        );
      };
    });
  }
}

// ---------------------------------------------------------------------------
// Sync lifecycle
// ---------------------------------------------------------------------------

/**
 * Starts real-time sync for the given user.
 * Sets up onSnapshot listeners for all synced collections.
 */
export function startSync(uid: string): void {
  syncEnabled = true;
  currentUid = uid;

  // Set up online/offline listener
  onlineListenerCleanup = setupOnlineListener();

  // Check initial online status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setSyncStatus('offline');
  }

  const tables: TableName[] = ['tasks', 'categories', 'aiSettings'];

  for (const tableName of tables) {
    const collectionRef = collection(firestore, `users/${uid}/${tableName}`);
    const unsub = onSnapshot(collectionRef, (snapshot) => {
      for (const change of snapshot.docChanges()) {
        processInboundChange(change, tableName).catch(err => handleSyncError(err));
      }
    });
    unsubscribers.push(unsub);
  }

  console.log(`Sync started for user: ${uid}`);
}

/**
 * Stops real-time sync and cleans up listeners.
 */
export function stopSync(): void {
  syncEnabled = false;
  currentUid = null;
  for (const unsub of unsubscribers) {
    unsub();
  }
  unsubscribers = [];

  // Clean up online listener
  if (onlineListenerCleanup) {
    onlineListenerCleanup();
    onlineListenerCleanup = null;
  }

  // Reset sync status state
  setSyncStatus('synced');
  retryCount = 0;
  pendingWrites = 0;
  if (syncedDebounceTimer) {
    clearTimeout(syncedDebounceTimer);
    syncedDebounceTimer = null;
  }

  console.log('Sync stopped');
}

/**
 * Migrates all local Dexie data to Firestore on first sign-in.
 * Handles three scenarios:
 * - First device (Firestore empty): uploads all local data
 * - Second device (both have data): uploads only non-duplicate records (union merge)
 * - Fresh device (Dexie empty): returns immediately (cloud data arrives via onSnapshot)
 *
 * Batch writes are chunked at 450 operations to stay under Firestore's 500-op limit.
 */
export async function migrateLocalData(uid: string): Promise<void> {
  migrating = true;
  try {
    // Read all local data
    const localTasks = await db.tasks.toArray();
    const localCategories = await db.categories.toArray();
    const localAiSettings = await db.aiSettings.toArray();

    // Fresh device: nothing to upload
    if (localTasks.length === 0 && localCategories.length === 0 && localAiSettings.length === 0) {
      return;
    }

    // Check what already exists in Firestore
    const existingTaskDocs = await getDocs(collection(firestore, `users/${uid}/tasks`));
    const existingTaskIds = new Set(existingTaskDocs.docs.map((d: { id: string }) => d.id));

    const existingCatDocs = await getDocs(collection(firestore, `users/${uid}/categories`));
    const existingCatIds = new Set(existingCatDocs.docs.map((d: { id: string }) => d.id));

    const existingAiDocs = await getDocs(collection(firestore, `users/${uid}/aiSettings`));
    const existingAiIds = new Set(existingAiDocs.docs.map((d: { id: string }) => d.id));

    // Filter to only records not already in Firestore
    const tasksToUpload = localTasks.filter(t => !existingTaskIds.has(String(t.id)));
    const categoriesToUpload = localCategories.filter(c => !existingCatIds.has(String(c.id)));
    const aiSettingsToUpload = localAiSettings.filter(a => !existingAiIds.has(String(a.id)));

    // Build flat list of all operations
    const allOps: { table: string; record: DexieRecord }[] = [
      ...tasksToUpload.map(t => ({ table: 'tasks', record: t as DexieRecord })),
      ...categoriesToUpload.map(c => ({ table: 'categories', record: c as DexieRecord })),
      ...aiSettingsToUpload.map(a => ({ table: 'aiSettings', record: a as DexieRecord })),
    ];

    if (allOps.length === 0) {
      return;
    }

    // Batch write in chunks of 450
    for (let i = 0; i < allOps.length; i += 450) {
      const chunk = allOps.slice(i, i + 450);
      const batch = writeBatch(firestore);
      for (const op of chunk) {
        const recordId = (op.record as DexieRecord & { id?: number }).id!;
        const ref = doc(collection(firestore, `users/${uid}/${op.table}`), String(recordId));
        batch.set(ref, serializeForFirestore(op.record, recordId));
      }
      await batch.commit();
    }

    console.log(`Migration complete for user: ${uid} (${allOps.length} records uploaded)`);
  } finally {
    migrating = false;
  }
}
