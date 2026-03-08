import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  serializeForFirestore,
  deserializeFromFirestore,
  processInboundChange,
  isSyncWriteInProgress,
} from './sync';

// Mock the database module
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('../db/database', () => ({
  db: {
    tasks: { get: (...args: unknown[]) => mockGet(...args), put: (...args: unknown[]) => mockPut(...args), delete: (...args: unknown[]) => mockDelete(...args), hook: vi.fn() },
    categories: { get: (...args: unknown[]) => mockGet(...args), put: (...args: unknown[]) => mockPut(...args), delete: (...args: unknown[]) => mockDelete(...args), hook: vi.fn() },
    aiSettings: { get: (...args: unknown[]) => mockGet(...args), put: (...args: unknown[]) => mockPut(...args), delete: (...args: unknown[]) => mockDelete(...args), hook: vi.fn() },
  },
}));

// Mock firebase/firestore (prevent actual Firestore initialization)
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
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

describe('migration', () => {
  it.todo('uploads all local data on first sign-in');
});
