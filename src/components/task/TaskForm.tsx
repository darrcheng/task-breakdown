import { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useCategories } from '../../db/hooks';
import { STATUS_COLORS } from '../../utils/categories';
import type { Task, TaskStatus } from '../../types';

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (data: {
    title: string;
    description: string;
    status: TaskStatus;
    categoryId: number;
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
  submitLabel?: string;
}

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel = 'Save',
}: TaskFormProps) {
  const categories = useCategories();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialData?.status ?? 'todo'
  );
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.categoryId ?? 0
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-focus title on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Set default category when categories load
  useEffect(() => {
    if (categoryId === 0 && categories && categories.length > 0 && categories[0].id) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description, status, categoryId });
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To do' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label
          htmlFor="task-title"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Title
        </label>
        <input
          ref={titleRef}
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          required
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Status
        </label>
        <div className="flex gap-2">
          {statusOptions.map((opt) => {
            const colors = STATUS_COLORS[opt.value];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={clsx(
                  'flex-1 text-sm px-3 py-2 rounded-lg border-2 font-medium transition-colors',
                  colors.bg,
                  colors.text,
                  status === opt.value
                    ? `${colors.border} ring-2 ring-offset-1 ring-blue-400`
                    : 'border-transparent opacity-50 hover:opacity-80'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="task-category"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Category
        </label>
        <select
          id="task-category"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
        >
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="task-description"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Description
          <span className="text-slate-400 font-normal"> (optional)</span>
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? 'Click to confirm' : 'Delete'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
