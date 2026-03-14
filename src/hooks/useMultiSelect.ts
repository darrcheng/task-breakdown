import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import React from 'react';
import type { Task } from '../types';

interface MultiSelectContextValue {
  selectedIds: Set<number>;
  lastClickedId: number | null;
  lastClickedDate: string | null;
  /**
   * Main entry point for task click handling with modifier keys.
   * @param task - The clicked task
   * @param e - The mouse event (to check ctrlKey/metaKey/shiftKey)
   * @param dayTaskIds - Ordered list of task IDs for the task's day (for shift+click range)
   * @returns true if modifier key was used (caller should NOT open modal), false for plain click
   */
  handleTaskClick: (task: Task, e: React.MouseEvent, dayTaskIds: number[]) => boolean;
  clearSelection: () => void;
  isSelected: (id: number) => boolean;
}

const MultiSelectContext = createContext<MultiSelectContextValue | null>(null);

export function useMultiSelectContext(): MultiSelectContextValue {
  const ctx = useContext(MultiSelectContext);
  if (!ctx) {
    throw new Error('useMultiSelectContext must be used within a MultiSelectProvider');
  }
  return ctx;
}

interface MultiSelectProviderProps {
  children: ReactNode;
}

export function MultiSelectProvider({ children }: MultiSelectProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<number | null>(null);
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastClickedId(null);
    setLastClickedDate(null);
  }, []);

  const isSelected = useCallback((id: number) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const handleTaskClick = useCallback((task: Task, e: React.MouseEvent, dayTaskIds: number[]): boolean => {
    const taskId = task.id;
    if (taskId == null) return false;

    // Ctrl+click or Cmd+click: toggle individual selection
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
        return next;
      });
      setLastClickedId(taskId);
      setLastClickedDate(task.date);
      return true;
    }

    // Shift+click: range selection within same day
    if (e.shiftKey) {
      if (lastClickedId !== null && lastClickedDate === task.date) {
        // Same day — select range
        const anchorIndex = dayTaskIds.indexOf(lastClickedId);
        const currentIndex = dayTaskIds.indexOf(taskId);

        if (anchorIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(anchorIndex, currentIndex);
          const end = Math.max(anchorIndex, currentIndex);
          const rangeIds = dayTaskIds.slice(start, end + 1);

          setSelectedIds(prev => {
            const next = new Set(prev);
            for (const id of rangeIds) {
              next.add(id);
            }
            return next;
          });
          // Do NOT update lastClickedId — anchor stays (standard behavior)
          return true;
        }
      }

      // Cross-day shift+click or no anchor: treat as ctrl+click toggle
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
        return next;
      });
      setLastClickedId(taskId);
      setLastClickedDate(task.date);
      return true;
    }

    // Plain click (no modifiers): clear selection, let caller handle normal behavior
    if (selectedIds.size > 0) {
      clearSelection();
    }
    return false;
  }, [lastClickedId, lastClickedDate, selectedIds.size, clearSelection]);

  const value: MultiSelectContextValue = {
    selectedIds,
    lastClickedId,
    lastClickedDate,
    handleTaskClick,
    clearSelection,
    isSelected,
  };

  return React.createElement(MultiSelectContext.Provider, { value }, children);
}
