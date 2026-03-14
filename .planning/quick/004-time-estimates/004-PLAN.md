---
phase: quick-004
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/estimateCalibration.ts
  - src/components/calendar/DayCell.tsx
  - src/components/list/DayGroup.tsx
  - src/components/list/TaskListItem.tsx
  - src/components/task/TaskCard.tsx
  - src/hooks/useAutoEstimate.ts
  - src/App.tsx
autonomous: true
requirements: [TIME-01, TIME-02, TIME-03, TIME-04, TIME-05]

must_haves:
  truths:
    - "Each day cell in calendar view shows total estimated time at top right"
    - "Each day group header in list view shows total estimated time in parentheses after date"
    - "Task cards in calendar view show time estimate instead of status text"
    - "TaskListItem in list/mobile view shows time estimate instead of status badge"
    - "Tasks without time estimates get AI-assigned estimates on app load"
    - "Time format is always Xh Ym style (30m, 1h, 1h 30m)"
  artifacts:
    - path: "src/utils/estimateCalibration.ts"
      provides: "formatEstimate with correct Xh Ym format"
      contains: "formatEstimate"
    - path: "src/hooks/useAutoEstimate.ts"
      provides: "Background auto-estimation on app load"
      exports: ["useAutoEstimate"]
    - path: "src/components/calendar/DayCell.tsx"
      provides: "Daily time total in top right corner"
    - path: "src/components/list/DayGroup.tsx"
      provides: "Daily time total in header parentheses"
  key_links:
    - from: "src/hooks/useAutoEstimate.ts"
      to: "src/hooks/useTimeEstimate.ts"
      via: "triggerEstimate for each unestimated task"
      pattern: "triggerEstimate"
    - from: "src/App.tsx"
      to: "src/hooks/useAutoEstimate.ts"
      via: "useAutoEstimate() call in AuthenticatedApp"
      pattern: "useAutoEstimate"
---

<objective>
Add time estimate totals to calendar and list day headers, replace status text with time estimates on task cards, fix formatEstimate to use "Xh Ym" style, and auto-assign AI time estimates to tasks missing them on app load.

Purpose: Make time estimates the primary information displayed on task cards (since status is already color-coded) and provide daily time totals for planning.
Output: Updated UI components and new auto-estimate hook.
</objective>

<execution_context>
@C:/Users/JenLab-User/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/JenLab-User/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/utils/estimateCalibration.ts
@src/components/calendar/DayCell.tsx
@src/components/list/DayGroup.tsx
@src/components/list/TaskListItem.tsx
@src/components/task/TaskCard.tsx
@src/hooks/useTimeEstimate.ts
@src/hooks/useAIProvider.ts
@src/App.tsx
@src/types/index.ts
@src/db/hooks.ts

<interfaces>
From src/types/index.ts:
```typescript
export type TaskStatus = 'todo' | 'in-progress' | 'done';
interface Task {
  // ...
  timeEstimate?: number | null;    // AI-generated estimate in minutes
  timeEstimateOverride?: number | null; // user-set override in minutes
  categoryId: number;
}
```

From src/utils/estimateCalibration.ts:
```typescript
export function formatEstimate(minutes: number): string;
export function getCalibrationHint(categoryId: number): string;
```

From src/hooks/useTimeEstimate.ts:
```typescript
export function useTimeEstimate(): {
  triggerEstimate: (taskId: number, title: string, description: string, categoryId: number) => void;
};
```

From src/hooks/useAIProvider.ts:
```typescript
export function useAIProvider(): {
  isConfigured: boolean;
  getProvider: () => Promise<AIProvider | null>;
  // ...
};
```

