import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday as dateFnsIsToday,
  isSameMonth as dateFnsIsSameMonth,
} from 'date-fns';

/**
 * Returns all days to display in a calendar grid.
 * From start-of-week of month start to end-of-week of month end.
 * Typically 35 or 42 days.
 */
export function getCalendarDays(month: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn });
  return eachDayOfInterval({ start, end });
}

/**
 * Returns 7 days for the week containing the given date.
 */
export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  const end = endOfWeek(date, { weekStartsOn });
  return eachDayOfInterval({ start, end });
}

/**
 * Formats a Date to 'yyyy-MM-dd' string using local timezone.
 * Use this for all date keys stored in IndexedDB.
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Returns all dates in a range (inclusive). Used for list view.
 */
export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/**
 * Re-export date-fns isToday.
 */
export const isToday = dateFnsIsToday;

/**
 * Re-export date-fns isSameMonth.
 */
export const isSameMonth = dateFnsIsSameMonth;
