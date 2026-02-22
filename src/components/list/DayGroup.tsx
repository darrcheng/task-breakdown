import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { isToday } from '../../utils/dates';
import { TaskListItem } from './TaskListItem';
import { TaskInlineCreate } from '../task/TaskInlineCreate';
import { TaskInlineEdit } from '../task/TaskInlineEdit';
import type { Task, Category } from '../../types';

interface DayGroupProps {
  date: string;
  tasks: Task[];
  categoryMap?: Map<number, Category>;
  onDayClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
}

export function DayGroup({
  date,
  tasks,
  categoryMap,
}: DayGroupProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const dateObj = parseISO(date);
  const today = isToday(dateObj);
  const dateLabel = today
    ? `Today - ${format(dateObj, 'MMMM d')}`
    : format(dateObj, 'EEEE, MMMM d, yyyy');

  return (
    <div id={`day-${date}`} className="mb-4">
      {/* Sticky date header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <h3
          className={`text-sm font-semibold ${
            today ? 'text-blue-600' : 'text-slate-700'
          }`}
        >
          {dateLabel}
        </h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-sm text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
          aria-label={`Add task for ${dateLabel}`}
        >
          +
        </button>
      </div>

      {/* Inline create */}
      {isCreating && (
        <TaskInlineCreate date={date} onClose={() => setIsCreating(false)} />
      )}

      {/* Tasks */}
      <div className="px-4 py-2 space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) =>
            editingTaskId === task.id ? (
              <TaskInlineEdit
                key={task.id}
                task={task}
                onClose={() => setEditingTaskId(null)}
              />
            ) : (
              <TaskListItem
                key={task.id}
                task={task}
                categoryMap={categoryMap}
                onClick={(t) => setEditingTaskId(t.id ?? null)}
              />
            )
          )
        ) : (
          !isCreating && (
            <p className="text-sm text-slate-300 py-2 italic">No tasks</p>
          )
        )}
      </div>
    </div>
  );
}
