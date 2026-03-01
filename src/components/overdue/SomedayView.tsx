import { useState } from 'react';
import { Archive, CalendarDays, Trash2 } from 'lucide-react';
import { db } from '../../db/database';
import { useSomedayTasks } from '../../db/hooks';
import { formatDateKey } from '../../utils/dates';
import { DatePicker } from '../task/DatePicker';
import { CATEGORY_ICONS } from '../../utils/categories';
import type { Category, Task } from '../../types';

interface SomedayViewProps {
  categoryMap: Map<number, Category> | undefined;
}

function SomedayTaskRow({ task, categoryMap }: { task: Task; categoryMap: Map<number, Category> | undefined }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = categoryMap?.get(task.categoryId);
  const IconComponent = category ? CATEGORY_ICONS[category.icon] : CATEGORY_ICONS['folder'];

  const handleRescue = async (newDate: string) => {
    await db.tasks.update(task.id!, {
      isSomeday: false,
      date: newDate,
      updatedAt: new Date(),
    });
    setShowDatePicker(false);
  };

  const handleDeleteClick = async () => {
    if (confirmDelete) {
      await db.tasks.delete(task.id!);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {IconComponent && (
            <IconComponent className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowDatePicker(prev => !prev)}
            className="p-2.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
            title="Rescue — schedule for a date"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`p-2.5 rounded-md transition-colors ${
              confirmDelete
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'
            }`}
            title={confirmDelete ? 'Click again to delete' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {showDatePicker && (
        <div className="mt-2">
          <DatePicker
            value={formatDateKey(new Date())}
            onChange={handleRescue}
          />
        </div>
      )}
    </div>
  );
}

export function SomedayView({ categoryMap }: SomedayViewProps) {
  const tasks = useSomedayTasks();

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Archive className="w-5 h-5 text-slate-500" />
          <h2 className="text-xl font-semibold text-slate-800">Someday</h2>
        </div>
        <p className="text-sm text-slate-500">
          Tasks you want to remember but aren't committing to a date.
        </p>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {!tasks || tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Archive className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nothing here yet.</p>
            <p className="text-xs mt-1 text-slate-400">
              Tasks you send to Someday will appear here.
            </p>
          </div>
        ) : (
          <div className="px-5">
            {tasks.map(task => (
              <SomedayTaskRow key={task.id} task={task} categoryMap={categoryMap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
