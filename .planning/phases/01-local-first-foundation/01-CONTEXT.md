# Phase 1: Local-First Foundation - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Core task management with calendar-based daily view. User can capture, organize, and complete tasks. Covers TASK-01 through TASK-06 and PLAT-03. AI breakdown, ADHD polish, and mobile parity are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Platform & stack
- Web-first (Phase 4 adds mobile parity)
- React frontend framework
- Local data storage approach at Claude's discretion

### Two-view architecture
- **Calendar view:** Monthly grid, continuous month-to-month, with weekly view toggle
- **List view:** Infinite scroll day-by-day (like Google Calendar's Schedule view), with a "Today" button to jump to current day

### Quick capture
- Calendar view: Click a day -> popup modal with title, status, category, description (Google Calendar-style)
- List view: Click a day -> inline input for task creation

### Task editing
- Calendar view: Click existing task -> popup modal (same as creation, pre-filled with task details)
- List view: Click existing task -> inline expand to edit in place

### Categories
- Presets + custom: ship with sensible defaults (e.g., Work, Personal), user can add/edit their own
- Category represented by an icon on task cards

### Task status
- Three states: To-do -> In progress -> Done
- Status indicated by task box color in both views
- Status colors at Claude's discretion (accessible and ADHD-friendly)

### Task card (calendar view)
- Shows: category icon + task title
- Box color encodes status (to-do / in-progress / done)
- Day boxes expand vertically to fit all tasks (no overflow truncation or "+N more")

### Task card (list view)
- Claude's discretion on detail level and layout

### Drag-to-reschedule
- Works in both calendar view and list view
- Drag a task between days to move it

### Completed tasks
- Completed tasks disappear from view by default
- Global toggle to show/hide completed tasks across all days

### Empty state
- Clean calendar/list view with a subtle hint: "Click a day to add your first task"
- No onboarding walkthrough

### Claude's Discretion
- Local storage implementation (IndexedDB, localStorage, etc.)
- Status color palette
- List view task card detail level
- Calendar grid spacing and typography
- Loading states and error handling
- Exact category preset list and icons

</decisions>

<specifics>
## Specific Ideas

- "Like Google Calendar" — popup modal for task creation, schedule-style list view, monthly grid layout
- Calendar day boxes should expand to fit content, not truncate
- Three-state status (to-do/in-progress/done) encoded as box color — quick visual scanning
- Category icons on task cards for at-a-glance identification
- Different interaction patterns per view: modals in calendar (space-constrained), inline in list (room to expand)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-local-first-foundation*
*Context gathered: 2026-02-22*
