import { Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { Task } from '../../types';

interface BreakdownButtonProps {
  task: Task;
  onStartBreakdown: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function BreakdownButton({
  task,
  onStartBreakdown,
  isGenerating,
  disabled,
}: BreakdownButtonProps) {
  const depth = task.depth ?? 0;

  // Hide completely at max depth
  if (depth >= 3) return null;

  // Only show for saved tasks
  if (!task.id) return null;

  const isDisabled = isGenerating || disabled;

  return (
    <button
      onClick={onStartBreakdown}
      disabled={isDisabled}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        isDisabled
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
      )}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {isGenerating ? 'Breaking down...' : 'Break it down'}
      {depth > 0 && (
        <span className="text-xs opacity-75">(Level {depth + 1})</span>
      )}
    </button>
  );
}
