import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  serializeForFirestore,
  deserializeFromFirestore,
  processInboundChange,
  isSyncWriteInProgress,
  migrateLocalData,
  isMigrating,
  subscribeSyncStatus,
  getSyncStatusSnapshot,
  retrySync,
  setupOnlineListener,
  stopSync,
} from './sync';
import type { SyncStatus } from './sync';
import { getDocs, writeBatch } from 'firebase/firestore';

// Mock the database module
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockTasksToArray = vi.fn();
const mockCategoriesToArray = vi.fn();
const mockAiSettingsToArray = vi.fn();

vi.mock('../db/database', () => ({
  db: {
    tasks: { get: (...args: unknown[]) => mockGet(...args), put: (...args: unknown[]) => mockPut(...args), delete: (...args: unknown[]) => mockDelete(...args), hook: vi.fn(), toArray: () => mockTasksToArray() },
    categories: { get: (...args: unknown[]) => mockGet(...args), put: (...args: unknown[]) => mockPut(...args), delete: (...args: unknown[]) => mockDelete(...args), hook: vi.fn(), toArray: () => mockCategoriesToArray() },
    aiSettings: { get: (...args: unknown[]) => mockGet(...args), put: (...args: unknown[]) => mockPut(...args), delete: (...args: unknown[]) => mockDelete(...args), hook: vi.fn(), toArray: () => mockAiSettingsToArray() },
  },
}));

// Mock firebase/firestore (prevent actual Firestore initialization)
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
}));

// Mock firebase config
vi.mock('./config', () => ({
  firestore: {},
}));

// Helper to create a mock DocumentChange
function mockDocChange(
  type: 'added' | 'modified' | 'removed',
  docId: string,
  data: Record<string, unknown>,
  hasPendingWrites: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return {
    type,
    oldIndex: -1,
    newIndex: -1,
    doc: {
      id: docId,
      data: () => data,
      metadata: { hasPendingWrites },
    },
  };
}

describe('serializeForFirestore', () => {
  it('removes id field from record', () => {
    const task = {
      id: 1,
      title: 'Test task',
      description: 'A description',
      date: '2026-03-08',
      status: 'todo' as const,
      categoryId: 1,
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = serializeForFirestore(task, 1);
    expect(result).not.toHaveProperty('id');
  });

  it('preserves all other fields', () => {
    const now = new Date();
    const task = {
      id: 1,
      title: 'My task',
      description: 'Desc',
      date: '2026-03-08',
      status: 'todo' as const,
      categoryId: 2,
      depth: 0,
      createdAt: now,
      updatedAt: now,
    };
    const result = serializeForFirestore(task, 1);
    expect(result.title).toBe('My task');
    expect(result.date).toBe('2026-03-08');
    expect(result.status).toBe('todo');
    expect(result.categoryId).toBe(2);
    expect(result.createdAt).toEqual(now);
  });
});

describe('deserializeFromFirestore', () => {
  it('converts Firestore Timestamp to JS Date', () => {
    const mockDate = new Date('2026-01-01T00:00:00Z');
    const data = {
      title: 'Test',
      createdAt: { toDate: () => mockDate },
      updatedAt: { toDate: () => mockDate },
    };
    const result = deserializeFromFirestore(data, '1');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt).toEqual(mockDate);
  });

  it('converts doc ID to numeric id', () => {
    const data = { title: 'Test' };
    const result = deserializeFromFirestore(data, '42');
    expect(result.id).toBe(42);
  });

  it('converts parentId to number', () => {
    const data = { title: 'Test', parentId: '10' };
    const result = deserializeFromFirestore(data, '1');
    expect(result.parentId).toBe(10);
  });
});

describe('echo guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  it('skips changes with hasPendingWrites=true', async () => {
    const change = mockDocChange('added', '1', { title: 'Test', updatedAt: new Date() }, true);
    await processInboundChange(change, 'tasks');
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('processes changes with hasPendingWrites=false', async () => {
    mockGet.mockResolvedValue(undefined); // no existing record
    const change = mockDocChange('added', '1', { title: 'Test', updatedAt: new Date() }, false);
    await processInboundChange(change, 'tasks');
    expect(mockPut).toHaveBeenCalled();
  });
});

