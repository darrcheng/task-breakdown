import { useState, useRef, useEffect } from 'react';
import { db } from '../../db/database';
import { CategoryCombobox } from './CategoryCombobox';
import { useTimeEstimate } from '../../hooks/useTimeEstimate';

interface TaskInlineCreateProps {
  date: string;
  onClose: () => void;
}

export function TaskInlineCreate({ date, onClose }: TaskInlineCreateProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerEstimate } = useTimeEstimate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategoryId = categoryId || 1;

    const newId = await db.tasks.add({
      title: title.trim(),
      description: '',
      date,
      status: 'todo',
      categoryId: finalCategoryId,
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fire-and-forget: AI time estimation for inline-created tasks
    triggerEstimate(newId as number, title.trim(), '', finalCategoryId);

    setTitle('');
    setCategoryId(0);
    // Stay open for rapid entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter') {
      // Don't intercept Enter when category dropdown is open (it's selecting an item)
      const target = e.target as HTMLElement;
      const combobox = target.closest('[role="combobox"]');
      if (combobox && combobox.getAttribute('aria-expanded') === 'true') {
        return; // Let CategoryCombobox handle Enter for selection
      }
      e.preventDefault();
      if (!title.trim()) return;
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="px-4 py-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task... (Enter to create, Esc to close)"
          className="flex-[3] px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-blue-50/50"
        />
        <div className="flex-[1] min-w-[160px]">
          <CategoryCombobox value={categoryId} onChange={setCategoryId} />
        </div>
        <button
          type="submit"
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>
    </form>
  );
}
