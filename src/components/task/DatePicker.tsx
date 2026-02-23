import { useState, useRef, useEffect } from 'react';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarDays, formatDateKey, isToday, isSameMonth } from '../../utils/dates';

interface DatePickerProps {
  value: string;       // 'yyyy-MM-dd' format
  onChange: (date: string) => void;
  required?: boolean;
  defaultOpen?: boolean;
  inline?: boolean;
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({ value, onChange, defaultOpen, inline }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (value) {
      try { return parseISO(value); } catch { /* fallback */ }
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update viewMonth when value changes externally
  useEffect(() => {
    if (value) {
      try {
        setViewMonth(parseISO(value));
      } catch { /* ignore */ }
    }
  }, [value]);

  // Click-outside handler — only when not inline and calendar is open
  useEffect(() => {
    if (inline || !isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, inline]);

  const formattedValue = value
    ? (() => {
        try { return format(parseISO(value), 'MMM d, yyyy'); } catch { return value; }
      })()
    : null;

  const days = getCalendarDays(viewMonth);

  const handleDayClick = (day: Date) => {
    onChange(formatDateKey(day));
    if (!inline) setIsOpen(false);
  };

  // Calendar panel — shared by dropdown and inline modes
  const calendarPanel = (
    <div className={inline
      ? 'w-72 bg-white border border-slate-200 rounded-lg shadow-sm'
      : 'absolute z-50 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg'
    }>
      {/* Month navigation header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setViewMonth(prev => subMonths(prev, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-slate-700">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(prev => addMonths(prev, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1">
        {DAY_HEADERS.map(day => (
          <div
            key={day}
            className="text-xs font-medium text-slate-400 text-center py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
        {days.map(day => {
          const dateKey = formatDateKey(day);
          const isSelected = dateKey === value;
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const isTodayDate = isToday(day);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(day)}
              className={[
                'w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors',
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isCurrentMonth
                    ? [
                        'text-slate-700 hover:bg-slate-100',
                        isTodayDate ? 'ring-1 ring-blue-400 font-semibold' : '',
                      ].filter(Boolean).join(' ')
                    : 'text-slate-300 hover:bg-slate-50',
              ].filter(Boolean).join(' ')}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Inline mode — render calendar directly without trigger button
  if (inline) {
    return <div ref={containerRef}>{calendarPanel}</div>;
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-sm text-left focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-white hover:border-slate-400 transition-colors"
      >
        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {formattedValue ? (
          <span className="text-slate-700">{formattedValue}</span>
        ) : (
          <span className="text-slate-400">Select date...</span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && calendarPanel}
    </div>
  );
}
