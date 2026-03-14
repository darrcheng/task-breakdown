import { useState, useCallback } from 'react';

export function useMultiSelect() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      // If all ids are already selected, deselect them all (toggle behavior)
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        for (const id of ids) {
          next.delete(id);
        }
      } else {
        for (const id of ids) {
          next.add(id);
        }
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const enterMultiSelect = useCallback(() => {
    setIsMultiSelectActive(true);
  }, []);

  const exitMultiSelect = useCallback(() => {
    setIsMultiSelectActive(false);
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    isMultiSelectActive,
    toggleSelect,
    selectAll,
    clearSelection,
    enterMultiSelect,
    exitMultiSelect,
  };
}
