import { useState } from 'react';
import { Eye, EyeOff, Tag } from 'lucide-react';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { WeekView } from './components/calendar/WeekView';
import { MonthNavigation } from './components/calendar/MonthNavigation';
import { ListView } from './components/list/ListView';
import { TaskModal } from './components/task/TaskModal';
import { ViewToggle } from './components/ui/ViewToggle';
import { EmptyState } from './components/ui/EmptyState';
import { CategoryManager } from './components/ui/CategoryManager';
import { DndProvider } from './components/dnd/DndProvider';
import { useCategoryMap, useTaskCount } from './db/hooks';
import type { ViewMode, CalendarView, Task } from './types';

interface ModalState {
  isOpen: boolean;
  date: string;
  task?: Task;
}

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    date: '',
  });

  const categoryMap = useCategoryMap();
  const taskCount = useTaskCount();

  const handleDayClick = (date: string) => {
    if (viewMode === 'calendar') {
      // Calendar view: open create modal
      setModalState({ isOpen: true, date });
    }
    // List view handles inline create internally via DayGroup
  };

  const handleTaskClickCalendar = (task: Task) => {
    // Calendar view: open edit modal
    setModalState({ isOpen: true, date: task.date, task });
  };

  const handleTaskClickList = (task: Task) => {
    // List view: handled inline by DayGroup/TaskInlineEdit
    // This is a no-op at App level for list view
  };

  const closeModal = () => {
    setModalState({ isOpen: false, date: '' });
  };

  const isEmpty = taskCount === 0;

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
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 border border-slate-300 transition-colors"
            title="Manage categories"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Categories</span>
          </button>
        </div>
      </header>

      {/* Calendar navigation */}
      {viewMode === 'calendar' && (
        <MonthNavigation
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          calendarView={calendarView}
          onCalendarViewChange={setCalendarView}
        />
      )}

      {/* Empty state hint (overlaid, not replacing views) */}
      {isEmpty && <EmptyState viewMode={viewMode} />}

      {/* Main content */}
      <DndProvider categoryMap={categoryMap}>
        <main className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'calendar' ? (
            calendarView === 'month' ? (
              <CalendarGrid
                month={currentMonth}
                showCompleted={showCompleted}
                categoryMap={categoryMap}
                onDayClick={handleDayClick}
                onTaskClick={handleTaskClickCalendar}
              />
            ) : (
              <WeekView
                currentDate={currentMonth}
                showCompleted={showCompleted}
                categoryMap={categoryMap}
                onDayClick={handleDayClick}
                onTaskClick={handleTaskClickCalendar}
              />
            )
          ) : (
            <ListView
              showCompleted={showCompleted}
              categoryMap={categoryMap}
              onDayClick={handleDayClick}
              onTaskClick={handleTaskClickList}
            />
          )}
        </main>
      </DndProvider>

      {/* Task modal (calendar view create/edit) */}
      <TaskModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        date={modalState.date}
        task={modalState.task}
      />

      {/* Category manager */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
}

export default App;
