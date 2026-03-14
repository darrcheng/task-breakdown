import { useState } from 'react';
import { Calendar, CheckCircle2, X } from 'lucide-react';
import { db } from '../../db/database';
import { DatePicker } from '../task/DatePicker';
import { formatDateKey } from '../../utils/dates';

interface MultiSelectBarProps {
  selectedIds: Set<number>;
  onClear: () => void;
  onComplete: () => void;
}

export function MultiSelectBar({ selectedIds, onClear, onComplete }: MultiSelectBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (selectedIds.size === 0) return null;

  const handleMoveTo = async (newDate: string) => {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) =>
        db.tasks.update(id, { date: newDate, updatedAt: new Date() })
      )
    );
    setShowDatePicker(false);
    onComplete();
  };

  const handleMarkDone = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) =>
        db.tasks.update(id, { status: 'done' as const, updatedAt: new Date() })
      )
    );
    onComplete();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
      {/* Date picker popover - positioned above the bar */}
      {showDatePicker && (
        <div className="flex justify-center pb-2 px-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2">
            <DatePicker
              value={formatDateKey(new Date())}
              onChange={handleMoveTo}
              defaultOpen={true}
              inline={true}
            />
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="bg-white border-t border-slate-200 shadow-lg rounded-t-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} selected
          </span>
          <button
            onClick={onClear}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkDone}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark done
          </button>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Move to...
          </button>
        </div>
      </div>
    </div>
  );
}
