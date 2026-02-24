import { useState, useRef, useEffect } from 'react';
import { ListTree, Sparkles, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useSubtasks } from '../../db/hooks';
import { db } from '../../db/database';
import { CATEGORY_ICONS } from '../../utils/categories';
import type { Task, Category, TaskStatus } from '../../types';

interface SubtaskListProps {
  parentId: number;
  parentDepth: number;
  categoryMap?: Map<number, Category>;
  onOpenSubtask: (task: Task) => void;
}

export function SubtaskList({
  parentId,
  parentDepth,
  categoryMap,
  onOpenSubtask,
}: SubtaskListProps) {
  const subtasks = useSubtasks(parentId);

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const allDone = subtasks.every((s) => s.status === 'done');
  const doneCount = subtasks.filter((s) => s.status === 'done').length;
  const firstIncompleteIndex = subtasks.findIndex((s) => s.status !== 'done');

  const handleCompleteParent = async () => {
    await db.tasks.update(parentId, {
      status: 'done',
      updatedAt: new Date(),
    });
  };

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <ListTree className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-medium text-slate-700">
          Subtasks ({doneCount}/{subtasks.length})
        </h3>
      </div>

      <div className="space-y-1">
        {subtasks.map((subtask, index) => (
          <SubtaskRow
            key={subtask.id}
            subtask={subtask}
            parentDepth={parentDepth}
            categoryMap={categoryMap}
            onOpenSubtask={onOpenSubtask}
            isStartHere={index === firstIncompleteIndex}
          />
        ))}
      </div>

      {/* All done prompt */}
      {allDone && (
        <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            All subtasks done!
          </div>
          <button
            onClick={handleCompleteParent}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-md transition-colors"
          >
            Complete Parent
          </button>
        </div>
      )}
    </div>
  );
}

// --- Individual subtask row ---

interface SubtaskRowProps {
  subtask: Task;
  parentDepth: number;
  categoryMap?: Map<number, Category>;
  onOpenSubtask: (task: Task) => void;
  isStartHere?: boolean;
}

function SubtaskRow({
  subtask,
  parentDepth,
  categoryMap,
  onOpenSubtask,
  isStartHere,
}: SubtaskRowProps) {
  const [departingPhase, setDepartingPhase] = useState<'ring' | 'fade' | 'settling' | null>(null);
  const [displayStatus, setDisplayStatus] = useState<TaskStatus>(subtask.status);
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

  // Sync display status when task status changes externally
  useEffect(() => {
    if (!departing) {
      setDisplayStatus(subtask.status);
    }
  }, [subtask.status, departing]);

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

  const indent = (subtask.depth - parentDepth - 1) * 16;
  const category = categoryMap?.get(subtask.categoryId);
  const IconComponent = category
    ? CATEGORY_ICONS[category.icon]
    : CATEGORY_ICONS['folder'];
  const canBreakDown = (subtask.depth ?? 0) < 3;

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!subtask.id) return;

    if (departing) {
      // Re-click: cancel departure, back to todo
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
      await db.tasks.update(subtask.id, {
        status: 'todo',
        updatedAt: new Date(),
      });
      return;
    }

    const nextMap: Record<TaskStatus, TaskStatus> = {
      todo: 'in-progress',
      'in-progress': 'done',
      done: 'todo',
    };
    const nextStatus = nextMap[subtask.status];

    if (nextStatus === 'done') {
      setDepartingPhase('ring');
      setDisplayStatus('done');
      departureTimeout.current = setTimeout(async () => {
        departureTimeout.current = null;
        // Enter settling phase: removes ring/opacity classes but keeps transition-all
        // so the ring fades out smoothly instead of disappearing abruptly.
        setDepartingPhase('settling');
        settlingTimeout.current = setTimeout(async () => {
          settlingTimeout.current = null;
          setDepartingPhase(null);
          await db.tasks.update(subtask.id!, {
            status: 'done',
            updatedAt: new Date(),
          });
        }, 400);
      }, 1500);
    } else {
      setDisplayStatus(nextStatus);
      await db.tasks.update(subtask.id, {
        status: nextStatus,
        updatedAt: new Date(),
      });
    }
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 group',
        !departing && 'transition-colors',
        departingPhase === 'ring' && 'ring-2 ring-emerald-400 ring-offset-1 transition-all duration-[1500ms]',
        departingPhase === 'fade' && 'ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]',
        departingPhase === 'settling' && 'transition-all duration-300',
        isStartHere && !departing && 'ring-2 ring-violet-400 ring-offset-1 rounded-md',
      )}
      style={{ marginLeft: indent > 0 ? indent : 0 }}
    >
      {/* Status checkbox */}
      <button
        onClick={handleStatusClick}
        className={clsx(
          'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
          displayStatus === 'done'
            ? 'bg-emerald-500 border-emerald-500'
            : displayStatus === 'in-progress'
              ? 'bg-amber-400 border-amber-400'
              : 'bg-white border-slate-400 hover:border-slate-500',
        )}
        title={`Status: ${displayStatus}`}
      />

      {/* Category icon */}
      {IconComponent && (
        <IconComponent className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
      )}

      {/* Title */}
      <button
        onClick={() => onOpenSubtask(subtask)}
        className={clsx(
          'flex-1 text-sm text-left truncate transition-colors',
          (departingPhase === 'ring' || departingPhase === 'fade')
            ? 'text-green-600 line-through'
            : displayStatus === 'done'
              ? 'text-slate-400 line-through'
              : 'text-slate-700 hover:text-blue-600',
        )}
      >
        {subtask.title}
      </button>

      {/* Break down icon for subtasks that can be further broken down */}
      {canBreakDown && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSubtask(subtask);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-blue-500 transition-opacity"
          title="Break down further"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
