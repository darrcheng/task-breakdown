import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { isToday } from '../../utils/dates';
import { formatDailyTotal } from '../../utils/estimateCalibration';
import { TaskListItem } from './TaskListItem';
import { TaskInlineCreate } from '../task/TaskInlineCreate';
import { DraggableTask } from '../dnd/DraggableTask';
import { DroppableDay } from '../dnd/DroppableDay';
import { SwipeableTaskRow } from '../mobile/SwipeableTaskRow';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { db } from '../../db/database';
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
  onTaskClick,
}: DayGroupProps) {
  const [isCreating, setIsCreating] = useState(false);
  const isMobile = useIsMobile();
  // Per-task completion trigger refs: swipe-complete invokes TaskListItem's celebration pipeline
  const completeRefs = useRef<Map<number, () => void>>(new Map());

  // Listen for Enter-key inline create event dispatched from App.tsx
  useEffect(() => {
    const handleInlineCreate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.date === date) {
        setIsCreating(true);
      }
    };
    window.addEventListener('taskbreaker:inline-create', handleInlineCreate);
    return () => window.removeEventListener('taskbreaker:inline-create', handleInlineCreate);
  }, [date]);

  const taskIds = useMemo(() => tasks.map((t) => `task-${t.id}`), [tasks]);
  const dayTaskIds = useMemo(() => tasks.map((t) => t.id!).filter(Boolean), [tasks]);

  const dateObj = parseISO(date);
  const today = isToday(dateObj);
  const dateLabel = today
    ? `Today - ${format(dateObj, 'MMMM d')}`
    : format(dateObj, 'EEEE, MMMM d, yyyy');
  const dailyTotal = formatDailyTotal(tasks);

  return (
    <DroppableDay dateStr={date} className="mb-4">
      <div id={`day-${date}`}>
        {/* Sticky date header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2 flex items-center justify-between">
          <h3
            className={`text-sm font-semibold ${
              today ? 'text-blue-600' : 'text-slate-700'
            }`}
          >
            {dateLabel}
            {dailyTotal && <span className="text-slate-400 font-normal ml-1">({dailyTotal})</span>}
          </h3>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-500 transition-colors"
            aria-label={`Add task for ${dateLabel}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Inline create */}
        {isCreating && (
          <TaskInlineCreate date={date} onClose={() => setIsCreating(false)} />
        )}

        {/* Tasks */}
        <div
          className="px-4 py-2 space-y-2 min-h-[40px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreating(true);
            }
          }}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <DraggableTask key={task.id} task={task}>
                  {isMobile ? (
                    <SwipeableTaskRow
                      onComplete={() => {
                        if (task.id) {
                          completeRefs.current.get(task.id)?.();
                        }
                      }}
                      onDelete={async () => {
                        if (task.id) {
                          await db.tasks.delete(task.id);
                        }
                      }}
                      isCompleted={task.status === 'done'}
                    >
                      <TaskListItem
                        task={task}
                        categoryMap={categoryMap}
                        onClick={onTaskClick}
                        dayTaskIds={dayTaskIds}
                        onRegisterComplete={(fn) => {
                          if (task.id) completeRefs.current.set(task.id, fn);
                        }}
                      />
                    </SwipeableTaskRow>
                  ) : (
                    <TaskListItem
                      task={task}
                      categoryMap={categoryMap}
                      onClick={onTaskClick}
                      dayTaskIds={dayTaskIds}
                    />
                  )}
                </DraggableTask>
              ))
            ) : (
              !isCreating && (
                <p className="text-sm text-slate-300 py-2 italic pointer-events-none">
                  Click to add a task
                </p>
              )
            )}
          </SortableContext>
        </div>
      </div>
    </DroppableDay>
  );
}
