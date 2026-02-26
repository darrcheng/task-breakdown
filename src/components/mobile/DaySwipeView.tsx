import { useSwipeable } from 'react-swipeable';
import { format, addDays, subDays } from 'date-fns';
import { Plus } from 'lucide-react';
import { useTasksByDate } from '../../db/hooks';
import { TaskListItem } from '../list/TaskListItem';
import { formatDateKey } from '../../utils/dates';
import type { Task, Category, EnergyLevel } from '../../types';

interface DaySwipeViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  showCompleted: boolean;
  categoryMap?: Map<number, Category>;
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
  energyFilter?: EnergyLevel | null;
}

/**
 * Single-day task view with horizontal swipe navigation.
 * Swipe left = next day, swipe right = previous day.
 * Shows all tasks for the current date using TaskListItem.
 */
export function DaySwipeView({
  currentDate,
  onDateChange,
  showCompleted,
  categoryMap,
  onTaskClick,
  onAddTask,
  energyFilter,
}: DaySwipeViewProps) {
  const dateKey = formatDateKey(currentDate);
  const tasks = useTasksByDate(dateKey, showCompleted, energyFilter);

  const handlers = useSwipeable({
    onSwipedLeft: () => onDateChange(addDays(currentDate, 1)),
    onSwipedRight: () => onDateChange(subDays(currentDate, 1)),
    delta: 50,
    trackTouch: true,
    preventScrollOnSwipe: false,
  });

  return (
    <div {...handlers} className="flex-1 flex flex-col overflow-y-auto">
      {/* Day header with month context */}
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {format(currentDate, 'EEEE, MMMM d')}
        </h2>
      </div>

      {/* Task list */}
      <div className="flex-1 px-4 pb-4">
        {!tasks || tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p className="text-sm">No tasks for this day</p>
            <button
              onClick={() => onAddTask(dateKey)}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a task
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                categoryMap={categoryMap}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {/* Add task button at bottom */}
            <button
              onClick={() => onAddTask(dateKey)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