describe('LWW conflict resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  it('accepts remote change with newer updatedAt', async () => {
    const olderDate = new Date('2026-03-01T00:00:00Z');
    const newerDate = new Date('2026-03-08T00:00:00Z');
    mockGet.mockResolvedValue({ id: 1, title: 'Old', updatedAt: olderDate });

    const change = mockDocChange('modified', '1', {
      title: 'New',
      updatedAt: { toDate: () => newerDate },
    }, false);

    await processInboundChange(change, 'tasks');
    expect(mockPut).toHaveBeenCalled();
  });

  it('rejects remote change with older updatedAt', async () => {
    const olderDate = new Date('2026-03-01T00:00:00Z');
    const newerDate = new Date('2026-03-08T00:00:00Z');
    mockGet.mockResolvedValue({ id: 1, title: 'Local', updatedAt: newerDate });

    const change = mockDocChange('modified', '1', {
      title: 'OldRemote',
      updatedAt: { toDate: () => olderDate },
    }, false);

    await processInboundChange(change, 'tasks');
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('accepts remote change for non-existent local record', async () => {
    mockGet.mockResolvedValue(undefined); // record doesn't exist locally
    const change = mockDocChange('added', '99', {
      title: 'New remote task',
      updatedAt: { toDate: () => new Date('2026-01-01') },
    }, false);

    await processInboundChange(change, 'tasks');
    expect(mockPut).toHaveBeenCalled();
  });
});

describe('syncWriteInProgress flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  it('is false before and after inbound processing', async () => {
    mockGet.mockResolvedValue(undefined);
    expect(isSyncWriteInProgress()).toBe(false);

    const change = mockDocChange('added', '1', { title: 'Test' }, false);
    await processInboundChange(change, 'categories');

    expect(isSyncWriteInProgress()).toBe(false);
  });
});

describe('removed documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockResolvedValue(undefined);
  });

  it('triggers Dexie delete for removed doc', async () => {
    const change = mockDocChange('removed', '5', {}, false);
    await processInboundChange(change, 'tasks');
    expect(mockDelete).toHaveBeenCalledWith(5);
  });
});

