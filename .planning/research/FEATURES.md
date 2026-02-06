# Feature Landscape: ADHD-Friendly To-Do List App

**Domain:** ADHD-focused productivity / task management
**Researched:** 2026-02-05
**Confidence:** LOW (based on training data only - external research tools unavailable)

## Research Note

This research is based on training data knowledge of ADHD productivity apps (Todoist, Things 3, Goblin Tools, Finch, Structured, Llama Life) without current external verification. All findings should be validated against actual app documentation and ADHD user research.

## Table Stakes

Features users expect in ADHD-focused task management. Missing these = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Quick task capture** | ADHD brains need to offload thoughts immediately before forgetting | Low | Single input field, keyboard shortcuts, always accessible |
| **Visual task organization** | Text-heavy lists cause overwhelm; visual hierarchy helps focus | Medium | Drag-and-drop, color coding, spatial organization |
| **Today/daily view** | ADHD struggles with abstract future; concrete "today" view essential | Low | Clear separation of today vs future tasks |
| **Time awareness** | Time blindness is core ADHD symptom; need time visibility | Medium | Time blocking, duration estimates, calendar integration |
| **Task completion feedback** | ADHD needs dopamine hits; completion must feel rewarding | Low | Visual/audio feedback, progress indicators, streaks |
| **Low friction editing** | Perfectionism paralysis; editing must be effortless | Low | Inline editing, no modal dialogs, quick reschedule |
| **Clear visual hierarchy** | Overwhelm from seeing "everything"; need prioritization cues | Medium | Priority levels, visual weight differences, collapsible sections |
| **Minimal setup required** | ADHD hates onboarding; must be useful in < 2 minutes | Low | Smart defaults, optional customization, no required setup |
| **Forgiveness for incompletion** | ADHD comes with guilt/shame; app must not punish uncompleted tasks | Low | Easy reschedule, no guilt-inducing language, rollover handling |
| **Mobile + desktop parity** | Task capture happens anywhere; can't be desktop-only | High | Cross-platform sync, feature parity |

## Differentiators

Features that set ADHD-specific apps apart from general to-do lists. Not expected by all users, but highly valued by ADHD users.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI task breakdown** | Core ADHD pain: vague tasks cause paralysis. AI breaks down "where to start" | High | Your app's primary differentiator; must handle recursive breakdown |
| **Body doubling / focus timer** | ADHD benefits from external accountability and time pressure | Medium | Pomodoro variants, virtual "presence", timed focus sessions (Llama Life style) |
| **Task time estimates** | ADHD has poor time estimation; app helps predict duration | Medium | AI-suggested durations, learn from past completions |
| **Hyperfocus protection** | ADHD hyperfocus causes time loss; need break reminders | Medium | Interruption reminders, session limits, break enforcement |
| **Emotional task tracking** | ADHD often has task-related anxiety; tracking helps identify patterns | Medium | Energy level needed, emotional resistance, task dread scores |
| **Gamification / rewards** | ADHD responds to immediate rewards; points/achievements help | Medium | XP systems, character growth (Finch-style), achievements |
| **Task categorization by energy** | ADHD has variable energy; need to match tasks to current state | Medium | Low/medium/high energy tags, filter by current capacity |
| **Magic Todo / simplification** | Goblin Tools approach: rewrite tasks to remove intimidation | Medium | AI rewording, task simplification, removing judgmental language |
| **Calendar time blocking** | Visual time allocation helps ADHD brains "see" the day | Medium | Drag tasks to time slots, realistic day visualization |
| **Routine templates** | ADHD struggles with consistency; templates reduce decision fatigue | Medium | Morning/evening routines, recurring checklists, auto-populate |
| **Deadline without punishment** | Traditional deadlines cause anxiety; need supportive reminders | Low | Gentle nudges, "flexible deadlines", suggest reschedule vs guilt |
| **Task initiation helpers** | ADHD struggles with starting; need "just start" aids | Medium | First step highlighting, 2-minute rule suggestions, momentum builders |
| **Distraction capture** | ADHD gets derailed by tangents; need quick "park this thought" | Low | Quick add to "later" bucket, separate from main task list |
| **Context switching support** | ADHD struggles with transitions; need prep for switches | Medium | Transition warnings, context setup reminders, cool-down periods |

