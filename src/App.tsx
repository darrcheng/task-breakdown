import { useState, useEffect } from 'react';
import { Eye, EyeOff, Tag, Settings } from 'lucide-react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { WeekView } from './components/calendar/WeekView';
import { MonthNavigation } from './components/calendar/MonthNavigation';
import { ListView } from './components/list/ListView';
import { TaskModal } from './components/task/TaskModal';
import { ViewToggle } from './components/ui/ViewToggle';
import { EmptyState } from './components/ui/EmptyState';
import { CategoryManager } from './components/ui/CategoryManager';
import { SettingsModal } from './components/ui/SettingsModal';
import { DndProvider } from './components/dnd/DndProvider';
import { useCategoryMap, useTaskCount } from './db/hooks';
import { useSettings } from './hooks/useSettings';
import { formatDateKey } from './utils/dates';
import type { ViewMode, CalendarView, Task } from './types';

interface ModalState {
  isOpen: boolean;
  date: string;
  task?: Task;
  clickPosition?: { x: number; y: number };
}

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    date: '',
  });

  const categoryMap = useCategoryMap();
  const taskCount = useTaskCount();
  const { settings, updateSettings } = useSettings();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: don't fire in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      // Guard: don't fire with modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Guard: don't fire when any modal/overlay is open
      if (modalState.isOpen || isCategoryManagerOpen || isSettingsOpen) return;

      switch (e.key) {
        case 'j': // Next period
          setCurrentMonth(prev =>
            calendarView === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
          );
          break;
        case 'k': // Previous period
          setCurrentMonth(prev =>
            calendarView === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)
          );
          break;
        case 't': // Today
          setCurrentMonth(new Date());
          break;
        case 'c': // Calendar view
          setViewMode('calendar');
          break;
        case 'l': // List view
          setViewMode('list');
          break;
        case 'n': // New task (defaults to today)
          setModalState({ isOpen: true, date: formatDateKey(new Date()) });
          break;
        case '?': // Open settings
          setIsSettingsOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calendarView, viewMode, modalState.isOpen, isCategoryManagerOpen, isSettingsOpen]);

  const handleDayClick = (date: string, clickPosition?: { x: number; y: number }) => {
    if (viewMode === 'calendar') {
      // Calendar view: open create modal
      setModalState({ isOpen: true, date, clickPosition });
    }
    // List view handles inline create internally via DayGroup
  };

  const handleTaskClickCalendar = (task: Task, clickPosition?: { x: number; y: number }) => {
    // Calendar view: open edit modal
    setModalState({ isOpen: true, date: task.date, task, clickPosition });
  };

  const handleTaskClickList = (_task: Task) => {
    // List view: handled inline by DayGroup/TaskInlineEdit
    // This is a no-op at App level for list view
  };

  const closeModal = () => {
    setModalState({ isOpen: false, date: '' });
  };

  const isEmpty = taskCount === 0;

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
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
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 border border-slate-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
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
                weekStartsOn={settings.weekStartsOn}
              />
            ) : (
              <WeekView
                currentDate={currentMonth}
                showCompleted={showCompleted}
                categoryMap={categoryMap}
                onDayClick={handleDayClick}
                onTaskClick={handleTaskClickCalendar}
                weekStartsOn={settings.weekStartsOn}
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
        clickPosition={modalState.clickPosition}
      />

      {/* Category manager */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />

      {/* Settings modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}

export default App;
