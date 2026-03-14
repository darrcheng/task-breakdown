# Quick Task 005: Repeat Button in Edit Task Mode

**Status:** Complete
**Date:** 2026-03-14

## What was built

Added a "Repeat" button to the edit task action bar (left of Delete) that opens a sub-modal for creating independent duplicate tasks across multiple dates.

### Features

- **Repeat button** — blue button in TaskForm action bar, visible only in edit mode
- **Daily mode** — specify 1-30 consecutive days; shows condensed date range preview (e.g., "Mar 15 – Mar 17")
- **Select Dates mode** — mini calendar grid matching app's existing calendar style; click to toggle dates, shift+click to select a range
- **Bulk creation** — duplicates task title, description, category, energy level, and time estimates; resets status to "todo"
- **Independent tasks** — no parent/child linking; each duplicate is fully standalone

### Files changed

| File | Change |
|------|--------|
| `src/components/task/RepeatModal.tsx` | New component — repeat sub-modal with daily/calendar modes |
| `src/components/task/TaskForm.tsx` | Added Repeat button to action bar |
| `src/components/task/TaskModal.tsx` | Wired repeat state, bulk Dexie task creation, modal lifecycle |

### Commits

| Hash | Description |
|------|-------------|
| 856f3ef | Add RepeatModal component and Repeat button in TaskForm |
| 8cd4d43 | Wire repeat flow in TaskModal with bulk task creation |
| d345f04 | Improve repeat modal with date range preview and calendar picker |
| a842810 | Close repeat sub-modal immediately on submit |
