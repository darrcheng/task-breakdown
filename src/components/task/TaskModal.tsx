import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock, Pencil } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useCategoryMap } from '../../db/hooks';
import { TaskForm } from './TaskForm';
import type { TaskFormHandle } from './TaskForm';
import { BreakdownButton } from './BreakdownButton';
import { SubtaskReview } from './SubtaskReview';
import { SubtaskList } from './SubtaskList';
import { ProviderSetupModal } from '../settings/ProviderSetupModal';
import { RepeatModal } from './RepeatModal';
import { BottomSheet } from '../mobile/BottomSheet';
import { useBreakdown } from '../../hooks/useBreakdown';
import { useTimeEstimate } from '../../hooks/useTimeEstimate';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatEstimate, recordCalibration } from '../../utils/estimateCalibration';
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
  const { triggerEstimate } = useTimeEstimate();
  const isMobile = useIsMobile();

  // Ref to TaskForm — used for auto-save on Escape/backdrop click
  const formRef = useRef<TaskFormHandle>(null);

  // Flag to distinguish dismiss-triggered submit (backdrop/Escape) from explicit submit (Enter/Create button)
  const closingRef = useRef(false);

  // Repeat modal state
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  // Override editing state
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [overrideInput, setOverrideInput] = useState<string>('');

  // Derive viewingTask synchronously — no useEffect timing issue.
  const viewingTask = navigationOverride ?? task;

  // Reset navigation state when modal opens/closes or initial task changes.
  // We do NOT set viewingTask here; it is derived from the task prop above.
  useEffect(() => {
    setNavigationOverride(undefined);
    setParentStack([]);
    setShowRepeatModal(false);
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
          // Navigating back to parent — no auto-save needed
          handleBackToParent();
        } else {
          // Final close — auto-save form data first
          closingRef.current = true;
          const saved = formRef.current?.submit();
          if (!saved) {
            closingRef.current = false;
            onClose();
          }
          // If saved is true, handleSubmit will check closingRef and close
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
      // Trigger re-estimation on edit only if title changed
      if (data.title !== currentTask.title) {
        triggerEstimate(currentTask.id, data.title, data.description, data.categoryId);
      }
      onClose();
    } else {
      const newId = await db.tasks.add({
        ...data,
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // Trigger background estimation for new tasks
      triggerEstimate(newId as number, data.title, data.description, data.categoryId);

      // If dismiss-triggered (backdrop/Escape), close instead of staying in modal
      if (closingRef.current) {
        closingRef.current = false;
        onClose();
      } else {
        // Explicit submit — stay in modal to show BreakdownButton
        const newTask = await db.tasks.get(newId as number);
        if (newTask) {
          setNavigationOverride(newTask);
        } else {
          onClose();
        }
      }
    }
  };

  const handleSendToSomeday = async () => {
    if (currentTask?.id) {
      await db.tasks.update(currentTask.id, {
        isSomeday: true,
        updatedAt: new Date(),
      });
      onClose();
    }
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

  const handleRepeatSubmit = async (dates: string[]) => {
    if (!currentTask) return;
    const newTasks = dates.map((targetDate) => ({
      title: currentTask.title,
      description: currentTask.description,
      status: 'todo' as const,
      categoryId: currentTask.categoryId,
      depth: currentTask.depth,
      energyLevel: currentTask.energyLevel,
      timeEstimate: currentTask.timeEstimate,
      timeEstimateOverride: currentTask.timeEstimateOverride,
      date: targetDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    setShowRepeatModal(false);
    await db.tasks.bulkAdd(newTasks);
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

  // Backdrop click handler — auto-save form data before closing
  const handleBackdropClick = () => {
    closingRef.current = true;
    const saved = formRef.current?.submit();
    if (!saved) {
      closingRef.current = false;
      onClose();
    }
    // If saved is true, handleSubmit will check closingRef and close
  };

  // Shared modal content for both desktop and mobile
  const modalContent = (
    <>
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
        ref={formRef}
        key={currentTask?.id ?? 'new'}
        initialData={currentTask}
        initialDate={currentTask?.date ?? date}
        onSubmit={handleSubmit}
        onCancel={onClose}
        onDelete={currentTask?.id ? handleDelete : undefined}
        onRepeat={isEditing ? () => setShowRepeatModal(true) : undefined}
        submitLabel={currentTask?.id ? 'Save' : 'Create'}
        isEditing={isEditing}
        onSendToSomeday={isEditing ? handleSendToSomeday : undefined}
      />

      {/* Time estimate display — shown for saved tasks with an estimate */}
      {isEditing && currentTask && (() => {
        const effectiveEstimate = currentTask.timeEstimateOverride ?? currentTask.timeEstimate;
        if (!effectiveEstimate) return null;

        const handleOverrideSave = async () => {
          const minutes = parseInt(overrideInput, 10);
          if (!isNaN(minutes) && minutes >= 5 && minutes <= 480 && currentTask.id) {
            await db.tasks.update(currentTask.id, {
              timeEstimateOverride: minutes,
              updatedAt: new Date(),
            });
            recordCalibration(
              currentTask.categoryId,
              currentTask.timeEstimate ?? 0,
              minutes,
            );
          }
          setIsEditingOverride(false);
        };

        return (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span>
              Estimated:{' '}
              <span className="font-medium text-slate-700">
                ~{formatEstimate(effectiveEstimate)}
              </span>
              {currentTask.timeEstimateOverride && (
                <span className="ml-1 text-xs text-slate-400">(overridden)</span>
              )}
            </span>
            {isEditingOverride ? (
              <input
                type="number"
                step={5}
                min={5}
                max={480}
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                onBlur={handleOverrideSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleOverrideSave();
                  if (e.key === 'Escape') setIsEditingOverride(false);
                }}
                autoFocus
                className="w-20 text-xs border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="min"
              />
            ) : (
              <button
                onClick={() => {
                  setOverrideInput(String(effectiveEstimate));
                  setIsEditingOverride(true);
                }}
                className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                title="Override estimate"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })()}

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

      {/* Repeat modal */}
      {showRepeatModal && currentTask && (
        <RepeatModal
          isOpen={showRepeatModal}
          onClose={() => setShowRepeatModal(false)}
          onSubmit={handleRepeatSubmit}
          taskDate={currentTask.date}
        />
      )}
    </>
  );

  // Mobile: render in BottomSheet
  if (isMobile) {
    return (
      <>
        <BottomSheet isOpen={isOpen} onClose={handleBackdropClick}>
          {modalContent}
        </BottomSheet>

        {/* Provider setup modal (overlay on top) */}
        {showSetupModal && (
          <ProviderSetupModal
            isOpen={true}
            onClose={breakdown.cancelBreakdown}
            onConfigured={breakdown.onProviderConfigured}
            configureProvider={breakdown.configureProvider}
          />
        )}
      </>
    );
  }

  // Desktop: render as positioned popover
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
      />
      {/* Modal content */}
      <div
        className="fixed bg-white rounded-lg shadow-xl p-6 overflow-y-auto"
        style={positionStyle}
      >
        {modalContent}
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
