---
phase: 03-adhd-optimized-ux
plan: 04
subsystem: overdue-nudge, someday-list, view-toggle
tags: [adhd-ux, overdue-banner, quick-picker, someday, view-toggle, keyboard-shortcuts]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [OverdueBanner, OverdueQuickPicker, SomedayView, someday-view-toggle]
  affects:
    - src/components/calendar/OverdueBanner.tsx
    - src/components/overdue/OverdueQuickPicker.tsx
    - src/components/overdue/SomedayView.tsx
    - src/components/ui/ViewToggle.tsx
    - src/components/ui/SettingsModal.tsx
    - src/App.tsx
tech_stack:
  added: []
  patterns: [daily-localStorage-dismissal, modal-overlay-pattern, click-to-confirm-delete, bulk-async-update]
key_files:
  created:
    - src/components/calendar/OverdueBanner.tsx
    - src/components/overdue/OverdueQuickPicker.tsx
    - src/components/overdue/SomedayView.tsx
  modified:
    - src/components/ui/ViewToggle.tsx
    - src/components/ui/SettingsModal.tsx
    - src/App.tsx
decisions:
  - "OverdueTaskRow internal component does not need onClose prop — per-task actions (reschedule/someday/done) remove the task reactively via Dexie live query; picker auto-closes only when tasks.length hits 0"
  - "SomedayView placed outside DndProvider — no drag-and-drop needed for Someday list"
  - "s keyboard shortcut added for Someday view; isQuickPickerOpen added to keyboard shortcut guard"
metrics:
  duration: ~2 min
  completed: 2026-02-23
  tasks: 2
  files: 6
---

# Phase 03 Plan 04: Overdue Nudge System and Someday List Summary

**One-liner:** Warm amber overdue banner with daily dismissal opens a quick-picker modal with per-task reschedule/archive/done and bulk actions, plus a Someday view accessible via a third ViewToggle button and `s` keyboard shortcut.

## What Was Built

### Task 1: Create OverdueBanner, OverdueQuickPicker, and SomedayView components

`OverdueBanner` (`src/components/calendar/OverdueBanner.tsx`):
- Props: `{ taskCount: number; onOpenPicker: () => void }`
- Warm amber banner (`bg-amber-50 border-amber-200`) shown when overdue tasks exist
- Daily dismissal via localStorage key `taskbreaker-overdue-dismissed` storing today's date string
- `useMemo` captures today for session stability (no midnight flicker)
- Warm, casual copy: "You've got N tasks from earlier this week — want to move them?" with singular variant for 1 task
- "Review" underlined link button and X dismiss button on the right

`OverdueQuickPicker` (`src/components/overdue/OverdueQuickPicker.tsx`):
- Props: `{ isOpen: boolean; onClose: () => void; tasks: Task[] }`
- Fixed overlay modal matching project's div-based modal pattern (`fixed inset-0 bg-black/30`)
- `OverdueTaskRow` sub-component (no prop for `onClose` — not needed since actions are reactive)
- Per-task actions: Calendar icon (reschedule with inline DatePicker), Archive icon (isSomeday), CheckCircle2 icon (done)
- All actions via `db.tasks.update` — Dexie live query reactively removes resolved tasks
- Bulk actions footer: "Move all to today" (blue-600) and "Send all to Someday" (border slate-300)
- Auto-close after 1 second when `tasks.length === 0` via `useEffect`

`SomedayView` (`src/components/overdue/SomedayView.tsx`):
- Props: `{ categoryMap: Map<number, Category> | undefined }`
- Uses `useSomedayTasks()` hook (from Phase 03-01) for reactive Someday list
- `SomedayTaskRow` sub-component with category icon, title, CalendarDays rescue button (inline DatePicker), Trash2 delete with click-to-confirm (3s timeout, red background on first click)
- Rescue sets `isSomeday: false` and updates `date` to selected date
- Empty state with Archive icon: "Nothing here yet. Tasks you send to Someday will appear here."

### Task 2: Integrate into App and update ViewToggle

`ViewToggle.tsx`: Added third Someday button with `Archive` icon following the same pattern as Calendar/List buttons. Label uses `hidden sm:inline` for responsive display.

`App.tsx` changes:
- Imported `OverdueBanner`, `OverdueQuickPicker`, `SomedayView`, `useOverdueTasks`
- Added `isQuickPickerOpen` state and `overdueTasks` from `useOverdueTasks()`
- `isQuickPickerOpen` added to keyboard shortcut guard condition
- `s` keyboard shortcut added to switch to Someday view
- `OverdueBanner` rendered between MonthNavigation and EmptyState (calendar view only, when overdueTasks.length > 0)
- `SomedayView` rendered outside `DndProvider` (no drag-and-drop needed)
- `DndProvider` wraps only calendar/list branches
- `OverdueQuickPicker` modal rendered at bottom alongside other modals

`SettingsModal.tsx`: Added `s → Someday view` entry to the SHORTCUTS array.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `ed329eb` | feat(03-04): create OverdueBanner, OverdueQuickPicker, and SomedayView components |
| 2 | `dc86c51` | feat(03-04): integrate overdue nudge system and Someday view into App |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `onClose` prop from `OverdueTaskRow`**
- **Found during:** Task 2 build verification (npm run build)
- **Issue:** `OverdueTaskRow` received `onClose: () => void` prop but never used it — tsc `--noEmit` missed it due to project tsconfig settings, but full build caught it as TS6133
- **Fix:** Removed `onClose` from `OverdueTaskRow` interface and call sites; parent `OverdueQuickPicker` auto-closes when tasks.length hits 0, which is sufficient
- **Files modified:** `src/components/overdue/OverdueQuickPicker.tsx`
- **Commit:** included in `dc86c51`

## Verification

- `npx tsc --noEmit`: PASSED (0 errors)
- `npm run build`: PASSED (4.66s, chunk size warning pre-existing)
- OverdueBanner created with warm amber tone and daily localStorage dismissal
- OverdueQuickPicker modal with per-task reschedule/archive/done and bulk actions
- SomedayView with rescue date picker and click-to-confirm delete
- ViewToggle updated with three modes: Calendar / List / Someday
- `s` keyboard shortcut added and documented in SettingsModal
- isQuickPickerOpen added to keyboard shortcut guard

## Self-Check: PASSED

Files confirmed:
- `src/components/calendar/OverdueBanner.tsx` — contains `DISMISS_KEY`, `useMemo`, warm amber banner
- `src/components/overdue/OverdueQuickPicker.tsx` — contains `OverdueTaskRow`, bulk actions, auto-close
- `src/components/overdue/SomedayView.tsx` — contains `useSomedayTasks`, `SomedayTaskRow`, rescue/delete
- `src/components/ui/ViewToggle.tsx` — contains `Archive` import and Someday button
- `src/App.tsx` — contains `useOverdueTasks`, `OverdueBanner`, `SomedayView`, `isQuickPickerOpen`, `case 's'`
- `src/components/ui/SettingsModal.tsx` — contains `{ key: 's', description: 'Someday view' }`

Commits confirmed: `ed329eb`, `dc86c51`
