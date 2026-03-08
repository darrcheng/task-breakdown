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
// Sync lifecycle (stubs -- implemented in Plan 02)
// ---------------------------------------------------------------------------

/**
 * Starts real-time sync for the given user.
 * Sets up onSnapshot listeners for all synced collections.
 * STUB: full implementation in Plan 02.
 */
export function startSync(uid: string): void {
  syncEnabled = true;
  currentUid = uid;
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
