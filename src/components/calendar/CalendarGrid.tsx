import { getCalendarDays, formatDateKey } from '../../utils/dates';
import { DayCell } from './DayCell';
import type { Task, Category } from '../../types';

const ALL_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarGridProps {
  month: Date;
  showCompleted: boolean;
  categoryMap?: Map<number, Category>;
  onDayClick: (date: string, clickPosition?: { x: number; y: number }) => void;
  onTaskClick: (task: Task, clickPosition?: { x: number; y: number }) => void;
  weekStartsOn?: 0 | 1;
}

export function CalendarGrid({
  month,
  showCompleted,
  categoryMap,
  onDayClick,
  onTaskClick,
  weekStartsOn = 0,
}: CalendarGridProps) {
  const days = getCalendarDays(month, weekStartsOn);
  const dayNames = weekStartsOn === 1
    ? [...ALL_DAY_NAMES.slice(1), ALL_DAY_NAMES[0]]
    : ALL_DAY_NAMES;

  return (
    <div className="flex-1 overflow-auto">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        {dayNames.map((name) => (
          <div
            key={name}
            className="px-2 py-2 text-xs font-semibold text-slate-500 text-center uppercase tracking-wider"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid - auto rows expand to fit content */}
      <div
        className="grid grid-cols-7 border-l border-t border-slate-200"
        style={{ gridAutoRows: 'minmax(80px, auto)' }}
      >
        {days.map((day) => (
          <DayCell
            key={formatDateKey(day)}
            date={day}
            currentMonth={month}
            showCompleted={showCompleted}
            categoryMap={categoryMap}
            onDayClick={onDayClick}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}
