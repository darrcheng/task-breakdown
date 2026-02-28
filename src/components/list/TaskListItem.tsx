import { useState, useRef, useEffect, useCallback } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Battery, BatteryMedium, Zap, Archive, ListTree } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORY_ICONS, STATUS_COLORS, getNextStatus } from '../../utils/categories';
import { ParentBadge } from '../task/ParentBadge';
import { hapticFeedback } from '../../utils/haptics';
import { db } from '../../db/database';
import { useSubtasks } from '../../db/hooks';
import type { Task, Category, TaskStatus, EnergyLevel } from '../../types';

const ENERGY_DISPLAY: Record<EnergyLevel, { icon: LucideIcon; color: string; label: string }> = {
  low: { icon: Battery, color: 'text-sky-500', label: 'Low' },
  medium: { icon: BatteryMedium, color: 'text-amber-500', label: 'Med' },
  high: { icon: Zap, color: 'text-emerald-500', label: 'High' },
};

interface TaskListItemProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task) => void;
  onRegisterComplete?: (triggerFn: () => void) => void;
}

export function TaskListItem({ task, categoryMap, onClick, onRegisterComplete }: TaskListItemProps) {
  const [departingPhase, setDepartingPhase] = useState<'ring' | 'fade' | 'settling' | null>(null);
  const [displayStatus, setDisplayStatus] = useState<TaskStatus>(task.status);
  const departureTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settlingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const innerRafRef = useRef<number | null>(null);

  const departing = departingPhase !== null;

  // Two-frame animation: ring phase → double-rAF → fade phase
  // Double-rAF guarantees browser paints the ring state before applying opacity-0
  useEffect(() => {
    if (departingPhase === 'ring') {
      const rafId = requestAnimationFrame(() => {
        const innerRafId = requestAnimationFrame(() => {
          setDepartingPhase('fade');
        });
        innerRafRef.current = innerRafId;
      });
      return () => {
        cancelAnimationFrame(rafId);
        if (innerRafRef.current !== null) {
          cancelAnimationFrame(innerRafRef.current);
        }
      };
    }
  }, [departingPhase]);

  // Fix: use displayStatus so background turns green immediately at click time,
  // not amber/yellow (task.status still reflects DB state during 1500ms window)
  const colors = STATUS_COLORS[displayStatus];
  const category = categoryMap?.get(task.categoryId);
  const IconComponent = category
    ? CATEGORY_ICONS[category.icon]
    : CATEGORY_ICONS['folder'];
  const energy = task.energyLevel ? ENERGY_DISPLAY[task.energyLevel] : null;

  const subtasks = useSubtasks(task.id ?? 0);
  const subtaskCount = subtasks?.length ?? 0;
  const subtaskDoneCount = subtasks?.filter(s => s.status === 'done').length ?? 0;

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
      if (settlingTimeout.current) {
        clearTimeout(settlingTimeout.current);
      }
    };
  }, []);

  // Shared completion trigger: starts the 4-phase departure animation with haptic.
  // Used by both checkbox click (handleStatusClick) and swipe-complete (via onRegisterComplete).
  const triggerComplete = useCallback(() => {
    if (!task.id || departing) return;
    const nextStatus = getNextStatus(task.status);
    if (nextStatus === 'done') {
      setDepartingPhase('ring');
      setDisplayStatus('done');
      hapticFeedback(10);
      departureTimeout.current = setTimeout(async () => {
        departureTimeout.current = null;
        // Enter settling phase: removes ring/opacity classes but keeps transition-all
        // so the ring fades out smoothly instead of disappearing abruptly.
        setDepartingPhase('settling');
        settlingTimeout.current = setTimeout(async () => {
          settlingTimeout.current = null;
          setDepartingPhase(null);
          await db.tasks.update(task.id!, {
            status: 'done',
            updatedAt: new Date(),
          });
        }, 400);
      }, 1500);
    }
  }, [task.id, task.status, departing]);

  // Register triggerComplete with parent so swipe-complete can invoke it
  useEffect(() => {
    onRegisterComplete?.(triggerComplete);
  }, [onRegisterComplete, triggerComplete]);

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.id) return;

    if (departing) {
      // Re-click during departure: cancel and cycle back to todo
      if (departureTimeout.current) {
        clearTimeout(departureTimeout.current);
        departureTimeout.current = null;
      }
      if (settlingTimeout.current) {
        clearTimeout(settlingTimeout.current);
        settlingTimeout.current = null;
      }
      setDepartingPhase(null);
      setDisplayStatus('todo');
      await db.tasks.update(task.id, {
        status: 'todo',
        updatedAt: new Date(),
      });
      return;
    }

    const nextStatus = getNextStatus(task.status);
    if (nextStatus === 'done') {
      triggerComplete();
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
        'group w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left cursor-pointer',
        !departing && 'transition-colors',
        colors.bg,
        colors.border,
        'hover:opacity-80',
        (departingPhase === 'ring' || departingPhase === 'fade') && 'line-through decoration-green-600 text-green-600',
        departingPhase === 'ring' && 'ring-2 ring-emerald-400 ring-offset-1 transition-all duration-[1500ms]',
        departingPhase === 'fade' && 'ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]',
        departingPhase === 'settling' && 'transition-all duration-300',
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
        <IconComponent className={clsx('w-4 h-4 flex-shrink-0', (departingPhase === 'ring' || departingPhase === 'fade') ? 'text-green-600' : colors.text)} />
      )}
      <span className={clsx('flex-1 font-medium text-sm', (departingPhase === 'ring' || departingPhase === 'fade') ? 'text-green-600' : colors.text)}>
        {task.title}
      </span>
      {energy && (
        <span className={clsx('flex items-center gap-0.5 text-xs flex-shrink-0', energy.color)}>
          <energy.icon className="w-3.5 h-3.5" />
          {energy.label}
        </span>
      )}
      {subtaskCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
          <ListTree className="w-3.5 h-3.5" />
          {subtaskDoneCount}/{subtaskCount}
        </span>
      )}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          if (task.id) {
            await db.tasks.update(task.id, {
              isSomeday: true,
              updatedAt: new Date(),
            });
          }
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-amber-500 transition-all flex-shrink-0"
        title="Send to Someday"
      >
        <Archive className="w-4 h-4" />
      </button>
      {task.id && <ParentBadge taskId={task.id} />}
      <span
        className={clsx(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          colors.bg,
          (departingPhase === 'ring' || departingPhase === 'fade') ? 'text-green-600' : colors.text,
          'border',
          colors.border
        )}
      >
        {statusLabel}
      </span>
    </div>
  );
}
