import { useSyncExternalStore } from 'react';
import { subscribeSyncStatus, getSyncStatusSnapshot } from '../firebase/sync';
import type { SyncStatus } from '../firebase/sync';

/**
 * React hook that provides reactive sync status.
 * Uses useSyncExternalStore to subscribe to the sync module's state machine.
 * Returns one of: 'synced' | 'syncing' | 'offline' | 'error'
 */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatusSnapshot);
}
