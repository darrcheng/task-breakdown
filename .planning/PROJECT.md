# TaskBreaker

## What This Is

A to-do list app designed for ADHD brains. The core differentiator is AI-powered task breakdown — you write a vague or overwhelming task, tap a button, and get actionable subtasks you can actually start. Available on web and mobile with a calendar-based daily view.

## Core Value

Turn vague, paralyzing tasks into small, concrete steps you can start right now. The app does the executive function work of breaking things down so you don't have to.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Calendar-based daily view showing tasks for each day
- [ ] Create, edit, and delete tasks
- [ ] Drag tasks between calendar days to reschedule
- [ ] Mark tasks as done (clears from calendar view)
- [ ] AI-powered subtask generation — tap a button, get subtasks instantly
- [ ] Edit, reorder, delete, and regenerate AI-generated subtasks
- [ ] Recursive breakdown — subtasks can be broken down further (3-4 levels)
- [ ] Swappable AI provider (start with free tier, upgrade later)
- [ ] Works on both web and mobile (equal priority)

### Out of Scope

- Team/collaboration features — personal tool first
- Notifications/reminders — keep it simple for v1
- Recurring tasks — adds complexity, defer to later
- Time tracking — not core to the breakdown value

## Context

- User currently uses a Notion calendar view with task subpages and drag-and-drop
- The pain point: big vague tasks like "Set up informational interview" sit ignored for days because the ADHD brain can't figure out where to start
- Breaking that into "Find their LinkedIn" + "Draft a short message" makes it actionable
- The app should feel lightweight and fast — friction is the enemy for ADHD users
- Building for personal use first, with intent to share with friends and potentially broader audience if helpful

## Constraints

- **AI Provider**: Must be provider-agnostic with swappable backends — start with a free option (Gemini free tier or similar), allow upgrading to Claude/OpenAI later
- **Platform**: Web and mobile with equal priority — likely a cross-platform approach (React Native, Flutter, or responsive PWA)
- **Cost**: Minimize ongoing costs for personal use

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Swappable AI provider | User wants to start free, upgrade later | — Pending |
| Calendar-day based organization | Mirrors user's existing Notion workflow that works well | — Pending |
| Personal-first, shareable later | Reduces initial complexity (no auth, teams, etc.) | — Pending |

---
*Last updated: 2026-02-05 after initialization*
