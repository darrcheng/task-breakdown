import Dexie, { type EntityTable } from 'dexie';
import type { Task, Category, AISettings } from '../types';

const db = new Dexie('TaskBreaker') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  categories: EntityTable<Category, 'id'>;
  aiSettings: EntityTable<AISettings, 'id'>;
};

db.version(1).stores({
  tasks: '++id, date, status, categoryId',
  categories: '++id, name',
});

// v2: Add subtask hierarchy fields and AI settings table
db.version(2).stores({
  tasks: '++id, date, status, categoryId, parentId, depth',
  categories: '++id, name',
  aiSettings: '++id, key',
}).upgrade((tx) => {
  // Existing tasks get depth=0 (root tasks)
  return tx.table('tasks').toCollection().modify((task) => {
    if (task.depth === undefined) {
      task.depth = 0;
    }
  });
});

// v3: Add energy level index and ADHD-optimized fields
db.version(3).stores({
  tasks: '++id, date, status, categoryId, parentId, depth, energyLevel',
  categories: '++id, name',
  aiSettings: '++id, key',
}).upgrade((tx) => {
  // Existing tasks get safe defaults for new fields
  return tx.table('tasks').toCollection().modify((task) => {
    task.energyLevel = null;
    task.timeEstimate = null;
    task.timeEstimateOverride = null;
    task.isSomeday = false;
  });
});

// v4: Add sortOrder index for within-day task reordering
db.version(4).stores({
  tasks: '++id, date, status, categoryId, parentId, depth, energyLevel, sortOrder',
  categories: '++id, name',
  aiSettings: '++id, key',
}).upgrade((tx) => {
  // Assign sortOrder=0 to existing root tasks that lack it
  return tx.table('tasks').toCollection().modify((task) => {
    if (task.sortOrder === undefined && task.depth === 0) {
      task.sortOrder = 0;
    }
  });
});

// Seed default categories on first use.
// Default categories seeded here will be overwritten by Firestore sync
// when onSnapshot delivers categories with matching IDs. No dedup needed
// because sync uses db.categories.put() which upserts by primary key.
db.on('populate', (tx) => {
  tx.table('categories').bulkAdd([
    { name: 'Work', icon: 'briefcase', isDefault: true },
    { name: 'Personal', icon: 'user', isDefault: true },
    { name: 'Health', icon: 'heart', isDefault: true },
    { name: 'Learning', icon: 'book-open', isDefault: true },
    { name: 'Errands', icon: 'shopping-cart', isDefault: true },
  ]);
});

export { db };

// Register Dexie hooks for outbound sync (creating/updating/deleting).
// Hooks are registered once at module load time and check isSyncEnabled()
// on each invocation, so they are safe to register before auth.
import { setupDexieHooks } from '../firebase/sync';
setupDexieHooks();
