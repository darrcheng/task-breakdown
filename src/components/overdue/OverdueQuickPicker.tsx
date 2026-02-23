import { useEffect, useState } from 'react';
import { X, Calendar, Archive, CheckCircle2 } from 'lucide-react';
import { db } from '../../db/database';
import { formatDateKey } from '../../utils/dates';
import { DatePicker } from '../task/DatePicker';
import type { Task } from '../../types';

interface OverdueQuickPickerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

function OverdueTaskRow({ task }: { task: Task }) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleReschedule = async (newDate: string) => {
    await db.tasks.update(task.id!, { date: newDate, updatedAt: new Date() });
    setShowDatePicker(false);
  };

  const handleSomeday = async () => {
    await db.tasks.update(task.id!, { isSomeday: true, updatedAt: new Date() });
  };

  const handleDone = async () => {
    await db.tasks.update(task.id!, { status: 'done', updatedAt: new Date() });
  };

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">Due {task.date}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowDatePicker(prev => !prev)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
            title="Reschedule"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={handleSomeday}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"
            title="Send to Someday"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={handleDone}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors"
            title="Mark done"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {showDatePicker && (
        <div className="mt-2">
          <DatePicker
            value={task.date}
            onChange={handleReschedule}
            defaultOpen={true}
            inline={true}
          />
        </div>
      )}
    </div>
  );
}

export function OverdueQuickPicker({ isOpen, onClose, tasks }: OverdueQuickPickerProps) {
  // Auto-close when tasks list becomes empty
  useEffect(() => {
    if (isOpen && tasks.length === 0) {
      const timer = setTimeout(() => onClose(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tasks.length, onClose]);

  if (!isOpen) return null;

  const handleMoveAllToday = async () => {
    await Promise.all(
      tasks.map(t => db.tasks.update(t.id!, { date: formatDateKey(new Date()), updatedAt: new Date() }))
    );
    onClose();
  };

  const handleSendAllToSomeday = async () => {
    await Promise.all(
      tasks.map(t => db.tasks.update(t.id!, { isSomeday: true, updatedAt: new Date() }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative max-w-md w-full mx-4 bg-white rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Overdue Tasks</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-5">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p className="text-sm font-medium">All caught up!</p>
            </div>
          ) : (
            tasks.map(task => (
              <OverdueTaskRow key={task.id} task={task} />
            ))
          )}
        </div>

        {/* Bulk actions footer */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={handleMoveAllToday}
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Move all to today
            </button>
            <button
              onClick={handleSendAllToSomeday}
              className="flex-1 text-slate-600 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Send all to Someday
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
