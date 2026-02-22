import clsx from 'clsx';
import { CATEGORY_ICONS, STATUS_COLORS } from '../../utils/categories';
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

  return (
    <button
      onClick={() => onClick?.(task)}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left cursor-pointer transition-colors',
        colors.bg,
        colors.border,
        'hover:opacity-80'
      )}
    >
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
    </button>
  );
}
