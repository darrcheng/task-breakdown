import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarView } from '../../types';

interface MonthNavigationProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  calendarView: CalendarView;
  onCalendarViewChange: (view: CalendarView) => void;
}

export function MonthNavigation({
  currentMonth,
  onMonthChange,
  calendarView,
  onCalendarViewChange,
}: MonthNavigationProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            onMonthChange(
              calendarView === 'week'
                ? subWeeks(currentMonth, 1)
                : subMonths(currentMonth, 1)
            )
          }
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label={calendarView === 'week' ? 'Previous week' : 'Previous month'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-medium text-slate-800 min-w-[180px] text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() =>
            onMonthChange(
              calendarView === 'week'
                ? addWeeks(currentMonth, 1)
                : addMonths(currentMonth, 1)
            )
          }
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label={calendarView === 'week' ? 'Next week' : 'Next month'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => onMonthChange(new Date())}
          className="ml-2 px-3 py-1 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 border border-slate-300 transition-colors"
        >
          Today
        </button>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
        <button
          onClick={() => onCalendarViewChange('month')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            calendarView === 'month'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onCalendarViewChange('week')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            calendarView === 'week'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Week
        </button>
      </div>
    </div>
  );
}