## Anti-Features

Features to explicitly NOT build. Common in productivity apps but harmful or counterproductive for ADHD users.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Guilt-inducing overdue indicators** | ADHD already comes with shame; red badges/counters worsen it | Neutral reschedule prompts, "would you like to move this?" language |
| **Rigid deadline enforcement** | ADHD has unpredictable energy/focus; rigid deadlines cause anxiety | Flexible target dates, "aim for" language, easy postponement |
| **Overwhelming feature set** | ADHD paralyzed by too many options; feature bloat kills usability | Progressive disclosure, simple core, optional advanced features |
| **Productivity tracking/analytics** | Comparing to "ideal" productivity worsens ADHD shame spiral | Focus on completion celebration, not productivity metrics |
| **Multi-step task creation** | ADHD needs immediate capture; forms kill momentum | Single-field quick add, optional details later |
| **Mandatory categorization** | ADHD hates organizing before acting; forced categories block capture | Smart defaults, categorize later, optional organization |
| **Achievement streaks that reset** | ADHD has inconsistent productivity; losing streaks feels punishing | Cumulative achievements, celebrate "back on track", no resets |
| **Intrusive notifications** | ADHD already struggles with distraction; notifications worsen it | Gentle, customizable, respect focus mode, no nagging |
| **Complex hierarchy/projects** | ADHD overwhelmed by nested structures; deep trees cause paralysis | Flat structure with tags, max 2-3 levels deep |
| **Productivity comparisons** | ADHD comparing to others worsens inadequacy feelings | No social comparison, individual progress only |

## Feature Dependencies

```
Core capture flow:
  Quick Add → Daily View → Task Completion
  (All must exist for basic usability)

AI task breakdown flow:
  Task Input → AI Breakdown → Edit/Reorder Subtasks → Recursive Breakdown
  ↓
  Mark Subtask Done → Progress Tracking → Parent Task Completion

Time awareness flow:
  Task Entry → Time Estimate → Calendar Slot Assignment → Time Block View

Emotional support flow:
  Task Capture → Energy Level Tag → Filter by Current State → Appropriate Task Suggestion
  ↓
  Completion → Positive Feedback → Streak/Progress Celebration

Mobile/Desktop sync:
  All features depend on reliable sync for ADHD users who capture everywhere
```

## MVP Recommendation

For MVP, prioritize these features to validate core value proposition:

### Phase 1: Core Task Management (Table Stakes)
1. **Quick task capture** - Single input, keyboard accessible
2. **Daily calendar view** - Visual day layout
3. **Drag-and-drop scheduling** - Move tasks between days
4. **Task completion with feedback** - Satisfying completion action
5. **Basic editing** - Inline edit, delete, reschedule

### Phase 2: AI Differentiation (Primary Value)
6. **AI task breakdown** - Core differentiator, simple prompt to start
7. **Subtask editing** - Reorder, delete, edit AI suggestions
8. **Recursive breakdown** - 3-4 levels deep as specified
9. **Regenerate option** - Try again if AI gets it wrong
10. **Swappable AI provider** - Backend architecture for multiple providers

### Phase 3: ADHD-Specific Polish
11. **Task time estimates** - Help with time blindness
12. **Energy level tagging** - Match tasks to capacity
13. **Positive completion feedback** - Dopamine-friendly celebrations
14. **Gentle reschedule prompts** - No guilt, just "want to move this?"

### Defer to Post-MVP

**Gamification/rewards system** - Complex to implement well, can add later if engagement data shows need

**Body doubling/focus timer** - Valuable but not core to task breakdown value proposition

**Mobile app** - Start web-responsive for personal use, native mobile if traction

**Routine templates** - Useful but not essential for validating core AI breakdown concept

**Emotional task tracking** - Nice-to-have, adds complexity to MVP

