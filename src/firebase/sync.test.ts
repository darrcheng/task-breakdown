import { describe, it, expect } from 'vitest';
import {
  serializeForFirestore,
  deserializeFromFirestore,
} from './sync';

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
  it.todo('skips changes with hasPendingWrites=true');
});

describe('LWW conflict resolution', () => {
  it.todo('accepts remote change with newer updatedAt');
  it.todo('rejects remote change with older updatedAt');
});

describe('migration', () => {
  it.todo('uploads all local data on first sign-in');
});
