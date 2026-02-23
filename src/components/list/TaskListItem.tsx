import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { CATEGORY_ICONS, STATUS_COLORS, getNextStatus } from '../../utils/categories';
import { ParentBadge } from '../task/ParentBadge';
import { db } from '../../db/database';
import type { Task, Category, TaskStatus } from '../../types';

interface TaskListItemProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task) => void;
}

export function TaskListItem({ task, categoryMap, onClick }: TaskListItemProps) {
  const [departing, setDeparting] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<TaskStatus>(task.status);
  const departureTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = STATUS_COLORS[task.status];
  const category = categoryMap?.get(task.categoryId);
  const IconComponent = category
    ? CATEGORY_ICONS[category.icon]
    : CATEGORY_ICONS['folder'];

  const statusLabel =
    displayStatus === 'todo'
      ? 'To do'
      : displayStatus === 'in-progress'
        ? 'In progress'
        : 'Done';

  useEffect(() => {
    return () => {
      if (departureTimeout.current) {
        clearTimeout(departureTimeout.current);
      }
    };
  }, []);

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.id) return;

    if (departing) {
      // Re-click during departure: cancel and cycle back to todo
      if (departureTimeout.current) {
        clearTimeout(departureTimeout.current);
        departureTimeout.current = null;
      }
      setDeparting(false);
      setDisplayStatus('todo');
      await db.tasks.update(task.id, {
        status: 'todo',
        updatedAt: new Date(),
      });
      return;
    }

    const nextStatus = getNextStatus(task.status);
    if (nextStatus === 'done') {
      setDeparting(true);
      setDisplayStatus('done');
      departureTimeout.current = setTimeout(async () => {
        await db.tasks.update(task.id!, {
          status: 'done',
          updatedAt: new Date(),
        });
        departureTimeout.current = null;
      }, 1500);
    } else {
      setDisplayStatus(nextStatus);
      await db.tasks.update(task.id, {
        status: nextStatus,
        updatedAt: new Date(),
      });
    }
  };

  return (
    <div
      onClick={() => onClick?.(task)}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left cursor-pointer transition-colors',
        colors.bg,
        colors.border,
        'hover:opacity-80',
        departing && 'ring-2 ring-emerald-400 ring-offset-1 line-through decoration-green-600 text-green-600 opacity-0 transition-all duration-[1500ms]'
      )}
    >
      {/* Status indicator - clickable to cycle */}
      <button
        onClick={handleStatusClick}
        className={clsx(
          'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors',
          displayStatus === 'done'
            ? 'bg-emerald-500 border-emerald-500'
            : displayStatus === 'in-progress'
              ? 'bg-amber-400 border-amber-400'
              : 'bg-white border-slate-400 hover:border-slate-500'
        )}
        title={`Status: ${statusLabel}. Click to cycle.`}
      />

      {IconComponent && (
        <IconComponent className={clsx('w-4 h-4 flex-shrink-0', departing ? 'text-green-600' : colors.text)} />
      )}
      <span className={clsx('flex-1 font-medium text-sm', departing ? 'text-green-600' : colors.text)}>
        {task.title}
      </span>
      {task.id && <ParentBadge taskId={task.id} />}
      <span
        className={clsx(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          colors.bg,
          departing ? 'text-green-600' : colors.text,
          'border',
          colors.border
        )}
      >
        {statusLabel}
      </span>
    </div>
  );
}
