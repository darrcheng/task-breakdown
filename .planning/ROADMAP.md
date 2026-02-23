# Roadmap: TaskBreaker

## Overview

Build an ADHD-friendly to-do list with AI-powered task breakdown across 4 phases. Start with local-first core task management, add AI differentiation for subtask generation, polish ADHD-specific UX features, then expand to full web/mobile parity. This roadmap delivers the complete v1 vision: calendar-based daily view with recursive AI breakdown that turns vague tasks into actionable steps.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Local-First Foundation** - Core task management with calendar view (completed 2026-02-22)
- [x] **Phase 2: AI Task Breakdown** - AI-powered subtask generation with controls (completed 2026-02-23)
- [ ] **Phase 3: ADHD-Optimized UX** - Energy tracking and gentle reschedule prompts
- [ ] **Phase 4: Cross-Platform Expansion** - Full web and mobile parity

## Phase Details

### Phase 1: Local-First Foundation
**Goal**: User can capture, organize, and complete tasks in a calendar-based daily view
**Depends on**: Nothing (first phase)
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, PLAT-03
**Success Criteria** (what must be TRUE):
  1. User can create a task with single-input quick capture
  2. User can view tasks organized by day in calendar view
  3. User can drag tasks between calendar days to reschedule
  4. User can edit task details inline without friction
  5. User can delete tasks and mark tasks as done
**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, database, data model, utilities
- [x] 01-02-PLAN.md — Calendar view with monthly grid, week toggle, navigation
- [x] 01-03-PLAN.md — List view with infinite scroll day-by-day
- [x] 01-04-PLAN.md — Task CRUD (create/edit/delete/status toggle)
- [x] 01-05-PLAN.md — Drag-to-reschedule in both views
- [x] 01-06-PLAN.md — Polish, category management, end-to-end verification

### Phase 01.1: UI polish — implement 12 enhancement todos from Phase 1 UAT (INSERTED)

**Goal:** Implement all 12 UI enhancement todos from Phase 1 UAT to polish the user experience before Phase 2
**Depends on:** Phase 1
**Plans:** 11/11 plans complete

Plans:
- [x] 01.1-01-PLAN.md — Red circle today indicator, default categories deletable, status cycling safety
- [x] 01.1-02-PLAN.md — Status pill buttons, searchable category combobox
- [x] 01.1-03-PLAN.md — Larger add button, blank-space click-to-create, inline category field
- [x] 01.1-04-PLAN.md — Sticky header/navigation, full cell clickable, popover task modal
- [x] 01.1-05-PLAN.md — Keyboard shortcuts, settings modal with start-of-week preference
- [x] 01.1-06-PLAN.md — Gap closure: done task departure animation, add button centering, inline field sizing
- [x] 01.1-07-PLAN.md — Gap closure: category combobox empty default + icon, full cell click area
- [x] 01.1-08-PLAN.md — Gap closure: keyboard shortcut rebinding, date field in task form
- [x] 01.1-09-PLAN.md — Gap closure: green departure text, category clear button, SVG plus icon
- [x] 01.1-10-PLAN.md — Gap closure: keyboard preventDefault + m/w restore, custom DatePicker
- [ ] 01.1-11-PLAN.md — Gap closure: green checkbox + re-click cancellation, inline create CategoryCombobox

### Phase 2: AI Task Breakdown
**Goal**: User can break down overwhelming tasks into actionable subtasks using AI
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07
**Success Criteria** (what must be TRUE):
  1. User can tap a button to generate 3-5 subtasks for any task
  2. User can edit, reorder, and delete AI-generated subtasks
  3. User can regenerate subtasks if first attempt is not helpful
  4. User can recursively break down subtasks up to 3 levels deep
  5. AI provider can be swapped between Gemini/Claude/OpenAI without data loss
**Plans**: 7 plans

Plans:
- [x] 02-01-PLAN.md — Data model extension, provider abstraction, encrypted key storage
- [x] 02-02-PLAN.md — AI provider settings UI, first-use setup modal
- [x] 02-03-PLAN.md — Break it down button, streaming generation, review-before-accept flow
- [x] 02-04-PLAN.md — Subtask display in parent modal, parent badge, completion prompt
- [x] 02-05-PLAN.md — Selective regeneration with pin/keep, recursive breakdown, e2e verification
- [ ] 02-06-PLAN.md — Gap closure: blank subtask modal, stale status display, breadcrumb direct open
- [ ] 02-07-PLAN.md — Gap closure: provider setup loop fix

### Phase 02.1: Gemini model selector — add toggles for Flash Lite, Gemini 3 Flash, Gemma 3 12B, Gemma 3 27B (INSERTED)

**Goal:** User can select from 5 Gemini/Gemma models in Settings; selected model is used for AI subtask generation and persists across refresh
**Depends on:** Phase 2
**Plans:** 1/1 plans complete

Plans:
- [ ] 02.1-01-PLAN.md — GeminiModelId type, provider plumbing, model toggle UI in AIProviderSettings

### Phase 3: ADHD-Optimized UX
**Goal**: App supports ADHD-specific needs with energy tracking and positive feedback
**Depends on**: Phase 2
**Requirements**: TASK-07, TASK-08, ADHD-01, ADHD-02, ADHD-03, ADHD-04, ADHD-05
**Success Criteria** (what must be TRUE):
  1. User can tag tasks by energy level and filter by current capacity
  2. User sees AI-suggested time estimates for tasks and subtasks
  3. User experiences satisfying celebration when completing tasks
  4. User sees gentle reschedule prompts for overdue tasks without guilt language
  5. User can identify the first subtask to start with visual highlighting
**Plans**: 5 plans

Plans:
- [ ] 03-01-PLAN.md — Schema migration (energyLevel, timeEstimate, isSomeday), celebration animation, start-here highlighting
- [ ] 03-02-PLAN.md — Energy level tagging (chips in form, badges on cards, filter in header)
- [ ] 03-03-PLAN.md — AI time estimation (provider method, background hook, badge display, override, calibration)
- [ ] 03-04-PLAN.md — Overdue banner, quick picker with bulk actions, Someday view
- [ ] 03-05-PLAN.md — UAT: end-to-end human verification of all Phase 3 features

### Phase 4: Cross-Platform Expansion
**Goal**: App works equally well on web browsers and mobile devices
**Depends on**: Phase 3
**Requirements**: PLAT-01, PLAT-02
**Success Criteria** (what must be TRUE):
  1. User can access full app functionality on web browsers
  2. User can access full app functionality on iOS and Android mobile devices
  3. User experiences consistent UI/UX across web and mobile platforms
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local-First Foundation | 6/6 | Complete | 2026-02-22 |
| 01.1. UI Polish (gap closure) | 11/11 | Complete    | 2026-02-22 |
| 2. AI Task Breakdown | 7/7 | Complete   | 2026-02-23 |
| 02.1. Gemini Model Selector | 1/1 | Complete    | 2026-02-23 |
| 3. ADHD-Optimized UX | 4/5 | In Progress|  |
| 4. Cross-Platform Expansion | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-05*
*Last updated: 2026-02-23*
