# Phase 2: AI Task Breakdown - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-powered subtask generation for any task. User can break down tasks into actionable subtasks, review/edit/reorder them before accepting, regenerate selectively, and recursively break down up to 3 levels deep. Supports swappable AI providers (Gemini, Claude). Energy tracking, celebrations, and time estimates belong in Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Breakdown trigger & flow
- "Break it down" button lives inside the task detail modal (not on task rows)
- Subtasks stream in one-by-one as the AI generates them (progressive, feels fast)
- Generated subtasks become full independent tasks with a `parentId` field linking to the parent
- Subtasks land on the same calendar day as the parent task
- Subtasks appear in the calendar/list like any other task — no visual distinction from regular tasks

### Subtask presentation
- Subtasks look identical to regular tasks but have a parent link/badge
- Opening a parent task's modal shows a nested list of its subtasks with status checkboxes
- Nested indentation used to show depth for recursive breakdown (task → subtask → sub-subtask)
- When all subtasks are completed, parent shows a prompt: "All subtasks done — mark parent complete?"

### Editing & regeneration
- Review step before creating: AI shows proposed subtasks in a preview, user edits/removes before they become real tasks
- Review actions available per subtask: edit title inline, remove individual subtask (X button), drag-to-reorder, "Accept all" button
- Keep/pin toggle per subtask — regeneration only replaces unpinned subtasks, preserving the ones user has kept
- Recursive breakdown uses the same full review flow at every depth level (no simplified flow for deeper levels)

### AI provider config
- First-use prompt when user first taps "Break it down" — configure provider before proceeding
- Settings page for changing provider/key later
- Supported providers at launch: Google Gemini and Anthropic Claude (OpenAI deferred)
- API keys stored in local encrypted storage (OS keychain or equivalent)

### Claude's Discretion
- Prompt engineering for subtask generation quality
- Exact streaming implementation details
- Free tier vs bring-your-own-key default (pick what's practical for local-first)
- Number of subtasks generated per breakdown (requirement says 3-5)
- Parent link badge design and placement
- Exact "all subtasks done" prompt UI

</decisions>

<specifics>
## Specific Ideas

- Subtasks are first-class tasks, not second-class citizens — they appear in the calendar like anything else
- The review step is important: user should feel in control, not overwhelmed by AI dumping tasks on their calendar
- Selective regeneration (pin what you like, regenerate the rest) avoids the frustration of losing good suggestions

</specifics>

<deferred>
## Deferred Ideas

- OpenAI/GPT provider support — add in a future update when Gemini + Claude are solid
- AI-suggested time estimates for tasks — Phase 3 (ADHD-02)
- "Start here" highlighting for first subtask — Phase 3 (ADHD-05)

</deferred>

---

*Phase: 02-ai-task-breakdown*
*Context gathered: 2026-02-22*
