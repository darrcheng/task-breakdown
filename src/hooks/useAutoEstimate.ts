import { useEffect, useRef } from 'react';
import { useAIProvider } from './useAIProvider';
import { db } from '../db/database';
import { getCalibrationHint } from '../utils/estimateCalibration';

/**
 * On app load, silently auto-assigns AI time estimates to root tasks
 * that are missing both timeEstimate and timeEstimateOverride.
 * Fire-and-forget: never throws, never blocks UI.
 */
export function useAutoEstimate(): void {
  const { isConfigured, getProvider } = useAIProvider();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isConfigured || hasRun.current) return;
    hasRun.current = true;

    void (async () => {
      try {
        const provider = await getProvider();
        if (!provider) return;

        // Find root tasks missing estimates
        const allRootTasks = await db.tasks.where('depth').equals(0).toArray();
        const unestimated = allRootTasks.filter(
          (t) => (t.timeEstimate == null || t.timeEstimate === undefined) &&
                 (t.timeEstimateOverride == null || t.timeEstimateOverride === undefined)
        );

        if (unestimated.length === 0) return;

        // Limit batch to 10 to avoid API spam
        const batch = unestimated.slice(0, 10);
        let estimated = 0;

        for (const task of batch) {
          try {
            const calibrationHint = getCalibrationHint(task.categoryId);
            const result = await provider.estimateTime(
              task.title,
              task.description || '',
              calibrationHint
            );

            if (result !== null && result > 0 && task.id) {
              await db.tasks.update(task.id, {
                timeEstimate: result,
                updatedAt: new Date(),
              });
              estimated++;
            }

            // Gentle delay between API calls
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (err) {
            // Skip individual failures silently
            console.warn('[useAutoEstimate] failed for task:', task.title, err);
          }
        }

        console.log(`[useAutoEstimate] estimated ${estimated} tasks`);
      } catch (err) {
        console.warn('[useAutoEstimate] batch failed:', err);
      }
    })();
  }, [isConfigured, getProvider]);
}
