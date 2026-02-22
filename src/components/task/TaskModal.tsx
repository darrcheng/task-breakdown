import { useRef, useEffect } from 'react';
import { db } from '../../db/database';
import { TaskForm } from './TaskForm';
import type { Task } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  task?: Task;
}

export function TaskModal({ isOpen, onClose, date, task }: TaskModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    categoryId: number;
  }) => {
    if (task?.id) {
      // Edit existing task
      await db.tasks.update(task.id, {
        ...data,
        updatedAt: new Date(),
      });
    } else {
      // Create new task
      await db.tasks.add({
        ...data,
        date,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (task?.id) {
      await db.tasks.delete(task.id);
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-lg p-0 backdrop:bg-black/50 max-w-md w-full shadow-xl"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        {isOpen && (
          <TaskForm
            initialData={task}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onDelete={task ? handleDelete : undefined}
            submitLabel={task ? 'Save' : 'Create'}
          />
        )}
      </div>
    </dialog>
  );
}
