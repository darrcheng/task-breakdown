import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { formatDateKey } from '../../utils/dates';

const DISMISS_KEY = 'taskbreaker-overdue-dismissed';

interface OverdueBannerProps {
  taskCount: number;
  onOpenPicker: () => void;
}

export function OverdueBanner({ taskCount, onOpenPicker }: OverdueBannerProps) {
  const today = useMemo(() => formatDateKey(new Date()), []);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === today
  );

  if (dismissed || taskCount === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, today);
    setDismissed(true);
  };

  const message =
    taskCount === 1
      ? "You've got 1 task from earlier — want to move it?"
      : `You've got ${taskCount} tasks from earlier this week — want to move them?`;

  return (
    <div className="mx-4 mt-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-sm text-amber-800">
      <span>{message}</span>
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <button
          onClick={onOpenPicker}
          className="font-medium underline hover:text-amber-900 transition-colors"
        >
          Review
        </button>
        <button
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-amber-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
