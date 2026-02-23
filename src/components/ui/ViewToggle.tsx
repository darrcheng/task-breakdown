import { Calendar, List, Archive } from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '../../types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
      <button
        onClick={() => onViewModeChange('calendar')}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors',
          viewMode === 'calendar'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
        aria-label="Calendar view"
      >
        <Calendar className="w-4 h-4" />
        <span>Calendar</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors',
          viewMode === 'list'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
        <span>List</span>
      </button>
      <button
        onClick={() => onViewModeChange('someday')}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors',
          viewMode === 'someday'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
        aria-label="Someday view"
      >
        <Archive className="w-4 h-4" />
        <span className="hidden sm:inline">Someday</span>
      </button>
    </div>
  );
}
