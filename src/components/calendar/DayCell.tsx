import { useMemo } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTasksByDate } from '../../db/hooks';
import { formatDateKey, isToday, isSameMonth } from '../../utils/dates';
import { TaskCard } from '../task/TaskCard';
import { DraggableTask } from '../dnd/DraggableTask';
import { DroppableDay } from '../dnd/DroppableDay';
import type { Task, Category, EnergyLevel } from '../../types';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  showCompleted: boolean;
  categoryMap?: Map<number, Category>;
  onDayClick: (date: string, clickPosition?: { x: number; y: number }) => void;
  onTaskClick: (task: Task, clickPosition?: { x: number; y: number }) => void;
  energyFilter?: EnergyLevel | null;
}

export function DayCell({
  date,
  currentMonth,
  showCompleted,
  categoryMap,
  onDayClick,
  onTaskClick,
  energyFilter,
}: DayCellProps) {
  const dateStr = formatDateKey(date);
  const tasks = useTasksByDate(dateStr, showCompleted, energyFilter);
  const taskIds = useMemo(() => (tasks ?? []).map((t) => `task-${t.id}`), [tasks]);
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);

  const handleCellClick = (e: React.MouseEvent) => {
    onDayClick(dateStr, { x: e.clientX, y: e.clientY });
  };

  return (
    <DroppableDay
      dateStr={dateStr}
      className={clsx(
        'min-h-[80px] p-1.5 border-b border-r border-slate-200 cursor-pointer transition-colors flex flex-col',
        isCurrentMonth ? 'bg-white' : 'bg-slate-50',
        'hover:bg-slate-50/80'
      )}
    >
      <div onClick={handleCellClick} className="flex-1 flex flex-col">
        <div
          className={clsx(
            'w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto',
            today
              ? 'bg-red-500 text-white'
              : isCurrentMonth
                ? 'text-slate-700'
                : 'text-slate-400'
          )}
        >
          {format(date, 'd')}
        </div>
        <div className="space-y-1 flex-1">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks?.map((task) => (
              <DraggableTask key={task.id} task={task}>
                <TaskCard
                  task={task}
                  categoryMap={categoryMap}
                  onClick={(t, e) => {
                    e?.stopPropagation();
                    onTaskClick(t, e ? { x: e.clientX, y: e.clientY } : undefined);
                  }}
                />
              </DraggableTask>
            ))}
          </SortableContext>
        </div>
      </div>
    </DroppableDay>
  );
}
