---
phase: 03-adhd-optimized-ux
plan: 02
subsystem: energy-level-ui, energy-filter
tags: [energy-level, adhd-ux, task-tagging, filter, lucide-icons]
dependency_graph:
  requires: [03-01]
  provides: [energy-chip-selector, energy-badge-display, energy-filter-header]
  affects:
    - src/components/task/TaskForm.tsx
    - src/components/task/TaskCard.tsx
    - src/components/list/TaskListItem.tsx
    - src/App.tsx
    - src/db/hooks.ts
    - src/components/calendar/CalendarGrid.tsx
    - src/components/calendar/WeekView.tsx
    - src/components/calendar/DayCell.tsx
    - src/components/list/ListView.tsx
    - src/components/task/TaskModal.tsx
    - src/components/task/TaskInlineEdit.tsx
tech_stack:
  added: []
  patterns: [energy-chip-toggle, prop-threading, filter-predicate]
key_files:
  created: []
  modified:
    - src/components/task/TaskForm.tsx
    - src/components/task/TaskCard.tsx
    - src/components/list/TaskListItem.tsx
    - src/App.tsx
    - src/db/hooks.ts
    - src/components/calendar/CalendarGrid.tsx
    - src/components/calendar/WeekView.tsx
    - src/components/calendar/DayCell.tsx
    - src/components/list/ListView.tsx
    - src/components/task/TaskModal.tsx
    - src/components/task/TaskInlineEdit.tsx
decisions:
  - "ENERGY_DISPLAY record defined locally in TaskCard and TaskListItem — avoids cross-component import coupling"
  - "energyFilter optional param with default undefined — existing callers (DayCell, ListView) pass nothing when no filter"
  - "TaskModal/TaskInlineEdit handleSubmit signatures updated to accept energyLevel — data spread includes it automatically"
metrics:
  duration: ~3 min
  completed: 2026-02-23
  tasks: 2
  files: 11
---

# Phase 03 Plan 02: Energy Level Tagging and Filtering Summary

**One-liner:** Three-chip energy selector in TaskForm (Low/Med/High with Battery/BatteryMedium/Zap icons) plus compact energy badges on TaskCard and TaskListItem, plus global filter chips in the App header that filter both calendar and list views via updated query hooks.

## What Was Built

### Task 1: Add energy level selector to TaskForm and display on TaskCard and TaskListItem

`TaskForm.tsx` gained a 3-chip horizontal toggle selector below the Status row:
- `Low` (Battery icon, sky-600/sky-50/sky-300 when selected)
- `Medium` (BatteryMedium icon, amber-600/amber-50/amber-300 when selected)
- `High` (Zap icon, emerald-600/emerald-50/emerald-300 when selected)
- Unselected state: slate-500/white/slate-300 with hover:slate-400
- Click to select; click again to deselect (sets null)
- `energyLevel` included in the `onSubmit` data object

`TaskModal.tsx` and `TaskInlineEdit.tsx` `handleSubmit` signatures updated to accept `energyLevel: EnergyLevel | null` — the spread `...data` propagates it to the DB update/add call automatically.

`TaskCard.tsx` shows a compact energy badge (`text-[10px]`, icon + label) when `task.energyLevel` is set. Badge uses sky/amber/emerald colors per level and is positioned after the title and before the ParentBadge.

`TaskListItem.tsx` shows a slightly larger energy badge (`text-xs`) in the same position, between the task title and ParentBadge. Both components define `ENERGY_DISPLAY` locally to avoid cross-file coupling.

### Task 2: Add energy filter to App header and thread through views

`App.tsx` gained `energyFilter` state (`EnergyLevel | null`, default `null`) and three compact filter chips in the header (between ViewToggle and the showCompleted button), separated by a subtle `border-l border-slate-200 pl-3 ml-1` divider:
- Chips are `px-1.5 py-0.5 text-xs` (smaller than the form chips)
- Active chip uses the energy's color scheme; inactive is slate-400
- Click toggles filter on/off (click active chip again to clear)

`energyFilter` is threaded as an optional prop through:
- `CalendarGrid` → `DayCell` → `useTasksByDate`
- `WeekView` → `DayCell` → `useTasksByDate`
- `ListView` → `useTasksByDateRange`

`useTasksByDate` and `useTasksByDateRange` in `hooks.ts` both accept optional `energyFilter?: EnergyLevel | null`. The predicate `(!energyFilter || t.energyLevel === energyFilter)` is ANDed into both branches (showCompleted and not). `energyFilter` added to deps array for reactivity. When null, no filtering occurs; when set, only tasks with matching `energyLevel` appear.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `7c8eec4` | feat(03-02): add energy level selector to TaskForm and energy badge to TaskCard and TaskListItem |
| 2 | `ef4b384` | feat(03-02): add energy filter to App header and thread through calendar and list views |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit`: PASSED (0 errors)
- `npm run build`: PASSED (3.97s, chunk size warning pre-existing)
- All must-have artifacts confirmed present

## Self-Check: PASSED

Files confirmed present:
- `src/components/task/TaskForm.tsx` — contains `EnergyLevel`, `energyLevel` state, 3-chip selector
- `src/App.tsx` — contains `energyFilter` state, 3 filter chips in header
- `src/db/hooks.ts` — contains `energyLevel` filter predicate in useTasksByDate and useTasksByDateRange

Commits confirmed: `7c8eec4`, `ef4b384`
