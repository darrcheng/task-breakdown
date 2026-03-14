import { useState, useMemo, useCallback, useRef } from 'react';
import {
  addDays,
  addMonths,
  subMonths,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface RepeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dates: string[]) => void;
  taskDate: string;
}

type RepeatMode = 'daily' | 'select';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDaysForMonth(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  return eachDayOfInterval({ start, end });
}

export function RepeatModal({ isOpen, onClose, onSubmit, taskDate }: RepeatModalProps) {
  const [mode, setMode] = useState<RepeatMode>('daily');
  const [dayCount, setDayCount] = useState(3);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => parseISO(taskDate));
  const lastClickedDate = useRef<Date | null>(null);

  if (!isOpen) return null;

  const taskDateParsed = parseISO(taskDate);

  const dailyDates = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) =>
      format(addDays(taskDateParsed, i + 1), 'yyyy-MM-dd')
    );
  }, [taskDate, dayCount]);

  const dailyPreview = useMemo(() => {
    if (dailyDates.length === 0) return '';
    if (dailyDates.length === 1) return format(parseISO(dailyDates[0]), 'MMM d');
    const first = format(parseISO(dailyDates[0]), 'MMM d');
    const last = format(parseISO(dailyDates[dailyDates.length - 1]), 'MMM d');
    return `${first} – ${last}`;
  }, [dailyDates]);

  const selectedDateStrings = useMemo(
    () => selectedDates.map((d) => format(d, 'yyyy-MM-dd')).sort(),
    [selectedDates]
  );

  const datesToCreate = mode === 'daily' ? dailyDates : selectedDateStrings;
  const count = datesToCreate.length;

  const handleSubmit = () => {
    if (count > 0) {
      onSubmit(datesToCreate);
    }
  };

  const calendarDays = useMemo(
    () => getCalendarDaysForMonth(calendarMonth),
    [calendarMonth]
  );

  const isDateSelected = useCallback(
    (day: Date) => selectedDates.some((d) => isSameDay(d, day)),
    [selectedDates]
  );

  const handleDayClick = useCallback(
    (day: Date, e: React.MouseEvent) => {
      if (isBefore(day, startOfDay(new Date()))) return;

      if (e.shiftKey && lastClickedDate.current) {
        // Shift+click: select range between last clicked and this day
        const start = lastClickedDate.current < day ? lastClickedDate.current : day;
        const end = lastClickedDate.current < day ? day : lastClickedDate.current;
        const rangeDays = eachDayOfInterval({ start, end }).filter(
          (d) => !isBefore(d, startOfDay(new Date()))
        );

        setSelectedDates((prev) => {
          const existing = new Set(prev.map((d) => d.getTime()));
          const merged = [...prev];
          for (const rd of rangeDays) {
            if (!existing.has(rd.getTime())) {
              merged.push(rd);
            }
          }
          return merged;
        });
      } else {
        // Normal click: toggle single date
        setSelectedDates((prev) => {
          const exists = prev.some((d) => isSameDay(d, day));
          if (exists) {
            return prev.filter((d) => !isSameDay(d, day));
          }
          return [...prev, day];
        });
      }
      lastClickedDate.current = day;
    },
    [selectedDates]
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

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
              <span className="text-slate-700 font-medium">{dailyPreview}</span>
            </p>
          </div>
        )}

        {/* Select dates mode — mini calendar */}
        {mode === 'select' && (
          <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {format(calendarMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day name headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider py-1"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const inMonth = isSameMonth(day, calendarMonth);
                const today = isToday(day);
                const selected = isDateSelected(day);
                const past = isBefore(day, startOfDay(new Date()));

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={past}
                    onClick={(e) => handleDayClick(day, e)}
                    className={clsx(
                      'w-full aspect-square flex items-center justify-center text-xs rounded-full transition-colors',
                      past && 'text-slate-300 cursor-not-allowed',
                      !past && !selected && inMonth && 'text-slate-700 hover:bg-slate-100',
                      !past && !selected && !inMonth && 'text-slate-400 hover:bg-slate-100',
                      !past && today && !selected && 'bg-red-500 text-white hover:bg-red-600',
                      selected && 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Selection summary */}
            {selectedDates.length > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDates([])}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-400 mt-1">
              Shift+click to select a range
            </p>
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
