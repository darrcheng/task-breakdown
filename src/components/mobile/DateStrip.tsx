import { useRef, useEffect } from 'react';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import clsx from 'clsx';

interface DateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

/**
 * Horizontal scrolling date strip — iOS Calendar-inspired.
 * Shows 21 days centered on the selected date. Today highlighted in violet-50,
 * selected date in violet-600. Auto-scrolls to keep selected date centered.
 */
export function DateStrip({ selectedDate, onDateSelect }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Generate 21 days centered on selected date (10 before, selected, 10 after)
  const days = Array.from({ length: 21 }, (_, i) => addDays(selectedDate, i - 10));

  // Auto-scroll to selected date when it changes
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDate]);

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto gap-1 px-2 py-2 border-b border-slate-200"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <style>{`.date-strip::-webkit-scrollbar { display: none; }`}</style>
      {days.map((day) => {
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);
        return (
          <button
            key={day.toISOString()}
            ref={selected ? selectedRef : undefined}
            onClick={() => onDateSelect(day)}
            className={clsx(
              'flex flex-col items-center justify-center min-w-[3rem] h-14 rounded-xl transition-colors flex-shrink-0',
              selected
                ? 'bg-violet-600 text-white'
                : today
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <span className="text-[10px] uppercase font-medium leading-tight">
              {format(day, 'EEE')}
            </span>
            <span className={clsx(
              'text-lg font-semibold leading-tight',
              selected ? 'text-white' : today ? 'text-violet-600' : 'text-slate-800'
            )}>
              {format(day, 'd')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