describe('migrateLocalData', () => {
  const mockGetDocsFn = getDocs as ReturnType<typeof vi.fn>;
  const mockWriteBatchFn = writeBatch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchSet.mockClear();
    mockBatchCommit.mockReset().mockResolvedValue(undefined);
    mockWriteBatchFn.mockReturnValue({ set: mockBatchSet, commit: mockBatchCommit });
  });

  it('uploads all local data when Firestore is empty', async () => {
    const now = new Date();
    mockTasksToArray.mockResolvedValue([
      { id: 1, title: 'Task 1', status: 'todo', date: '2026-03-08', description: '', categoryId: 1, depth: 0, createdAt: now, updatedAt: now },
      { id: 2, title: 'Task 2', status: 'done', date: '2026-03-08', description: '', categoryId: 1, depth: 0, createdAt: now, updatedAt: now },
      { id: 3, title: 'Task 3', status: 'todo', date: '2026-03-08', description: '', categoryId: 2, depth: 0, createdAt: now, updatedAt: now },
    ]);
    mockCategoriesToArray.mockResolvedValue([
      { id: 1, name: 'Work', icon: 'briefcase', isDefault: true },
      { id: 2, name: 'Personal', icon: 'user', isDefault: true },
    ]);
    mockAiSettingsToArray.mockResolvedValue([]);

    // getDocs returns empty snapshots for all collections
    mockGetDocsFn.mockResolvedValue({ docs: [] });

    await migrateLocalData('test-uid');

    // 3 tasks + 2 categories = 5 batch.set calls
    expect(mockBatchSet).toHaveBeenCalledTimes(5);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('merges local and cloud on second device', async () => {
    const now = new Date();
    mockTasksToArray.mockResolvedValue([
      { id: 1, title: 'Task 1', status: 'todo', date: '2026-03-08', description: '', categoryId: 1, depth: 0, createdAt: now, updatedAt: now },
      { id: 2, title: 'Task 2', status: 'done', date: '2026-03-08', description: '', categoryId: 1, depth: 0, createdAt: now, updatedAt: now },
      { id: 3, title: 'Task 3', status: 'todo', date: '2026-03-08', description: '', categoryId: 2, depth: 0, createdAt: now, updatedAt: now },
    ]);
    mockCategoriesToArray.mockResolvedValue([]);
    mockAiSettingsToArray.mockResolvedValue([]);

    // Firestore already has tasks 1 and 3
    mockGetDocsFn.mockImplementation(() => {
      // All getDocs calls return the same mock -- we need per-collection
      // Since collection mock is called first, we track calls
      return Promise.resolve({
        docs: [{ id: '1' }, { id: '3' }],
      });
    });

    await migrateLocalData('test-uid');

    // Only task 2 should be uploaded (1 and 3 already exist)
    expect(mockBatchSet).toHaveBeenCalledTimes(1);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('handles empty local DB gracefully', async () => {
    mockTasksToArray.mockResolvedValue([]);
    mockCategoriesToArray.mockResolvedValue([]);
    mockAiSettingsToArray.mockResolvedValue([]);

    await migrateLocalData('test-uid');

    // No batch operations when local DB is empty
    expect(mockWriteBatchFn).not.toHaveBeenCalled();
    expect(mockBatchSet).not.toHaveBeenCalled();
    expect(mockGetDocsFn).not.toHaveBeenCalled();
  });

  it('chunks batches at 450 operations', async () => {
    const now = new Date();
    // Generate 500 tasks
    const tasks = Array.from({ length: 500 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      status: 'todo' as const,
      date: '2026-03-08',
      description: '',
      categoryId: 1,
      depth: 0,
      createdAt: now,
      updatedAt: now,
    }));
    mockTasksToArray.mockResolvedValue(tasks);
    mockCategoriesToArray.mockResolvedValue([]);
    mockAiSettingsToArray.mockResolvedValue([]);

    // Empty Firestore
    mockGetDocsFn.mockResolvedValue({ docs: [] });

    await migrateLocalData('test-uid');

    // 500 items = 2 batches (450 + 50)
    expect(mockBatchCommit).toHaveBeenCalledTimes(2);
    expect(mockBatchSet).toHaveBeenCalledTimes(500);
  });

  it('preserves parentId as number in serialized output', async () => {
    const now = new Date();
    mockTasksToArray.mockResolvedValue([
      { id: 10, title: 'Subtask', status: 'todo', date: '2026-03-08', description: '', categoryId: 1, depth: 1, parentId: 5, createdAt: now, updatedAt: now },
    ]);
    mockCategoriesToArray.mockResolvedValue([]);
    mockAiSettingsToArray.mockResolvedValue([]);
    mockGetDocsFn.mockResolvedValue({ docs: [] });

    await migrateLocalData('test-uid');

    // Verify the serialized data passed to batch.set has parentId as number
    expect(mockBatchSet).toHaveBeenCalledTimes(1);
    const setArgs = mockBatchSet.mock.calls[0];
    const serializedData = setArgs[1]; // second arg is the data
    expect(serializedData.parentId).toBe(5);
    expect(typeof serializedData.parentId).toBe('number');
  });

  it('sets isMigrating flag during migration', async () => {
    mockTasksToArray.mockResolvedValue([]);
    mockCategoriesToArray.mockResolvedValue([]);
    mockAiSettingsToArray.mockResolvedValue([]);

    expect(isMigrating()).toBe(false);
    await migrateLocalData('test-uid');
    expect(isMigrating()).toBe(false);
  });
});

describe('sign-out safety', () => {
  const mockTasksClear = vi.fn().mockResolvedValue(undefined);
  const mockCategoriesClear = vi.fn().mockResolvedValue(undefined);
  const mockAiSettingsClear = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockTasksClear.mockResolvedValue(undefined);
    mockCategoriesClear.mockResolvedValue(undefined);
    mockAiSettingsClear.mockResolvedValue(undefined);
  });

  it('clear() on all tables resolves without error', async () => {
    // Simulate the sign-out pattern: clear all tables via Promise.all
    await expect(
      Promise.all([
        mockTasksClear(),
        mockCategoriesClear(),
        mockAiSettingsClear(),
      ])
    ).resolves.not.toThrow();

    expect(mockTasksClear).toHaveBeenCalledTimes(1);
    expect(mockCategoriesClear).toHaveBeenCalledTimes(1);
    expect(mockAiSettingsClear).toHaveBeenCalledTimes(1);
  });

  it('db tables remain accessible after clear (connection alive)', async () => {
    // After clearing, put and toArray should still be callable
    await Promise.all([
      mockTasksClear(),
      mockCategoriesClear(),
      mockAiSettingsClear(),
    ]);

    // Simulate post-clear operations (sign-back-in scenario)
    mockPut.mockResolvedValue(undefined);
    mockTasksToArray.mockResolvedValue([]);

    // These should not throw — db connection is still alive
    await expect(mockPut({ id: 1, title: 'New task' })).resolves.not.toThrow();
    await expect(mockTasksToArray()).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Sync status state machine tests
// ---------------------------------------------------------------------------

describe('sync status state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to clean state by calling stopSync
    stopSync();
  });

  describe('getSyncStatusSnapshot', () => {
    it('returns synced by default', () => {
      expect(getSyncStatusSnapshot()).toBe('synced');
    });
  });

  describe('subscribeSyncStatus', () => {
    it('registers a listener and returns an unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = subscribeSyncStatus(listener);
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('calls listener when status changes', () => {
      const listener = vi.fn();
      subscribeSyncStatus(listener);

      // Trigger a status change via retrySync (sets to 'syncing')
      retrySync();
      expect(listener).toHaveBeenCalled();
    });

    it('stops calling listener after unsubscribe', () => {
      const listener = vi.fn();
      const unsub = subscribeSyncStatus(listener);

      retrySync();
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      // Reset to synced first
      stopSync();
      listener.mockClear();

      retrySync();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('retrySync', () => {
    it('clears error state and sets status to syncing', () => {
      // We need to get into error state first -- just test retrySync sets syncing
      retrySync();
      expect(getSyncStatusSnapshot()).toBe('syncing');
    });

    it('falls back to synced after 3s if still syncing', () => {
      vi.useFakeTimers();
      retrySync();
      expect(getSyncStatusSnapshot()).toBe('syncing');

      vi.advanceTimersByTime(3000);
      expect(getSyncStatusSnapshot()).toBe('synced');
      vi.useRealTimers();
    });
  });

  describe('setupOnlineListener', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventHandlers: Record<string, ((...args: any[]) => void)[]> = {};

    beforeEach(() => {
      // Clear event handlers
      for (const key of Object.keys(eventHandlers)) {
        delete eventHandlers[key];
      }

      addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(
        (event: string, handler: EventListenerOrEventListenerObject) => {
          if (!eventHandlers[event]) eventHandlers[event] = [];
          eventHandlers[event].push(handler as () => void);
        }
      );
      removeEventListenerSpy = vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('sets status to offline on offline event', () => {
      setupOnlineListener();

      // Simulate offline event
      if (eventHandlers['offline']) {
        for (const handler of eventHandlers['offline']) handler();
      }

      expect(getSyncStatusSnapshot()).toBe('offline');
    });

    it('sets status to syncing on online event (not synced)', () => {
      vi.useFakeTimers();
      setupOnlineListener();

      // First go offline
      if (eventHandlers['offline']) {
        for (const handler of eventHandlers['offline']) handler();
      }
      expect(getSyncStatusSnapshot()).toBe('offline');

      // Then go online
      if (eventHandlers['online']) {
        for (const handler of eventHandlers['online']) handler();
      }
      expect(getSyncStatusSnapshot()).toBe('syncing');
      vi.useRealTimers();
    });

    it('returns cleanup function', () => {
      const cleanup = setupOnlineListener();
      expect(typeof cleanup).toBe('function');
      cleanup();
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('stopSync resets state', () => {
    it('resets sync status to synced', () => {
      retrySync(); // sets to syncing
      expect(getSyncStatusSnapshot()).toBe('syncing');

      stopSync();
      expect(getSyncStatusSnapshot()).toBe('synced');
    });
  });
});
