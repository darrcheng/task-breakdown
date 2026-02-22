import clsx from 'clsx';
import { CATEGORY_ICONS, STATUS_COLORS } from '../../utils/categories';
import type { Task, Category } from '../../types';

interface TaskCardProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, categoryMap, onClick }: TaskCardProps) {
  const colors = STATUS_COLORS[task.status];
  const category = categoryMap?.get(task.categoryId);
  const IconComponent = category
    ? CATEGORY_ICONS[category.icon]
    : CATEGORY_ICONS['folder'];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(task);
      }}
      className={clsx(
        'w-full flex items-center gap-1.5 px-2 py-1 rounded border text-left cursor-pointer transition-colors',
        colors.bg,
        colors.border,
        colors.text,
        'hover:opacity-80'
      )}
    >
      {IconComponent && <IconComponent className="w-3 h-3 flex-shrink-0" />}
      <span className="text-xs font-medium truncate">{task.title}</span>
    </button>
  );
}
