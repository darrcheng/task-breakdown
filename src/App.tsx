import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { WeekView } from './components/calendar/WeekView';
import { MonthNavigation } from './components/calendar/MonthNavigation';
import { ListView } from './components/list/ListView';
import { ViewToggle } from './components/ui/ViewToggle';
import { useCategoryMap } from './db/hooks';
import type { ViewMode, CalendarView, Task } from './types';

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showCompleted, setShowCompleted] = useState(false);

  const categoryMap = useCategoryMap();

  const handleDayClick = (date: string) => {
    console.log('Day clicked:', date);
    // Will open create modal in Plan 04
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
    // Will open edit modal in Plan 04
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">TaskBreaker</h1>
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 border border-slate-300 transition-colors"
            title={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
          >
            {showCompleted ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {showCompleted ? 'Showing done' : 'Hiding done'}
            </span>
          </button>
        </div>
      </header>

      {/* Calendar navigation - only shown in calendar view */}
      {viewMode === 'calendar' && (
        <MonthNavigation
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          calendarView={calendarView}
          onCalendarViewChange={setCalendarView}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'calendar' ? (
          calendarView === 'month' ? (
            <CalendarGrid
              month={currentMonth}
              showCompleted={showCompleted}
              categoryMap={categoryMap}
              onDayClick={handleDayClick}
              onTaskClick={handleTaskClick}
            />
          ) : (
            <WeekView
              currentDate={currentMonth}
              showCompleted={showCompleted}
              categoryMap={categoryMap}
              onDayClick={handleDayClick}
              onTaskClick={handleTaskClick}
            />
          )
        ) : (
          <ListView
            showCompleted={showCompleted}
            categoryMap={categoryMap}
            onDayClick={handleDayClick}
            onTaskClick={handleTaskClick}
          />
        )}
      </main>
    </div>
  );
}

export default App;
