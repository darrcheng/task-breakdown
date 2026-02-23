import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pin, X } from 'lucide-react';
import clsx from 'clsx';
import type { ReviewSubtask } from '../../hooks/useBreakdown';

interface SortableSubtaskItemProps {
  subtask: ReviewSubtask;
  onEdit: (id: string, title: string) => void;
  onEditDescription: (id: string, description: string) => void;
  onRemove: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function SortableSubtaskItem({
  subtask,
  onEdit,
  onEditDescription,
  onRemove,
  onTogglePin,
}: SortableSubtaskItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editDesc, setEditDesc] = useState(subtask.description);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== subtask.title) {
      onEdit(subtask.id, trimmed);
    } else {
      setEditTitle(subtask.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescSave = () => {
    if (editDesc !== subtask.description) {
      onEditDescription(subtask.id, editDesc);
    }
    setIsEditingDesc(false);
  };

  if (subtask.removed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-lg border border-slate-200 p-3 opacity-40 line-through"
      >
        <span className="text-sm text-slate-500">{subtask.title}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white rounded-lg border border-slate-200 p-3 transition-shadow',
        isDragging && 'shadow-lg opacity-90 z-10',
        'hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setEditTitle(subtask.title);
                  setIsEditingTitle(false);
                }
              }}
              className="w-full text-sm font-medium text-slate-800 border border-blue-400 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          ) : (
            <div
              onClick={() => {
                setEditTitle(subtask.title);
                setIsEditingTitle(true);
              }}
              className="text-sm font-medium text-slate-800 cursor-text hover:bg-slate-50 rounded px-1 -mx-1"
            >
              {subtask.title}
            </div>
          )}

          {isEditingDesc ? (
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleDescSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditDesc(subtask.description);
                  setIsEditingDesc(false);
                }
              }}
              rows={2}
              className="w-full mt-1 text-xs text-slate-500 border border-blue-400 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              autoFocus
            />
          ) : (
            subtask.description && (
              <div
                onClick={() => {
                  setEditDesc(subtask.description);
                  setIsEditingDesc(true);
                }}
                className="text-xs text-slate-500 mt-0.5 cursor-text hover:bg-slate-50 rounded px-1 -mx-1"
              >
                {subtask.description}
              </div>
            )
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onTogglePin(subtask.id)}
            className={clsx(
              'p-1 rounded transition-colors',
              subtask.pinned
                ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50',
            )}
            title={subtask.pinned ? 'Unpin subtask' : 'Pin subtask (keeps on regenerate)'}
          >
            <Pin className={clsx('w-3.5 h-3.5', subtask.pinned && 'fill-current')} />
          </button>
          <button
            onClick={() => onRemove(subtask.id)}
            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove subtask"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
