---
phase: 03-adhd-optimized-ux
plan: 01
subsystem: data-model, animations, subtask-ui
tags: [dexie-migration, energy-level, someday, celebration-animation, start-here-ring, adhd-ux]
dependency_graph:
  requires: []
  provides: [EnergyLevel-type, isSomeday-field, Dexie-v3-schema, useOverdueTasks, useSomedayTasks, celebration-glow, start-here-ring]
  affects: [src/types/index.ts, src/db/database.ts, src/db/hooks.ts, src/components/list/TaskListItem.tsx, src/components/task/SubtaskList.tsx]
tech_stack:
  added: []
  patterns: [Dexie-upgrade-migration, useLiveQuery-reactive-ring, CSS-ring-offset]
key_files:
  created: []
  modified:
    - src/types/index.ts
    - src/db/database.ts
    - src/db/hooks.ts
    - src/components/list/TaskListItem.tsx
    - src/components/task/SubtaskList.tsx
decisions:
  - "Dexie v3 upgrade sets all new fields to null/false defaults — no data loss"
  - "isSomeday filter applied to both branches (showCompleted and not) of useTasksByDate/Range"
  - "Start-here ring uses violet-400 to visually distinguish from emerald celebration ring"
  - "isStartHere ring hidden during departure animation — ring stays on departing item during celebration"
metrics:
  duration: ~8 min
  completed: 2026-02-23
  tasks: 3
  files: 5
---

# Phase 03 Plan 01: Data Model Extension and Visual Celebrations Summary

**One-liner:** Dexie v3 migration adds EnergyLevel/isSomeday/timeEstimate fields with an emerald glow celebration and violet start-here ring for ADHD-optimized task focus.

## What Was Built

### Task 1: Extend Task type and Dexie v3 schema migration

Added `EnergyLevel` type (`'low' | 'medium' | 'high'`) and four new optional fields to the `Task` interface:
- `energyLevel?: EnergyLevel | null` — energy tag for Phase 3 filtering
- `timeEstimate?: number | null` — AI-generated minutes estimate
- `timeEstimateOverride?: number | null` — user override in minutes
- `isSomeday?: boolean` — archive to Someday list, hidden from calendar

Updated `ViewMode` to `'calendar' | 'list' | 'someday'`.

Added Dexie v3 migration that indexes `energyLevel` and sets safe defaults (`null`/`false`) on all existing tasks via `.upgrade()`.

Added two new hooks:
- `useOverdueTasks()` — past-due incomplete root tasks, excludes Someday
- `useSomedayTasks()` — Someday list (root tasks with `isSomeday === true`)

Updated `useTasksByDate` and `useTasksByDateRange` to filter `isSomeday` tasks from calendar and list views (both showCompleted branches).

### Task 2: Enhance celebration animation on TaskListItem and SubtaskRow

`TaskListItem` departure classes now include `ring-2 ring-emerald-400 ring-offset-1` alongside the existing strikethrough + fade. The emerald ring appears immediately when departure starts, creating a satisfying "glow then fade" completion moment over 1500ms.

`SubtaskRow` departure replaced `opacity-50` with `ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms]` — same glow + full fade treatment as TaskListItem. The title button's `text-green-600 line-through` was preserved as-is.

### Task 3: Add start-here ring highlight on first incomplete subtask

`SubtaskList` now computes `firstIncompleteIndex` via `subtasks.findIndex((s) => s.status !== 'done')` and passes `isStartHere={index === firstIncompleteIndex}` to each `SubtaskRow`.

`SubtaskRowProps` extended with `isStartHere?: boolean`. The outer div applies `ring-2 ring-violet-400 ring-offset-1 rounded-md` when `isStartHere && !departing`. Violet-400 visually distinguishes the focus ring from the emerald celebration ring.

Ring auto-moves reactively: `useLiveQuery` re-renders on DB changes, `findIndex` recomputes, and the ring shifts to the next incomplete subtask after the 1500ms departure resolves.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `966891f` | feat(03-01): extend Task type and Dexie v3 schema migration |
| 2 | `c05360c` | feat(03-01): enhance celebration animation with emerald ring glow |
| 3 | `20d1777` | feat(03-01): add start-here violet ring on first incomplete subtask |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit`: PASSED (0 errors)
- `npm run build`: PASSED (16.28s, chunk size warning pre-existing)
- All must-have artifacts confirmed present

## Self-Check: PASSED

Files confirmed:
- `src/types/index.ts` — contains `EnergyLevel`, `isSomeday`, `ViewMode` with `'someday'`
- `src/db/database.ts` — contains `version(3)` with `energyLevel` index
- `src/db/hooks.ts` — contains `useOverdueTasks` and `useSomedayTasks`
- `src/components/list/TaskListItem.tsx` — contains `ring-2 ring-emerald-400`
- `src/components/task/SubtaskList.tsx` — contains `isStartHere`, `ring-violet-400`, `ring-emerald-400`

Commits confirmed: `966891f`, `c05360c`, `20d1777`
