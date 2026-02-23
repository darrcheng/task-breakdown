# Requirements: TaskBreaker

**Defined:** 2026-02-05
**Core Value:** Turn vague, paralyzing tasks into small, concrete steps you can start right now.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Task Management

- [x] **TASK-01**: User can create a task via single-input quick capture
- [x] **TASK-02**: User can view tasks in a daily calendar view
- [x] **TASK-03**: User can drag tasks between calendar days to reschedule
- [x] **TASK-04**: User can edit task title and details inline
- [x] **TASK-05**: User can delete a task
- [x] **TASK-06**: User can mark a task as done (clears from calendar view)
- [x] **TASK-07**: Task completion shows satisfying visual/audio feedback
- [ ] **TASK-08**: Uncompleted tasks can be easily rescheduled with no guilt language

### AI Task Breakdown

- [ ] **AI-01**: User can tap a button to generate subtasks for any task
- [ ] **AI-02**: User can edit AI-generated subtasks
- [ ] **AI-03**: User can reorder AI-generated subtasks
- [x] **AI-04**: User can delete individual AI-generated subtasks
- [ ] **AI-05**: User can regenerate all subtasks for a task
- [x] **AI-06**: User can recursively break down subtasks (up to 3 levels deep)
- [x] **AI-07**: AI provider is swappable (start with free tier, support Claude/OpenAI/Gemini)

### ADHD-Friendly Polish

- [x] **ADHD-01**: User can tag tasks by energy level (low/medium/high)
- [ ] **ADHD-02**: User can see AI-suggested time estimates for tasks
- [x] **ADHD-03**: Completing tasks shows positive celebration animation
- [ ] **ADHD-04**: Overdue tasks show gentle reschedule prompts (not guilt)
- [x] **ADHD-05**: First subtask is visually highlighted as "start here"

### Cross-Platform

- [ ] **PLAT-01**: App works on web browsers
- [ ] **PLAT-02**: App works on mobile (iOS and Android)
- [x] **PLAT-03**: Data persists across sessions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Engagement

- **ENG-01**: Gamification / rewards system (XP, achievements)
- **ENG-02**: Focus timer / body doubling (Pomodoro-style)
- **ENG-03**: Routine templates (morning/evening checklists)

### Integration

- **INT-01**: External calendar sync (Google Calendar, Outlook)
- **INT-02**: Multi-device sync (real-time data across devices)

### Social

- **SOC-01**: Share task lists with friends
- **SOC-02**: Collaborative task breakdown

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Team/collaboration features | Personal tool first — defer to v2+ |
| Notifications/reminders | Adds complexity, ADHD users find intrusive notifications harmful |
| Recurring tasks | Adds complexity, not core to breakdown value |
| Time tracking | Not core value, risks productivity-shame spiral for ADHD users |
| Productivity analytics | Comparing to "ideal" productivity worsens ADHD shame |
| Social comparison | ADHD users comparing to others worsens inadequacy |
| Rigid deadline enforcement | Creates anxiety for ADHD users |
| Mandatory categorization | Forces organizing before acting, blocks quick capture |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TASK-01 | Phase 1 | Complete |
| TASK-02 | Phase 1 | Complete |
| TASK-03 | Phase 1 | Complete |
| TASK-04 | Phase 1 | Complete |
| TASK-05 | Phase 1 | Complete |
| TASK-06 | Phase 1 | Complete |
| PLAT-03 | Phase 1 | Complete |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| AI-04 | Phase 2 | Complete |
| AI-05 | Phase 2 | Pending |
| AI-06 | Phase 2 | Complete |
| AI-07 | Phase 2 | Complete |
| TASK-07 | Phase 3 | Complete |
| TASK-08 | Phase 3 | Pending |
| ADHD-01 | Phase 3 | Complete |
| ADHD-02 | Phase 3 | Pending |
| ADHD-03 | Phase 3 | Complete |
| ADHD-04 | Phase 3 | Pending |
| ADHD-05 | Phase 3 | Complete |
| PLAT-01 | Phase 4 | Pending |
| PLAT-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-05 after roadmap creation*
