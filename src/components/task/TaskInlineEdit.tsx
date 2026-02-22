import { db } from '../../db/database';
import { TaskForm } from './TaskForm';
import type { Task } from '../../types';

interface TaskInlineEditProps {
  task: Task;
  onClose: () => void;
}

export function TaskInlineEdit({ task, onClose }: TaskInlineEditProps) {
  const handleSubmit = async (data: {
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    categoryId: number;
  }) => {
    if (task.id) {
      await db.tasks.update(task.id, {
        ...data,
        updatedAt: new Date(),
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (task.id) {
      await db.tasks.delete(task.id);
      onClose();
    }
  };

  return (
    <div className="px-4 py-3 bg-white border border-blue-200 rounded-lg shadow-sm">
      <TaskForm
        initialData={task}
        onSubmit={handleSubmit}
        onCancel={onClose}
        onDelete={handleDelete}
        submitLabel="Save"
      />
    </div>
  );
}
