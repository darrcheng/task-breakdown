import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
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
