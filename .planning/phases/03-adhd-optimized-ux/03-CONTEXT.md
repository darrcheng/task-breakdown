# Phase 3: ADHD-Optimized UX - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

ADHD-specific UX layer on top of existing task management and AI breakdown features. Delivers: energy tagging with filtering, AI time estimates, completion celebrations, gentle reschedule prompts for overdue tasks, and "start here" visual highlighting for first subtasks. No new views or navigation — enhances the existing calendar/list UI.

</domain>

<decisions>
## Implementation Decisions

### Completion Celebrations
- Subtle & satisfying intensity — not over-the-top
- No sound — visual only
- Fade & strikethrough animation style: task text gets gentle strikethrough, row fades slightly
- Completed tasks stay visible until end of day, then auto-archive
- No tiered celebrations — same treatment for all task completions

### Overdue Task Nudges
- Closeable banner at the top of the calendar view when overdue tasks exist
- Warm & casual tone: "You've got 3 tasks from earlier this week — want to move them?"
- Banner shows once per day — if dismissed, won't reappear until tomorrow
- Tapping banner opens a quick picker with all overdue tasks listed
- Per-task actions in quick picker: date picker (reschedule), archive to Someday, mark done
- Bulk actions at bottom: "Move all to today" (default date = today, one tap) and "Send all to Someday"
- "Someday" list — a separate accessible list for archived tasks the user wants to remember but isn't committing to a date

### AI Time Estimates
- Automatic generation for all tasks — background process when AI is available, no manual trigger needed
- Display in both places: small badge on task card ("~15m") + detailed view inside task modal
- User can tap estimate to manually override
- Smart calibration: estimates learn from user corrections — store override history and use it to improve future estimates for similar tasks
- AI-generated estimates should also be consistent with past estimates and corrections for similar tasks

### Start-Here Highlighting
- First subtask gets an accent border or subtle glow — visual cue that draws the eye
- No text label — purely visual treatment
- Applied automatically to the first incomplete subtask in a breakdown

### Claude's Discretion
- Energy tagging UI design (chips, colors, filter placement)
- Exact animation timing and easing curves for completion celebrations
- Someday list access point (sidebar, menu, or dedicated section)
- How "similar tasks" are matched for time estimate calibration
- Accent color choice for start-here highlighting

</decisions>

<specifics>
## Specific Ideas

- Overdue quick picker should feel low-pressure — three clear actions per task, no guilt
- "Move all to today" is the ADHD fresh-start pattern — make it prominent and one-tap
- Time estimate calibration is a learning loop: user overrides → stored → influence future AI estimates
- Completed tasks staying until end of day lets the user see their daily progress — important for ADHD motivation

</specifics>

<deferred>
## Deferred Ideas

- Dedicated "today view" — potential future phase for a focused daily dashboard
- Tiered celebrations (bigger reward for completing parent tasks with all subtasks) — revisit in v2

</deferred>

---

*Phase: 03-adhd-optimized-ux*
*Context gathered: 2026-02-23*
