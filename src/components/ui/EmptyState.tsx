import { CalendarDays } from 'lucide-react';
import type { ViewMode } from '../../types';

interface EmptyStateProps {
  viewMode: ViewMode;
}

export function EmptyState({ viewMode }: EmptyStateProps) {
  return (
    <div className="text-center py-8 px-4">
      <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">
        {viewMode === 'calendar'
          ? 'Click a day to add your first task'
          : 'Click + to add your first task'}
      </p>
    </div>
  );
}
