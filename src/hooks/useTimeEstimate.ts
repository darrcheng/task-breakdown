import { useCallback, useRef } from 'react';
import { useAIProvider } from './useAIProvider';
import { db } from '../db/database';
import { getCalibrationHint } from '../utils/estimateCalibration';

/**
 * Background AI time estimation hook.
 * Provides a fire-and-forget triggerEstimate function that:
 * 1. Calls the AI provider to estimate task duration
 * 2. Writes the result back to the DB if valid
 * 3. Never blocks the UI — caller must NOT await triggerEstimate
 */
export function useTimeEstimate() {
  const { getProvider } = useAIProvider();
  // AbortController ref for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  const triggerEstimate = useCallback(
    (
      taskId: number,
      title: string,
      description: string,
      categoryId: number,
    ): void => {
      // Cancel any in-flight request for this hook instance
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Fire-and-forget — intentionally not awaited
      void (async () => {
        try {
          const provider = await getProvider();
          if (!provider) return;
          if (controller.signal.aborted) return;

          const calibrationHint = getCalibrationHint(categoryId);
          const result = await provider.estimateTime(title, description, calibrationHint);

          if (controller.signal.aborted) return;
          if (result !== null && result > 0) {
            await db.tasks.update(taskId, {
              timeEstimate: result,
              updatedAt: new Date(),
            });
          }
        } catch (error) {
          // Fire-and-forget: log but never throw
          console.error('[useTimeEstimate] estimation failed:', error);
        }
      })();
    },
    [getProvider],
  );

  return { triggerEstimate };
}
