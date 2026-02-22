import { useEffect } from 'react';
import { db } from '../../db/database';
import { TaskForm } from './TaskForm';
import type { Task } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  task?: Task;
  clickPosition?: { x: number; y: number };
}

export function TaskModal({ isOpen, onClose, date, task, clickPosition }: TaskModalProps) {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (data: {
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    categoryId: number;
    date: string;
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

  // Calculate position with viewport clamping
  const MODAL_WIDTH = 400;
  const MODAL_HEIGHT = 560;
  const positionStyle: React.CSSProperties = clickPosition
    ? {
        left: Math.min(clickPosition.x + 8, window.innerWidth - MODAL_WIDTH - 16),
        top: Math.min(Math.max(clickPosition.y - 100, 16), window.innerHeight - MODAL_HEIGHT - 16),
        width: `${MODAL_WIDTH}px`,
        maxHeight: `${MODAL_HEIGHT}px`,
      }
    : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: `${MODAL_WIDTH}px`,
        width: '100%',
      };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className="fixed bg-white rounded-lg shadow-xl p-6 overflow-y-auto"
        style={positionStyle}
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        <TaskForm
          initialData={task}
          initialDate={date}
          onSubmit={handleSubmit}
          onCancel={onClose}
          onDelete={task ? handleDelete : undefined}
          submitLabel={task ? 'Save' : 'Create'}
        />
      </div>
    </div>
  );
}
