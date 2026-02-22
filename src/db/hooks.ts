import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import type { Category } from '../types';

/**
 * Returns tasks for a specific date.
 * Filters out 'done' status unless showCompleted is true.
 */
export function useTasksByDate(date: string, showCompleted: boolean) {
  return useLiveQuery(
    () => {
      const query = db.tasks.where('date').equals(date);
      if (!showCompleted) {
        return query.filter((t) => t.status !== 'done').toArray();
      }
      return query.toArray();
    },
    [date, showCompleted]
  );
}

/**
 * Returns tasks for a date range (inclusive).
 * Used for calendar month view and list view.
 */
export function useTasksByDateRange(
  startDate: string,
  endDate: string,
  showCompleted: boolean
) {
  return useLiveQuery(
    () => {
      const query = db.tasks
        .where('date')
        .between(startDate, endDate, true, true);
      if (!showCompleted) {
        return query.filter((t) => t.status !== 'done').toArray();
      }
      return query.toArray();
    },
    [startDate, endDate, showCompleted]
  );
}

/**
 * Returns all categories.
 */
export function useCategories() {
  return useLiveQuery(() => db.categories.toArray());
}

/**
 * Returns a Map<number, Category> for O(1) lookup by ID.
 */
export function useCategoryMap() {
  return useLiveQuery(async () => {
    const categories = await db.categories.toArray();
    const map = new Map<number, Category>();
    for (const cat of categories) {
      if (cat.id !== undefined) {
        map.set(cat.id, cat);
      }
    }
    return map;
  });
}

/**
 * Returns total count of tasks in the database.
 * Useful for detecting empty state (fresh app).
 */
export function useTaskCount() {
  return useLiveQuery(() => db.tasks.count());
}
