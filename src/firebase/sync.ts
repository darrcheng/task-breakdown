import { collection, onSnapshot, setDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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

/** Active onSnapshot unsubscribe functions */
let unsubscribers: (() => void)[] = [];

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

  if (change.type === 'removed') {
    syncWriteInProgress = true;
    try {
      await db[tableName].delete(numericId);
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
    await db[tableName].put(deserialized);
  } finally {
    syncWriteInProgress = false;
  }
}

// ---------------------------------------------------------------------------
// Error handler for outbound sync writes
// ---------------------------------------------------------------------------

function handleSyncError(error: unknown): void {
  console.error('Sync write failed:', error);
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
    const table = db[tableName];

    // Creating hook: fire setDoc after successful Dexie insert
    table.hook('creating', function (this: { onsuccess: (fn: (resultKey: number) => void) => void } & { onsuccess: ((key: number) => void) | null }, _primKey: number, obj: DexieRecord) {
      this.onsuccess = (resultKey: number) => {
        if (!isSyncEnabled() || isSyncWriteInProgress()) return;
        const uid = getCurrentUid();
        if (!uid) return;
        const docRef = doc(firestore, `users/${uid}/${tableName}/${resultKey}`);
        setDoc(docRef, serializeForFirestore(obj, resultKey)).catch(handleSyncError);
      };
    });

    // Updating hook: fire updateDoc/setDoc after successful Dexie update
    table.hook('updating', function (this: { onsuccess: ((fn: () => void) => void) | null } & { onsuccess: (() => void) | null }, modifications: Record<string, unknown>, primKey: number, obj: DexieRecord) {
      this.onsuccess = () => {
        if (!isSyncEnabled() || isSyncWriteInProgress()) return;
        const uid = getCurrentUid();
        if (!uid) return;
        const docRef = doc(firestore, `users/${uid}/${tableName}/${primKey}`);
        if (tableName === 'tasks') {
          updateDoc(docRef, serializeModifications(modifications)).catch(handleSyncError);
        } else {
          setDoc(docRef, serializeForFirestore({ ...obj, ...modifications } as DexieRecord, primKey), { merge: true }).catch(handleSyncError);
        }
      };
    });

    // Deleting hook: fire deleteDoc after successful Dexie delete
    table.hook('deleting', function (this: { onsuccess: ((fn: () => void) => void) | null } & { onsuccess: (() => void) | null }, primKey: number) {
      this.onsuccess = () => {
        if (!isSyncEnabled() || isSyncWriteInProgress()) return;
        const uid = getCurrentUid();
        if (!uid) return;
        const docRef = doc(firestore, `users/${uid}/${tableName}/${primKey}`);
        deleteDoc(docRef).catch(handleSyncError);
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

  const tables: TableName[] = ['tasks', 'categories', 'aiSettings'];

  for (const tableName of tables) {
    const collectionRef = collection(firestore, `users/${uid}/${tableName}`);
    const unsub = onSnapshot(collectionRef, (snapshot) => {
      for (const change of snapshot.docChanges()) {
        processInboundChange(change, tableName).catch(handleSyncError);
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
  console.log('Sync stopped');
}

/**
 * Migrates all local Dexie data to Firestore on first sign-in.
 * STUB: full implementation in Plan 03.
 */
export async function migrateLocalData(uid: string): Promise<void> {
  console.log(`Migration stub called for user: ${uid}`);
}