From src/db/hooks.ts:
```typescript
export function useTasksByDate(date: string, showCompleted: boolean, energyFilter?: EnergyLevel | null): Task[] | undefined;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix formatEstimate and add daily total helper</name>
  <files>src/utils/estimateCalibration.ts</files>
  <action>
1. Rewrite `formatEstimate(minutes: number): string` to use "Xh Ym" format:
   - Under 60 minutes: "30m" (no hours)
   - Exact hours: "1h", "2h" (no minutes)
   - Mixed: "1h 30m", "2h 15m"
   - Zero or falsy: return empty string

2. Add a new helper `formatDailyTotal(tasks: Task[]): string` that:
   - Iterates over tasks, for each uses `task.timeEstimateOverride ?? task.timeEstimate`
   - Sums all non-null effective estimates in minutes
   - If sum is 0 (no tasks have estimates), returns empty string
   - Otherwise returns formatted string via `formatEstimate(sum)`
   - Import Task type from `../../types` (adjust relative path as needed)

Keep all existing exports (recordCalibration, getCalibrationHint) unchanged.
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>formatEstimate returns "1h 30m" for 90, "30m" for 30, "2h" for 120. formatDailyTotal sums task estimates.</done>
</task>

<task type="auto">
  <name>Task 2: Show daily totals in DayCell and DayGroup, replace status text with time estimates</name>
  <files>src/components/calendar/DayCell.tsx, src/components/list/DayGroup.tsx, src/components/list/TaskListItem.tsx, src/components/task/TaskCard.tsx</files>
  <action>
**DayCell.tsx (calendar view daily total):**
- Import `formatDailyTotal` from `../../utils/estimateCalibration`
- After the date number div (the `w-6 h-6 ... rounded-full` element), compute: `const dailyTotal = formatDailyTotal(tasks ?? []);`
- Modify the header area: wrap the date number and a daily total span in a flex row. The date number stays centered, and the daily total shows at the top-right of the cell. Use absolute positioning: add `relative` to the cell's inner div, then place daily total as `absolute top-0 right-0 text-[9px] text-slate-400 font-medium`. Only render if dailyTotal is non-empty.

**DayGroup.tsx (list view daily total):**
- Import `formatDailyTotal` from `../../utils/estimateCalibration`
- Compute `const dailyTotal = formatDailyTotal(tasks);`
- In the sticky header h3, append the total after the dateLabel: `{dateLabel}{dailyTotal && <span className="text-slate-400 font-normal ml-1">({dailyTotal})</span>}`

**TaskCard.tsx (calendar view task cards):**
- The card already shows `~{formatEstimate(effectiveEstimate)}` at the end. Remove the `~` prefix. Keep the same position and styling. This is already essentially "replacing status text" since TaskCard has no status text -- the tilde removal makes it cleaner. If no estimate, show nothing (current behavior is correct).

**TaskListItem.tsx (list/mobile view task items):**
- Import `formatEstimate` from `../../utils/estimateCalibration`
- Compute `const effectiveEstimate = task.timeEstimateOverride ?? task.timeEstimate;`
- Replace the status badge at the bottom of the component (the `<span>` that shows `{statusLabel}` with pill styling, lines ~215-225) with a time estimate display:
  - If effectiveEstimate exists and is > 0: show `formatEstimate(effectiveEstimate)` in the same pill styling (keep the status colors for the pill background/border so status is still visible via color)
  - If no estimate: show a dash "-" in the pill, or show nothing (remove the pill entirely)
- Remove the `statusLabel` variable since it's no longer displayed (but keep it if used in the status circle button's title attribute -- check line 178 which uses it for accessibility)
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Calendar day cells show "2h 15m" at top-right. List day headers show "(2h 15m)" after date. Task cards show time estimate where status text was. TaskListItem badge shows time instead of "To do"/"In progress"/"Done".</done>
</task>

<task type="auto">
  <name>Task 3: Auto-assign AI time estimates on app load</name>
  <files>src/hooks/useAutoEstimate.ts, src/App.tsx</files>
  <action>
**Create src/hooks/useAutoEstimate.ts:**
- Import `useEffect, useRef` from react, `useAIProvider` from `./useAIProvider`, `db` from `../db/database`, `getCalibrationHint` from `../utils/estimateCalibration`
- Export `function useAutoEstimate(): void`
- On mount (useEffect with empty deps), if AI provider `isConfigured`:
  1. Query Dexie for all root tasks (depth === 0) where `timeEstimate` is null or undefined AND `timeEstimateOverride` is null or undefined. Use `db.tasks.where('depth').equals(0).toArray()` then filter in JS for missing estimates.
  2. Use a ref to track if already running (prevent double-fire in StrictMode)
  3. For each unestimated task (limit to batch of 10 max to avoid API spam), call the AI provider's `estimateTime(title, description, calibrationHint)` sequentially (not in parallel to avoid rate limits).
  4. For each result, if valid (> 0), update DB: `db.tasks.update(taskId, { timeEstimate: result, updatedAt: new Date() })`
  5. All wrapped in try/catch -- fire-and-forget, never throw. Console.log a summary like "[useAutoEstimate] estimated N tasks"
  6. Use `getProvider()` from useAIProvider (async) to get the provider instance. If null, bail early.
  7. Add a 200ms delay between each estimation call to be gentle on APIs.

**App.tsx:**
- Import `useAutoEstimate` from `./hooks/useAutoEstimate`
- Call `useAutoEstimate()` inside `AuthenticatedApp` component (after existing hooks, before any JSX). This fires once on load and silently estimates tasks in the background.
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>On app load with AI configured, tasks missing time estimates get AI-assigned estimates silently. Console shows "[useAutoEstimate] estimated N tasks" summary. No UI interruption.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Visual: Calendar view day cells show time totals at top-right corner
4. Visual: List view day headers show "(Xh Ym)" after date text
5. Visual: Task cards show "30m" or "1h 15m" instead of "To do"/"In progress" text
6. Console: On load with AI configured, auto-estimate logs appear
</verification>

<success_criteria>
- formatEstimate produces "30m", "1h", "1h 30m" (never "1.5h")
- Day cells and day group headers show summed daily totals
- Status text replaced with time estimates on all task display components
- Auto-estimate runs silently on load for tasks missing estimates
- Build passes, no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/004-time-estimates/004-SUMMARY.md`
</output>
