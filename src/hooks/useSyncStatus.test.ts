import { describe, it, expect, vi } from 'vitest';

// Mock the sync module
const mockSubscribeSyncStatus = vi.fn();
const mockGetSyncStatusSnapshot = vi.fn();

vi.mock('../firebase/sync', () => ({
  subscribeSyncStatus: (...args: unknown[]) => mockSubscribeSyncStatus(...args),
  getSyncStatusSnapshot: () => mockGetSyncStatusSnapshot(),
}));

// Mock React's useSyncExternalStore
const mockUseSyncExternalStore = vi.fn();

vi.mock('react', () => ({
  useSyncExternalStore: (...args: unknown[]) => mockUseSyncExternalStore(...args),
}));

// Import after mocks are set up
import { useSyncStatus } from './useSyncStatus';

describe('useSyncStatus', () => {
  it('returns the current sync status from getSyncStatusSnapshot', () => {
    mockUseSyncExternalStore.mockReturnValue('synced');
    const result = useSyncStatus();
    expect(result).toBe('synced');
  });

  it('calls useSyncExternalStore with subscribeSyncStatus and getSyncStatusSnapshot', () => {
    mockUseSyncExternalStore.mockReturnValue('syncing');
    useSyncStatus();

    expect(mockUseSyncExternalStore).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );

    // Verify the subscribe function passed is our mock
    const subscribeArg = mockUseSyncExternalStore.mock.calls[0][0];
    const snapshotArg = mockUseSyncExternalStore.mock.calls[0][1];

    // Call them to verify they delegate to the right mocks
    subscribeArg('test-callback');
    expect(mockSubscribeSyncStatus).toHaveBeenCalledWith('test-callback');

    snapshotArg();
    expect(mockGetSyncStatusSnapshot).toHaveBeenCalled();
  });

  it('returns different status values correctly', () => {
    for (const status of ['synced', 'syncing', 'offline', 'error'] as const) {
      mockUseSyncExternalStore.mockReturnValue(status);
      expect(useSyncStatus()).toBe(status);
    }
  });
});
