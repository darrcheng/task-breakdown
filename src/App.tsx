import { useState, useEffect } from 'react';
import { Eye, EyeOff, Tag, Settings, Battery, BatteryMedium, Zap } from 'lucide-react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { WeekView } from './components/calendar/WeekView';
import { MonthNavigation } from './components/calendar/MonthNavigation';
import { OverdueBanner } from './components/calendar/OverdueBanner';
import { ListView } from './components/list/ListView';
import { TaskModal } from './components/task/TaskModal';
import { ViewToggle } from './components/ui/ViewToggle';
import { EmptyState } from './components/ui/EmptyState';
import { CategoryManager } from './components/ui/CategoryManager';
import { SettingsModal } from './components/ui/SettingsModal';
import { DndProvider } from './components/dnd/DndProvider';
import { OverdueQuickPicker } from './components/overdue/OverdueQuickPicker';
import { SomedayView } from './components/overdue/SomedayView';
import { useCategoryMap, useTaskCount, useOverdueTasks } from './db/hooks';
import { useSettings } from './hooks/useSettings';
import { formatDateKey } from './utils/dates';
import type { ViewMode, CalendarView, Task, EnergyLevel } from './types';

interface ModalState {
  isOpen: boolean;
  date: string;
  task?: Task;
  clickPosition?: { x: number; y: number };
}

const ENERGY_FILTER_OPTIONS: { value: EnergyLevel; label: string; icon: typeof Battery; activeClass: string }[] = [
  { value: 'low', label: 'Low', icon: Battery, activeClass: 'text-sky-600 bg-sky-50 border-sky-300' },
  { value: 'medium', label: 'Med', icon: BatteryMedium, activeClass: 'text-amber-600 bg-amber-50 border-amber-300' },
  { value: 'high', label: 'High', icon: Zap, activeClass: 'text-emerald-600 bg-emerald-50 border-emerald-300' },
];

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showCompleted, setShowCompleted] = useState(false);
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    date: '',
  });

  const categoryMap = useCategoryMap();
  const taskCount = useTaskCount();
  const overdueTasks = useOverdueTasks();
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
      if (modalState.isOpen || isCategoryManagerOpen || isSettingsOpen || isQuickPickerOpen) return;

      switch (e.key) {
        case 'j': // Next period
          e.preventDefault();
          setCurrentMonth(prev =>
            calendarView === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
          );
          break;
        case 'k': // Previous period
          e.preventDefault();
          setCurrentMonth(prev =>
            calendarView === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)
          );
          break;
        case 't': // Today
          e.preventDefault();
          setCurrentMonth(new Date());
          break;
        case 'm': // Month view
          e.preventDefault();
          setCalendarView('month');
          setViewMode('calendar');
          break;
        case 'w': // Week view
          e.preventDefault();
          setCalendarView('week');
          setViewMode('calendar');
          break;
        case 'c': // Calendar view
          e.preventDefault();
          setViewMode('calendar');
          break;
        case 'l': // List view
          e.preventDefault();
          setViewMode('list');
          break;
        case 's': // Someday view
          e.preventDefault();
          setViewMode('someday');
          break;
        case 'n': // New task (defaults to today)
          e.preventDefault();
          setModalState({ isOpen: true, date: formatDateKey(new Date()) });
          break;
        case 'Enter': // Inline create in list view
          e.preventDefault();
          if (viewMode === 'list') {
            window.dispatchEvent(new CustomEvent('taskbreaker:inline-create', {
              detail: { date: formatDateKey(new Date()) }
            }));
          }
          break;
        case '?': // Open settings
          e.preventDefault();
          setIsSettingsOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calendarView, viewMode, modalState.isOpen, isCategoryManagerOpen, isSettingsOpen, isQuickPickerOpen]);

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

  const handleTaskClickList = (task: Task) => {
    setModalState({ isOpen: true, date: task.date, task });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, date: '' });
  };

  const handleEnergyFilterClick = (value: EnergyLevel) => {
    setEnergyFilter(prev => (prev === value ? null : value));
  };

  const isEmpty = taskCount === 0;

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">TaskBreaker</h1>
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

          {/* Energy filter chips */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-3 ml-1">
            {ENERGY_FILTER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = energyFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleEnergyFilterClick(opt.value)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full border transition-colors ${
                    isActive
                      ? opt.activeClass
                      : 'text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                  title={`Filter by ${opt.label} energy`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

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

      {/* Calendar navigation — only shown in calendar view */}
      {viewMode === 'calendar' && (
        <MonthNavigation
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          calendarView={calendarView}
          onCalendarViewChange={setCalendarView}
        />
      )}

      {/* Overdue banner — only shown in calendar view */}
      {viewMode === 'calendar' && overdueTasks && overdueTasks.length > 0 && (
        <OverdueBanner
          taskCount={overdueTasks.length}
          onOpenPicker={() => setIsQuickPickerOpen(true)}
        />
      )}

      {/* Empty state hint (overlaid, not replacing views) */}
      {isEmpty && <EmptyState viewMode={viewMode} />}

      {/* Main content */}
      {viewMode === 'someday' ? (
        <main className="flex-1 flex flex-col overflow-hidden">
          <SomedayView categoryMap={categoryMap} />
        </main>
      ) : (
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
                  energyFilter={energyFilter}
                />
              ) : (
                <WeekView
                  currentDate={currentMonth}
                  showCompleted={showCompleted}
                  categoryMap={categoryMap}
                  onDayClick={handleDayClick}
                  onTaskClick={handleTaskClickCalendar}
                  weekStartsOn={settings.weekStartsOn}
                  energyFilter={energyFilter}
                />
              )
            ) : (
              <ListView
                showCompleted={showCompleted}
                categoryMap={categoryMap}
                onDayClick={handleDayClick}
                onTaskClick={handleTaskClickList}
                energyFilter={energyFilter}
              />
            )}
          </main>
        </DndProvider>
      )}

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

      {/* Overdue quick picker */}
      <OverdueQuickPicker
        isOpen={isQuickPickerOpen}
        onClose={() => setIsQuickPickerOpen(false)}
        tasks={overdueTasks ?? []}
      />
    </div>
  );
}

export default App;
