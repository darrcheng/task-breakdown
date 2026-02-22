import { format } from 'date-fns';
import clsx from 'clsx';
import { useTasksByDate } from '../../db/hooks';
import { formatDateKey, isToday, isSameMonth } from '../../utils/dates';
import { TaskCard } from '../task/TaskCard';
import type { Task, Category } from '../../types';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  showCompleted: boolean;
  categoryMap?: Map<number, Category>;
  onDayClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
}

export function DayCell({
  date,
  currentMonth,
  showCompleted,
  categoryMap,
  onDayClick,
  onTaskClick,
}: DayCellProps) {
  const dateStr = formatDateKey(date);
  const tasks = useTasksByDate(dateStr, showCompleted);
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);

  return (
    <div
      onClick={() => onDayClick(dateStr)}
      className={clsx(
        'min-h-[80px] p-1.5 border-b border-r border-slate-200 cursor-pointer transition-colors',
        isCurrentMonth ? 'bg-white' : 'bg-slate-50',
        today && 'ring-2 ring-blue-400 ring-inset',
        'hover:bg-slate-50/80'
      )}
    >
      <div
        className={clsx(
          'text-sm font-medium mb-1',
          today
            ? 'text-blue-600'
            : isCurrentMonth
              ? 'text-slate-700'
              : 'text-slate-400'
        )}
      >
        {format(date, 'd')}
      </div>
      <div className="space-y-1">
        {tasks?.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            categoryMap={categoryMap}
            onClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}
