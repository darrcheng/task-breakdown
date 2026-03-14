import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '../../db/database';
import { TaskCard } from '../task/TaskCard';
import { MultiSelectProvider, useMultiSelectContext } from '../../hooks/useMultiSelect';
import type { Task, Category } from '../../types';

interface DndProviderProps {
  children: React.ReactNode;
  categoryMap?: Map<number, Category>;
}

export function DndProvider({ children, categoryMap }: DndProviderProps) {
  return (
    <MultiSelectProvider>
      <DndInner categoryMap={categoryMap}>{children}</DndInner>
    </MultiSelectProvider>
  );
}

function DndInner({ children, categoryMap }: DndProviderProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { selectedIds, isSelected, clearSelection } = useMultiSelectContext();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task?.id) return;

    const isDraggedTaskSelected = isSelected(task.id);

    // Same-day sortable reorder: over target is another task
    if (String(over.id).startsWith('task-')) {
      // Dropped on self -- no-op
      if (active.id === over.id) return;

      // Skip reorder when dragging a selected group (ambiguous ordering)
      if (isDraggedTaskSelected && selectedIds.size > 1) return;

      const overTaskId = Number(String(over.id).replace('task-', ''));

      // Get all root tasks for this day, sorted by sortOrder
      const dayTasks = await db.tasks
        .where('date')
        .equals(task.date)
        .filter((t) => !t.parentId && t.depth === 0)
        .toArray();
      dayTasks.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

      const oldIndex = dayTasks.findIndex((t) => t.id === task.id);
      const newIndex = dayTasks.findIndex((t) => t.id === overTaskId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(dayTasks, oldIndex, newIndex);

      // Bulk update sortOrder with spacing of 1000
      const now = new Date();
      await Promise.all(
        reordered.map((t, i) =>
          db.tasks.update(t.id!, {
            sortOrder: i * 1000,
            updatedAt: now,
          })
        )
      );
      return;
    }

    // Cross-day drop: over target is a date string
    const newDate = over.id as string;
    if (newDate === task.date && !isDraggedTaskSelected) return; // Same day, no-op

    if (isDraggedTaskSelected && selectedIds.size > 1) {
      // Group move: move ALL selected tasks to the new date
      const now = new Date();
      await Promise.all(
        [...selectedIds].map((id) =>
          db.tasks.update(id, {
            date: newDate,
            updatedAt: now,
          })
        )
      );
      clearSelection();
    } else {
      // Single task move
      if (newDate === task.date) return; // Same day, no-op
      await db.tasks.update(task.id, {
        date: newDate,
        updatedAt: new Date(),
      });
    }
  }, [selectedIds, isSelected, clearSelection]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

  const showGroupBadge = activeTask?.id != null && isSelected(activeTask.id) && selectedIds.size > 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="opacity-90 pointer-events-none relative">
            <TaskCard
              task={activeTask}
              categoryMap={categoryMap}
            />
            {showGroupBadge && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
                {selectedIds.size}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
