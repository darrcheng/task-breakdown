import Dexie, { type EntityTable } from 'dexie';
import type { Task, Category } from '../types';

const db = new Dexie('TaskBreaker') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  categories: EntityTable<Category, 'id'>;
};

db.version(1).stores({
  tasks: '++id, date, status, categoryId',
  categories: '++id, name',
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
