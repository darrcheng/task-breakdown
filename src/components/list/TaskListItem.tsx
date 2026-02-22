import clsx from 'clsx';
import { CATEGORY_ICONS, STATUS_COLORS, getNextStatus } from '../../utils/categories';
import { db } from '../../db/database';
import type { Task, Category } from '../../types';

interface TaskListItemProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task) => void;
}

export function TaskListItem({ task, categoryMap, onClick }: TaskListItemProps) {
  const colors = STATUS_COLORS[task.status];
  const category = categoryMap?.get(task.categoryId);
  const IconComponent = category
    ? CATEGORY_ICONS[category.icon]
    : CATEGORY_ICONS['folder'];

  const statusLabel =
    task.status === 'todo'
      ? 'To do'
      : task.status === 'in-progress'
        ? 'In progress'
        : 'Done';

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.id) {
      await db.tasks.update(task.id, {
        status: getNextStatus(task.status),
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
        'hover:opacity-80'
      )}
    >
      {/* Status indicator - clickable to cycle */}
      <button
        onClick={handleStatusClick}
        className={clsx(
          'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors',
          task.status === 'done'
            ? 'bg-emerald-500 border-emerald-500'
            : task.status === 'in-progress'
              ? 'bg-amber-400 border-amber-400'
              : 'bg-white border-slate-400 hover:border-slate-500'
        )}
        title={`Status: ${statusLabel}. Click to cycle.`}
      />

      {IconComponent && (
        <IconComponent className={clsx('w-4 h-4 flex-shrink-0', colors.text)} />
      )}
      <span className={clsx('flex-1 font-medium text-sm', colors.text)}>
        {task.title}
      </span>
      <span
        className={clsx(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          colors.bg,
          colors.text,
          'border',
          colors.border
        )}
      >
        {statusLabel}
      </span>
    </div>
  );
}
