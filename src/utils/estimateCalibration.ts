const CALIBRATION_KEY = 'taskbreaker-estimate-calibration';
const MAX_ENTRIES = 50;

interface CalibrationEntry {
  categoryId: number;
  aiEstimate: number;
  userOverride: number;
}

function loadEntries(): CalibrationEntry[] {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CalibrationEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: CalibrationEntry[]): void {
  try {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Records a calibration entry when the user overrides an AI estimate.
 * Keeps only the last MAX_ENTRIES entries to avoid unbounded growth.
 */
export function recordCalibration(
  categoryId: number,
  aiEstimate: number,
  userOverride: number,
): void {
  const entries = loadEntries();
  entries.push({ categoryId, aiEstimate, userOverride });
  // Keep only the most recent MAX_ENTRIES
  const trimmed = entries.slice(-MAX_ENTRIES);
  saveEntries(trimmed);
}

/**
 * Returns a calibration hint string for the given category based on past corrections.
 * If no calibration data exists for this category, returns an empty string.
 */
export function getCalibrationHint(categoryId: number): string {
  const entries = loadEntries();
  const relevant = entries.filter((e) => e.categoryId === categoryId && e.aiEstimate > 0);
  if (relevant.length === 0) return '';

  const avgUser = relevant.reduce((sum, e) => sum + e.userOverride, 0) / relevant.length;
  const avgAI = relevant.reduce((sum, e) => sum + e.aiEstimate, 0) / relevant.length;

  const userRounded = Math.round(avgUser);
  const aiRounded = Math.round(avgAI);

  return `Your past tasks in this category averaged ~${userRounded} minutes (AI estimated ~${aiRounded} min). Adjust accordingly.`;
}

/**
 * Formats a minute value into a human-readable string.
 * e.g. 15 -> "15m", 90 -> "1.5h", 120 -> "2h"
 */
export function formatEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h`;
}
