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
import type { Task, Category } from '../../types';

interface DndProviderProps {
  children: React.ReactNode;
  categoryMap?: Map<number, Category>;
}

export function DndProvider({ children, categoryMap }: DndProviderProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    // Same-day sortable reorder: over target is another task
    if (String(over.id).startsWith('task-')) {
      // Dropped on self -- no-op
      if (active.id === over.id) return;

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
    if (newDate === task.date) return; // Same day, no-op

    await db.tasks.update(task.id, {
      date: newDate,
      updatedAt: new Date(),
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

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
          <div className="opacity-90 pointer-events-none">
            <TaskCard
              task={activeTask}
              categoryMap={categoryMap}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
