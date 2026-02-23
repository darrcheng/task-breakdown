import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useCategoryMap } from '../../db/hooks';
import { TaskForm } from './TaskForm';
import { BreakdownButton } from './BreakdownButton';
import { SubtaskReview } from './SubtaskReview';
import { SubtaskList } from './SubtaskList';
import { ProviderSetupModal } from '../settings/ProviderSetupModal';
import { useBreakdown } from '../../hooks/useBreakdown';
import type { Task } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  task?: Task;
  clickPosition?: { x: number; y: number };
}

export function TaskModal({ isOpen, onClose, date, task, clickPosition }: TaskModalProps) {
  // Support navigating into subtasks without closing the modal.
  // navigationOverride holds the task when user drills into a subtask;
  // viewingTask is derived directly from it (no useEffect delay).
  const [navigationOverride, setNavigationOverride] = useState<Task | undefined>();
  const [parentStack, setParentStack] = useState<Task[]>([]);

  const breakdown = useBreakdown();
  const categoryMap = useCategoryMap();

  // Derive viewingTask synchronously — no useEffect timing issue.
  const viewingTask = navigationOverride ?? task;

  // Reset navigation state when modal opens/closes or initial task changes.
  // We do NOT set viewingTask here; it is derived from the task prop above.
  useEffect(() => {
    setNavigationOverride(undefined);
    setParentStack([]);
    if (!isOpen) {
      breakdown.cancelBreakdown();
    }
  }, [isOpen, task]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live-load the current task so we get fresh data after subtask creation
  const liveTask = useLiveQuery(
    () => (viewingTask?.id ? db.tasks.get(viewingTask.id) : undefined),
    [viewingTask?.id],
  );

  // Use live task when available, fall back to viewing task
  const currentTask = liveTask ?? viewingTask;

  // Fetch parent task reactively so breadcrumb works when opening a subtask directly
  // from calendar/board (parentStack is empty in that case, but parentId is set).
  const parentTask = useLiveQuery(
    () => (currentTask?.parentId ? db.tasks.get(currentTask.parentId) : undefined),
    [currentTask?.parentId],
  );

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (parentStack.length > 0 || parentTask) {
          handleBackToParent();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, parentStack, parentTask]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleSubmit = async (data: {
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    categoryId: number;
    date: string;
    energyLevel: import('../../types').EnergyLevel | null;
  }) => {
    if (currentTask?.id) {
      await db.tasks.update(currentTask.id, {
        ...data,
        updatedAt: new Date(),
      });
    } else {
      await db.tasks.add({
        ...data,
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (currentTask?.id) {
      await db.tasks.delete(currentTask.id);
      if (parentStack.length > 0 || parentTask) {
        handleBackToParent();
      } else {
        onClose();
      }
    }
  };

  const handleOpenSubtask = (subtask: Task) => {
    if (currentTask) {
      setParentStack((prev) => [...prev, currentTask]);
    }
    setNavigationOverride(subtask);
    breakdown.cancelBreakdown();
  };

  const handleBackToParent = () => {
    if (parentStack.length > 0) {
      const parent = parentStack[parentStack.length - 1];
      setParentStack((prev) => prev.slice(0, -1));
      // When returning to the root task (last item on stack), clear the
      // override so the original task prop takes over again.
      if (parentStack.length === 1) {
        setNavigationOverride(undefined);
      } else {
        setNavigationOverride(parent);
      }
    } else if (parentTask) {
      // Subtask was opened directly from calendar/board — navigate to parent.
      setNavigationOverride(parentTask);
    }
    breakdown.cancelBreakdown();
  };

  const isEditing = !!currentTask?.id;
  const isGenerating =
    breakdown.state.status === 'generating' ||
    breakdown.state.status === 'accepting';
  const showReview =
    breakdown.state.status === 'generating' ||
    breakdown.state.status === 'reviewing';
  const showSetupModal = breakdown.state.status === 'configuring';

  // Calculate position with viewport clamping
  const MODAL_WIDTH = 420;
  const MODAL_HEIGHT = 700;
  const positionStyle: React.CSSProperties = clickPosition
    ? {
        left: Math.min(clickPosition.x + 8, window.innerWidth - MODAL_WIDTH - 16),
        top: Math.min(Math.max(clickPosition.y - 100, 16), window.innerHeight - MODAL_HEIGHT - 16),
        width: `${MODAL_WIDTH}px`,
        maxHeight: `${MODAL_HEIGHT}px`,
      }
    : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: `${MODAL_WIDTH}px`,
        width: '100%',
      };

  // Breadcrumb text: show the actual parent task title.
  const breadcrumbTitle =
    parentStack.length > 0
      ? parentStack[parentStack.length - 1].title
      : parentTask?.title ?? 'parent';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className="fixed bg-white rounded-lg shadow-xl p-6 overflow-y-auto"
        style={positionStyle}
      >
        {/* Back to parent breadcrumb — shown when navigating via drill-down OR
            when opening a subtask directly from calendar/board view */}
        {(parentStack.length > 0 || parentTask) && (
          <button
            onClick={handleBackToParent}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3 -mt-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {breadcrumbTitle}
          </button>
        )}

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {currentTask?.id ? 'Edit Task' : 'New Task'}
        </h2>

        {/* key prop forces TaskForm to remount when task identity changes,
            ensuring useState initializers run fresh with up-to-date data */}
        <TaskForm
          key={currentTask?.id ?? 'new'}
          initialData={currentTask}
          initialDate={currentTask?.date ?? date}
          onSubmit={handleSubmit}
          onCancel={onClose}
          onDelete={currentTask?.id ? handleDelete : undefined}
          submitLabel={currentTask?.id ? 'Save' : 'Create'}
        />

        {/* Breakdown button - only for saved tasks */}
        {isEditing && currentTask && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <BreakdownButton
              task={currentTask}
              onStartBreakdown={() => breakdown.startBreakdown(currentTask)}
              isGenerating={isGenerating}
            />
          </div>
        )}

        {/* Error message */}
        {breakdown.state.status === 'error' && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {breakdown.state.message}
          </div>
        )}

        {/* Subtask review panel */}
        {showReview && currentTask && (
          <SubtaskReview
            state={breakdown.state}
            onAccept={() => breakdown.acceptSubtasks(currentTask)}
            onCancel={breakdown.cancelBreakdown}
            onRegenerate={() => breakdown.regenerateSubtasks(currentTask)}
            onEdit={breakdown.editSubtask}
            onEditDescription={breakdown.editSubtaskDescription}
            onRemove={breakdown.removeSubtask}
            onReorder={breakdown.reorderSubtasks}
            onTogglePin={breakdown.togglePin}
          />
        )}

        {/* Existing subtasks list */}
        {isEditing && currentTask?.id && !showReview && (
          <SubtaskList
            parentId={currentTask.id}
            parentDepth={currentTask.depth ?? 0}
            categoryMap={categoryMap}
            onOpenSubtask={handleOpenSubtask}
          />
        )}
      </div>

      {/* Provider setup modal (overlay on top) */}
      {showSetupModal && (
        <ProviderSetupModal
          isOpen={true}
          onClose={breakdown.cancelBreakdown}
          onConfigured={breakdown.onProviderConfigured}
          configureProvider={breakdown.configureProvider}
        />
      )}
    </div>
  );
}
