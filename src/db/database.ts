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

// Seed default categories on first use
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