**Calendar integration** - Sync with Google/Outlook can come after internal calendar works

## ADHD-Specific Design Principles

Based on apps like Goblin Tools, Structured, and Llama Life, key principles:

### Visual Clarity
- High contrast, clear typography
- Generous whitespace to prevent overwhelm
- Color coding that's meaningful, not decorative
- Icons + text (visual + verbal processing)

### Immediate Feedback
- Every action shows instant result
- Completion feels satisfying (animation, sound, visual change)
- Loading states don't create anxiety ("AI is thinking...")
- Errors are helpful, not punishing

### Low Cognitive Load
- Single primary action visible at any time
- Hide complexity behind progressive disclosure
- Default to simplest option
- Smart suggestions reduce decisions

### Forgiveness
- Easy undo for everything
- No destructive actions without confirmation
- Nothing is "too late" - can always reschedule
- App remembers context when user returns

### Motivation Support
- Celebrate small wins
- Break large tasks into dopamine-sized chunks
- Make starting feel easy
- Remove judgment language ("should", "must", "overdue")

## Competitive Landscape Analysis

### General Task Apps (Todoist, Things 3)
**What they do well:**
- Mature, polished UI/UX
- Reliable sync
- Keyboard shortcuts
- Natural language input

**What they lack for ADHD:**
- No task breakdown assistance
- Overwhelming project hierarchy
- Productivity-focused metrics (stressful for ADHD)
- Limited emotional/energy context

### ADHD-Specific Apps

**Goblin Tools (Magic Todo):**
- Task simplification and breakdown
- Removes intimidation from task wording
- Simple, focused interface
- **Gap:** No calendar view, no scheduling, very basic

**Structured:**
- Beautiful time-blocked calendar view
- Visual daily planning
- Drag-and-drop time assignment
- **Gap:** No AI assistance, manual task breakdown

**Llama Life:**
- Focus timer with task list
- Urgency-based time pressure
- Simple, focused interface
- **Gap:** No task breakdown, no calendar scheduling

**Finch:**
- Gamification with emotional check-ins
- Character growth tied to task completion
- Mental health focus
- **Gap:** Not primarily a task manager, limited breakdown

### Your App's Opportunity Space

**Unique combination:**
- AI task breakdown (Goblin Tools sophistication)
- + Calendar scheduling (Structured's visual planning)
- + ADHD-friendly design (Llama Life's simplicity)
- + Recursive depth (novel - go deeper than existing tools)

**White space:**
- No existing app combines AI breakdown WITH calendar scheduling
- Recursive subtask breakdown at 3-4 levels is deeper than competitors
- Swappable AI providers gives user control (helps with AI skepticism)

## Feature Complexity Assessment

| Complexity | Features | Phase Suggestion |
|------------|----------|-----------------|
| **Low** | Quick capture, daily view, task completion, basic editing, visual feedback | Phase 1 (MVP core) |
| **Medium** | Drag-and-drop scheduling, AI task breakdown (single level), time estimates, energy tagging | Phase 1-2 (MVP + differentiation) |
| **High** | Recursive AI breakdown (3-4 levels), swappable AI providers, cross-platform sync, routine templates | Phase 2-3 (core differentiation + polish) |
| **Very High** | Real-time collaboration, advanced gamification, calendar integration (external), mobile native apps | Post-MVP |

## Sources

**Confidence Level: LOW**

All information based on training data knowledge (pre-January 2025) of:
- Todoist, Things 3 (general task management apps)
- Goblin Tools, Finch, Structured, Llama Life (ADHD-specific apps)
- ADHD executive function challenges
- General productivity app patterns

**Validation Needed:**
- Current feature sets of mentioned apps (may have evolved)
- Recent ADHD productivity research (2025-2026)
- User studies on ADHD task management needs
- Competitive landscape changes

**Recommended Verification:**
- Download and test each mentioned app
- Review ADHD community discussions (Reddit r/ADHD, ADDitude forums)
- Consult ADHD coaches/therapists about task management needs
- User interviews with ADHD individuals about current tool pain points
