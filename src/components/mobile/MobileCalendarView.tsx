import { useState } from 'react';
import { DateStrip } from './DateStrip';
import { DaySwipeView } from './DaySwipeView';
import type { Task, Category, EnergyLevel } from '../../types';

interface MobileCalendarViewProps {
  showCompleted: boolean;
  categoryMap?: Map<number, Category>;
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
  energyFilter?: EnergyLevel | null;
}

/**
 * Complete mobile calendar experience combining DateStrip + DaySwipeView.
 * DateStrip provides quick date navigation, DaySwipeView shows one day at a time.
 */
export function MobileCalendarView({
  showCompleted,
  categoryMap,
  onTaskClick,
  onAddTask,
  energyFilter,
}: MobileCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DateStrip selectedDate={currentDate} onDateSelect={setCurrentDate} />
      <DaySwipeView
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        showCompleted={showCompleted}
        categoryMap={categoryMap}
        onTaskClick={onTaskClick}
        onAddTask={onAddTask}
        energyFilter={energyFilter}
      />
    </div>
  );
}
