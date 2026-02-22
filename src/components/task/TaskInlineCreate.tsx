import { useState, useRef, useEffect } from 'react';
import { db } from '../../db/database';
import { CategoryCombobox } from './CategoryCombobox';

interface TaskInlineCreateProps {
  date: string;
  onClose: () => void;
}

export function TaskInlineCreate({ date, onClose }: TaskInlineCreateProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategoryId = categoryId || 1;

    await db.tasks.add({
      title: title.trim(),
      description: '',
      date,
      status: 'todo',
      categoryId: finalCategoryId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setTitle('');
    // Stay open for rapid entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task... (Enter to create, Esc to close)"
          className="flex-[3] px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-blue-50/50"
        />
        <div className="flex-[1] min-w-[160px]">
          <CategoryCombobox value={categoryId} onChange={setCategoryId} />
        </div>
      </div>
    </form>
  );
}
