import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { RefreshCw, Check, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { SortableSubtaskItem } from './SortableSubtaskItem';
import type { BreakdownState, ReviewSubtask } from '../../hooks/useBreakdown';

interface SubtaskReviewProps {
  state: BreakdownState;
  onAccept: () => void;
  onCancel: () => void;
  onRegenerate: () => void;
  onEdit: (id: string, title: string) => void;
  onEditDescription: (id: string, description: string) => void;
  onRemove: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onTogglePin: (id: string) => void;
}

export function SubtaskReview({
  state,
  onAccept,
  onCancel,
  onRegenerate,
  onEdit,
  onEditDescription,
  onRemove,
  onReorder,
  onTogglePin,
}: SubtaskReviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (state.status !== 'generating' && state.status !== 'reviewing') {
    return null;
  }

  const subtasks: ReviewSubtask[] = state.subtasks;
  const visibleSubtasks = subtasks.filter((s) => !s.removed);
  const pinnedCount = subtasks.filter((s) => s.pinned && !s.removed).length;
  const isGenerating = state.status === 'generating';
  const isReviewing = state.status === 'reviewing';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">
          {isGenerating ? 'Generating subtasks...' : 'Review subtasks'}
        </h3>
        <span className="text-xs text-slate-500">
          {visibleSubtasks.length} subtask{visibleSubtasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Subtask list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subtasks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <SortableSubtaskItem
                key={subtask.id}
                subtask={subtask}
                onEdit={onEdit}
                onEditDescription={onEditDescription}
                onRemove={onRemove}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating...</span>
        </div>
      )}

      {/* Action bar */}
      {isReviewing && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onAccept}
            disabled={visibleSubtasks.length === 0}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              visibleSubtasks.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            <Check className="w-4 h-4" />
            Accept All
          </button>

          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Pinned subtasks will be kept, unpinned will be replaced"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
            {pinnedCount > 0 && (
              <span className="text-xs text-slate-400">
                (keeping {pinnedCount})
              </span>
            )}
          </button>

          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
