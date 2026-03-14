import { useState, useRef, useEffect, useCallback } from 'react';
import { addDays, subDays } from 'date-fns';
import { ArrowDown, CheckSquare } from 'lucide-react';
import { formatDateKey, getDaysInRange } from '../../utils/dates';
import { useTasksByDateRange } from '../../db/hooks';
import { DayGroup } from './DayGroup';
import { MultiSelectBar } from './MultiSelectBar';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { Task, Category, EnergyLevel } from '../../types';

interface ListViewProps {
  showCompleted: boolean;
  categoryMap?: Map<number, Category>;
  onDayClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
  energyFilter?: EnergyLevel | null;
}

export function ListView({
  showCompleted,
  categoryMap,
  onDayClick,
  onTaskClick,
  energyFilter,
}: ListViewProps) {
  const today = new Date();
  const [startDate, setStartDate] = useState(() => subDays(today, 7));
  const [endDate, setEndDate] = useState(() => addDays(today, 14));
  const isMobile = useIsMobile();
  const {
    selectedIds,
    isMultiSelectActive,
    toggleSelect,
    selectAll,
    clearSelection,
    enterMultiSelect,
    exitMultiSelect,
  } = useMultiSelect();

  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolledToToday = useRef(false);

  const startStr = formatDateKey(startDate);
  const endStr = formatDateKey(endDate);
  const tasks = useTasksByDateRange(startStr, endStr, showCompleted, energyFilter);

  // Group tasks by date
  const days = getDaysInRange(startDate, endDate);
  const tasksByDate = new Map<string, Task[]>();
  for (const day of days) {
    tasksByDate.set(formatDateKey(day), []);
  }
  if (tasks) {
    for (const task of tasks) {
      const existing = tasksByDate.get(task.date);
      if (existing) {
        existing.push(task);
      }
    }
  }

  // Scroll to today on first render
  useEffect(() => {
    if (!hasScrolledToToday.current && tasks !== undefined) {
      const todayEl = document.getElementById(`day-${formatDateKey(today)}`);
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'instant', block: 'start' });
        hasScrolledToToday.current = true;
      }
    }
  }, [tasks]);

  // Extend date range when sentinels become visible
  const extendTop = useCallback(() => {
    setStartDate((prev) => subDays(prev, 7));
  }, []);

  const extendBottom = useCallback(() => {
    setEndDate((prev) => addDays(prev, 7));
  }, []);

  useEffect(() => {
    const topEl = topSentinelRef.current;
    const bottomEl = bottomSentinelRef.current;
    if (!topEl || !bottomEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (entry.target === topEl) extendTop();
            if (entry.target === bottomEl) extendBottom();
          }
        }
      },
      { root: scrollRef.current, rootMargin: '100px' }
    );

    observer.observe(topEl);
    observer.observe(bottomEl);

    return () => observer.disconnect();
  }, [extendTop, extendBottom]);

  const scrollToToday = () => {
    const todayEl = document.getElementById(`day-${formatDateKey(today)}`);
    if (todayEl) {
      todayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 relative min-h-0">
      <div ref={scrollRef} className="h-full overflow-y-auto">
        {/* Top sentinel for infinite scroll backward */}
        <div ref={topSentinelRef} className="h-1" />

        {/* Day groups */}
        {Array.from(tasksByDate.entries()).map(([dateStr, dayTasks]) => (
          <DayGroup
            key={dateStr}
            date={dateStr}
            tasks={dayTasks}
            categoryMap={categoryMap}
            onDayClick={onDayClick}
            onTaskClick={onTaskClick}
            isMultiSelectActive={isMultiSelectActive}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
          />
        ))}

        {/* Bottom sentinel for infinite scroll forward */}
        <div ref={bottomSentinelRef} className="h-1" />
      </div>

      {/* MultiSelectBar */}
      {isMultiSelectActive && (
        <MultiSelectBar
          selectedIds={selectedIds}
          onClear={clearSelection}
          onComplete={exitMultiSelect}
        />
      )}

      {/* Floating Today button - hidden when multiselect bar is visible */}
      {!(isMultiSelectActive && selectedIds.size > 0) && (
        <button
          onClick={scrollToToday}
          className="absolute bottom-4 right-4 z-50 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
          Today
        </button>
      )}

      {/* Multiselect toggle button - desktop only */}
      {!isMobile && (
        <button
          onClick={isMultiSelectActive ? exitMultiSelect : enterMultiSelect}
          className={`absolute bottom-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-colors ${
            isMultiSelectActive
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title={isMultiSelectActive ? 'Exit multiselect' : 'Select multiple tasks'}
        >
          <CheckSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
