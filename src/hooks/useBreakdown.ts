import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '../db/database';
import { useAIProvider } from './useAIProvider';
import type { Task } from '../types';
import { buildRegenerationPrompt } from '../ai/prompts';
import type { SubtaskSuggestion } from '../ai/providers/types';

export interface ReviewSubtask {
  id: string;
  title: string;
  description: string;
  pinned: boolean;
  removed: boolean;
}

export type BreakdownState =
  | { status: 'idle' }
  | { status: 'configuring' }
  | { status: 'generating'; subtasks: ReviewSubtask[]; progress: number }
  | { status: 'reviewing'; subtasks: ReviewSubtask[] }
  | { status: 'accepting' }
  | { status: 'error'; message: string };

export function useBreakdown() {
  const [state, setState] = useState<BreakdownState>({ status: 'idle' });
  const { getProvider, configureProvider } = useAIProvider();
  const pendingTaskRef = useRef<Task | null>(null);
  const stateRef = useRef(state);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startBreakdown = useCallback(
    async (task: Task) => {
      // Check for internet connectivity before attempting AI API call
      if (!navigator.onLine) {
        setState({ status: 'error', message: 'No internet connection. Connect to a network to use AI breakdown.' });
        return;
      }

      const provider = await getProvider();
      if (!provider) {
        pendingTaskRef.current = task;
        setState({ status: 'configuring' });
        return;
      }

      setState({ status: 'generating', subtasks: [], progress: 0 });

      try {
        const subtasks: ReviewSubtask[] = [];

        await provider.generateSubtasks(
          task.title,
          task.description,
          '',
          {
            onSubtask: (suggestion: SubtaskSuggestion) => {
              const newSubtask: ReviewSubtask = {
                id: crypto.randomUUID(),
                title: suggestion.title,
                description: suggestion.description,
                pinned: false,
                removed: false,
              };
              subtasks.push(newSubtask);
              setState({
                status: 'generating',
                subtasks: [...subtasks],
                progress: subtasks.length,
              });
            },
            onComplete: () => {
              setState({ status: 'reviewing', subtasks: [...subtasks] });
            },
            onError: (error: Error) => {
              setState({ status: 'error', message: error.message });
            },
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      }
    },
    [getProvider],
  );

  const onProviderConfigured = useCallback(() => {
    const task = pendingTaskRef.current;
    if (task) {
      pendingTaskRef.current = null;
      // Don't call startBreakdown (which checks stale isConfigured).
      // Instead, directly proceed to generation since we KNOW config just succeeded.
      setState({ status: 'generating', subtasks: [], progress: 0 });

      (async () => {
        try {
          const provider = await getProvider();
          if (!provider) {
            setState({ status: 'error', message: 'Failed to load AI provider.' });
            return;
          }

          const subtasks: ReviewSubtask[] = [];
          await provider.generateSubtasks(
            task.title,
            task.description,
            '',
            {
              onSubtask: (suggestion: SubtaskSuggestion) => {
                const newSubtask: ReviewSubtask = {
                  id: crypto.randomUUID(),
                  title: suggestion.title,
                  description: suggestion.description,
                  pinned: false,
                  removed: false,
                };
                subtasks.push(newSubtask);
                setState({
                  status: 'generating',
                  subtasks: [...subtasks],
                  progress: subtasks.length,
                });
              },
              onComplete: () => {
                setState({ status: 'reviewing', subtasks: [...subtasks] });
              },
              onError: (error: Error) => {
                setState({ status: 'error', message: error.message });
              },
            },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setState({ status: 'error', message });
        }
      })();
    } else {
      setState({ status: 'idle' });
    }
  }, [getProvider]);

  const editSubtask = useCallback((id: string, title: string) => {
    setState((prev) => {
      if (prev.status !== 'reviewing') return prev;
      return {
        ...prev,
        subtasks: prev.subtasks.map((s) => (s.id === id ? { ...s, title } : s)),
      };
    });
  }, []);

  const editSubtaskDescription = useCallback((id: string, description: string) => {
    setState((prev) => {
      if (prev.status !== 'reviewing') return prev;
      return {
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.id === id ? { ...s, description } : s,
        ),
      };
    });
  }, []);

  const removeSubtask = useCallback((id: string) => {
    setState((prev) => {
      if (prev.status !== 'reviewing') return prev;
      return {
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.id === id ? { ...s, removed: true } : s,
        ),
      };
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setState((prev) => {
      if (prev.status !== 'reviewing') return prev;
      return {
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.id === id ? { ...s, pinned: !s.pinned } : s,
        ),
      };
    });
  }, []);

  const reorderSubtasks = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      if (prev.status !== 'reviewing') return prev;
      const items = [...prev.subtasks];
      const activeIndex = items.findIndex((s) => s.id === activeId);
      const overIndex = items.findIndex((s) => s.id === overId);
      if (activeIndex === -1 || overIndex === -1) return prev;

      const [movedItem] = items.splice(activeIndex, 1);
      items.splice(overIndex, 0, movedItem);

      return { ...prev, subtasks: items };
    });
  }, []);

  const acceptSubtasks = useCallback(
    async (parentTask: Task) => {
      // Capture subtasks from current state ref before transitioning
      const currentState = stateRef.current;
      if (currentState.status !== 'reviewing') {
        setState({ status: 'error', message: 'Cannot accept subtasks outside review state.' });
        return;
      }

      const activeSubtasks = currentState.subtasks.filter((s) => !s.removed);
      if (activeSubtasks.length === 0) {
        setState({ status: 'idle' });
        return;
      }

      setState({ status: 'accepting' });

      try {
        const tasksToAdd = activeSubtasks.map((subtask, index) => ({
          title: subtask.title,
          description: subtask.description,
          date: parentTask.date,
          status: 'todo' as const,
          categoryId: parentTask.categoryId,
          parentId: parentTask.id!,
          depth: (parentTask.depth ?? 0) + 1,
          sortOrder: index,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.tasks.bulkAdd(tasksToAdd);
        setState({ status: 'idle' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      }
    },
    [],
  );

  const cancelBreakdown = useCallback(() => {
    pendingTaskRef.current = null;
    setState({ status: 'idle' });
  }, []);

  const regenerateSubtasks = useCallback(
    async (task: Task) => {
      const currentState = stateRef.current;
      if (currentState.status !== 'reviewing') return;

      const pinnedSubtasks = currentState.subtasks.filter(
        (s) => s.pinned && !s.removed,
      );

      setState({
        status: 'generating',
        subtasks: [...pinnedSubtasks],
        progress: pinnedSubtasks.length,
      });

      try {
        const provider = await getProvider();
        if (!provider) {
          setState({ status: 'error', message: 'Failed to load AI provider.' });
          return;
        }

        const allSubtasks = [...pinnedSubtasks];
        const pinnedTitles = pinnedSubtasks.map((s) => s.title);

        const targetCount = 4;
        const newCount = Math.max(1, targetCount - pinnedSubtasks.length);
        const prompt = buildRegenerationPrompt(
          task.title,
          task.description,
          '',
          pinnedTitles,
          newCount,
        );

        await provider.generateSubtasks(task.title, prompt, '', {
          onSubtask: (suggestion: SubtaskSuggestion) => {
            const newSubtask: ReviewSubtask = {
              id: crypto.randomUUID(),
              title: suggestion.title,
              description: suggestion.description,
              pinned: false,
              removed: false,
            };
            allSubtasks.push(newSubtask);
            setState({
              status: 'generating',
              subtasks: [...allSubtasks],
              progress: allSubtasks.length,
            });
          },
          onComplete: () => {
            setState({ status: 'reviewing', subtasks: [...allSubtasks] });
          },
          onError: (error: Error) => {
            setState({ status: 'error', message: error.message });
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      }
    },
    [getProvider],
  );

  return {
    state,
    startBreakdown,
    onProviderConfigured,
    configureProvider,
    editSubtask,
    editSubtaskDescription,
    removeSubtask,
    togglePin,
    reorderSubtasks,
    acceptSubtasks,
    cancelBreakdown,
    regenerateSubtasks,
  };
}
