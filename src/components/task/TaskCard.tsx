import { type LucideIcon } from 'lucide-react';
import { Battery, BatteryMedium, Zap, ListTree } from 'lucide-react';
import clsx from 'clsx';
import { STATUS_COLORS, renderCategoryIcon } from '../../utils/categories';
import { ParentBadge } from './ParentBadge';
import { formatEstimate } from '../../utils/estimateCalibration';
import { useSubtasks } from '../../db/hooks';
import { useMultiSelectContext } from '../../hooks/useMultiSelect';
import type { Task, Category, EnergyLevel } from '../../types';

interface TaskCardProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task, e?: React.MouseEvent) => void;
  dayTaskIds?: number[];
}

const ENERGY_DISPLAY: Record<EnergyLevel, { icon: LucideIcon; color: string; label: string }> = {
  low: { icon: Battery, color: 'text-sky-500', label: 'Low' },
  medium: { icon: BatteryMedium, color: 'text-amber-500', label: 'Med' },
  high: { icon: Zap, color: 'text-emerald-500', label: 'High' },
};

export function TaskCard({ task, categoryMap, onClick, dayTaskIds }: TaskCardProps) {
  const colors = STATUS_COLORS[task.status];
  const category = categoryMap?.get(task.categoryId);
  const categoryIcon = category?.icon || 'folder';

  const energy = task.energyLevel ? ENERGY_DISPLAY[task.energyLevel] : null;
  const effectiveEstimate = task.timeEstimateOverride ?? task.timeEstimate;

  const { handleTaskClick, isSelected } = useMultiSelectContext();
  const selected = isSelected(task.id!);

  const subtasks = useSubtasks(task.id ?? 0);
  const subtaskCount = subtasks?.length ?? 0;
  const subtaskDoneCount = subtasks?.filter(s => s.status === 'done').length ?? 0;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const handled = handleTaskClick(task, e, dayTaskIds ?? []);
        if (!handled) {
          onClick?.(task, e);
        }
      }}
      className={clsx(
        'w-full flex items-center gap-1.5 px-2 py-1 rounded border text-left cursor-pointer transition-colors',
        selected ? 'ring-2 ring-blue-400 bg-blue-50' : colors.bg,
        selected ? 'border-blue-300' : colors.border,
        colors.text,
        'hover:opacity-80'
      )}
    >
      <span className="flex-shrink-0">{renderCategoryIcon(categoryIcon, 'w-3 h-3')}</span>
      <span className="text-xs font-medium truncate">{task.title}</span>
      {energy && (
        <span className={clsx('flex items-center gap-0.5 text-[10px] flex-shrink-0', energy.color)}>
          <energy.icon className="w-3 h-3" />
          {energy.label}
        </span>
      )}
      {effectiveEstimate && (
        <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap">
          ~{formatEstimate(effectiveEstimate)}
        </span>
      )}
      {subtaskCount > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 flex-shrink-0">
          <ListTree className="w-3 h-3" />
          {subtaskDoneCount}/{subtaskCount}
        </span>
      )}
      {task.id && <ParentBadge taskId={task.id} />}
    </button>
  );
}
