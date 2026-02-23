import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import type { Category, EnergyLevel } from '../types';
import { formatDateKey } from '../utils/dates';

/**
 * Returns tasks for a specific date.
 * Filters out 'done' status unless showCompleted is true.
 * Optionally filters by energyLevel (null = no filter).
 */
export function useTasksByDate(date: string, showCompleted: boolean, energyFilter?: EnergyLevel | null) {
  return useLiveQuery(
    () => {
      const query = db.tasks.where('date').equals(date);
      if (!showCompleted) {
        return query.filter((t) => t.status !== 'done' && !t.isSomeday && !t.parentId && (!energyFilter || t.energyLevel === energyFilter)).toArray();
      }
      return query.filter((t) => !t.isSomeday && !t.parentId && (!energyFilter || t.energyLevel === energyFilter)).toArray();
    },
    [date, showCompleted, energyFilter]
  );
}

/**
 * Returns tasks for a date range (inclusive).
 * Used for calendar month view and list view.
 * Optionally filters by energyLevel (null = no filter).
 */
export function useTasksByDateRange(
  startDate: string,
  endDate: string,
  showCompleted: boolean,
  energyFilter?: EnergyLevel | null
) {
  return useLiveQuery(
    () => {
      const query = db.tasks
        .where('date')
        .between(startDate, endDate, true, true);
      if (!showCompleted) {
        return query.filter((t) => t.status !== 'done' && !t.isSomeday && !t.parentId && (!energyFilter || t.energyLevel === energyFilter)).toArray();
      }
      return query.filter((t) => !t.isSomeday && !t.parentId && (!energyFilter || t.energyLevel === energyFilter)).toArray();
    },
    [startDate, endDate, showCompleted, energyFilter]
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

/**
 * Returns subtasks for a given parent task, sorted by sortOrder.
 */
export function useSubtasks(parentId: number | undefined) {
  return useLiveQuery(
    () =>
      parentId !== undefined
        ? db.tasks.where('parentId').equals(parentId).sortBy('sortOrder')
        : [],
    [parentId]
  );
}

/**
 * Returns the count of subtasks for a given task.
 * Used for displaying parent badges.
 */
export function useSubtaskCount(taskId: number | undefined) {
  return useLiveQuery(
    () =>
      taskId !== undefined
        ? db.tasks.where('parentId').equals(taskId).count()
        : 0,
    [taskId]
  );
}

/**
 * Returns all overdue incomplete root tasks (past today's date, not someday).
 */
export function useOverdueTasks() {
  const today = formatDateKey(new Date());
  return useLiveQuery(
    () =>
      db.tasks
        .where('date')
        .below(today)
        .filter((t) => t.status !== 'done' && !t.isSomeday && !t.parentId)
        .toArray(),
    [today],
  );
}

/**
 * Returns all tasks in the Someday list (root tasks only).
 */
export function useSomedayTasks() {
  return useLiveQuery(
    () => db.tasks.filter((t) => !!t.isSomeday && !t.parentId).toArray(),
  );
}
