import { useState, useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { X } from 'lucide-react';

interface RepeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dates: string[]) => void;
  taskDate: string;
}

type RepeatMode = 'daily' | 'select';

export function RepeatModal({ isOpen, onClose, onSubmit, taskDate }: RepeatModalProps) {
  const [mode, setMode] = useState<RepeatMode>('daily');
  const [dayCount, setDayCount] = useState(3);
  const [selectedDates, setSelectedDates] = useState<string[]>(['']);

  if (!isOpen) return null;

  const dailyDates = useMemo(() => {
    const base = parseISO(taskDate);
    return Array.from({ length: dayCount }, (_, i) =>
      format(addDays(base, i + 1), 'yyyy-MM-dd')
    );
  }, [taskDate, dayCount]);

  const validSelectedDates = selectedDates.filter((d) => d.trim() !== '');

  const datesToCreate = mode === 'daily' ? dailyDates : validSelectedDates;
  const count = datesToCreate.length;

  const handleSubmit = () => {
    if (count > 0) {
      onSubmit(datesToCreate);
    }
  };

  const handleAddDate = () => {
    if (selectedDates.length < 10) {
      setSelectedDates((prev) => [...prev, '']);
    }
  };

  const handleRemoveDate = (index: number) => {
    setSelectedDates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (index: number, value: string) => {
    setSelectedDates((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const formatPreviewDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">Repeat Task</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setMode('daily')}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
              mode === 'daily'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setMode('select')}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
              mode === 'select'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Select Dates
          </button>
        </div>

        {/* Daily mode */}
        {mode === 'daily' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Number of days
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={dayCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 30) {
                    setDayCount(val);
                  }
                }}
                className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              />
            </div>
            <p className="text-sm text-slate-500">
              Creates {dayCount} task{dayCount !== 1 ? 's' : ''}:{' '}
              <span className="text-slate-700 font-medium">
                {dailyDates.map(formatPreviewDate).join(', ')}
              </span>
            </p>
          </div>
        )}

        {/* Select dates mode */}
        {mode === 'select' && (
          <div className="space-y-2">
            {selectedDates.map((dateVal, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => handleDateChange(index, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                />
                {selectedDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {selectedDates.length < 10 && (
              <button
                type="button"
                onClick={handleAddDate}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add date
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={count === 0}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Create {count} task{count !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
