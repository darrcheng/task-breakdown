# Domain Pitfalls

**Domain:** ADHD-focused to-do list with AI task breakdown
**Researched:** 2026-02-05
**Confidence:** MEDIUM (based on training data and known patterns, not verified with current sources)

## Critical Pitfalls

Mistakes that cause rewrites, abandonment, or fundamentally broken user experience.

### Pitfall 1: Overwhelming the ADHD User with Complexity
**What goes wrong:** App becomes a second job to manage. Users need to categorize, tag, prioritize, assign contexts, set energy levels, choose quadrants, etc. The cognitive load of managing the system exceeds the benefit of using it.

**Why it happens:** Developers assume more features = more helpful. Power users and productivity enthusiasts (who often test early versions) love complex systems. But ADHD users specifically need friction reduction, not flexibility.

**Consequences:**
- User opens app, feels overwhelmed, closes it
- Tasks pile up uncategorized because categorization itself is a task
- App abandonment within 2-4 weeks
- User returns to simpler tools (Apple Reminders, sticky notes)

**Prevention:**
- Default to zero-config usage: tasks go in, tasks show up, done
- Make every feature optional and hidden until explicitly enabled
- Ruthlessly cut features that require decisions before task entry
- Test with actual ADHD users, not productivity enthusiasts
- Measure "time to first task added" - should be under 10 seconds

**Detection:**
- Analytics show users creating tasks but not returning
- User testing reveals confusion about "how to use" the app
- Support requests asking "what's the right way to organize this?"

**Phase impact:** Foundation phase must establish minimal-friction task entry as core principle.

---

### Pitfall 2: Infinite Recursion and Explosion of Subtasks
**What goes wrong:** AI generates 4 levels of subtasks for a simple task. User faces 47 subtasks for "clean kitchen." The breakdown itself becomes paralyzing.

**Why it happens:**
- No limits on AI breakdown depth or breadth
- AI doesn't understand "atomic task" threshold
- No user control over breakdown granularity
- Recursive breakdown happens automatically without user confirmation

**Consequences:**
- Users see overwhelming list of micro-tasks
- Performance degrades (rendering 1000+ nested items)
- Database queries become exponentially complex
- UI becomes unusable (scrolling through endless nesting)
- Paradox: tool meant to reduce overwhelm creates more overwhelm

**Prevention:**
- Hard limit recursive depth to 3 levels maximum
- Limit breadth: max 5-7 subtasks per parent
- User confirms before breakdown happens ("Break this down?")
- UI shows collapsed view by default (expand on demand)
- AI prompt engineering: "Generate 3-5 concrete, actionable subtasks"
- Implement "stop breakdown" UX: user can mark task as atomic
- Database schema enforces depth limits with check constraints

**Detection:**
- Monitor average subtask count per task
- Alert if any task tree exceeds 20 total nodes
- User feedback: "too many steps"
- Performance metrics: query time >100ms for task tree

**Phase impact:** MVP must include breakdown limits. Do NOT defer this to "optimization" phase.

---

### Pitfall 3: Stale AI Breakdown Context
**What goes wrong:** User creates task "Review Q4 analysis." AI breaks it down based on generic business analysis. But user's Q4 analysis is actually a podcast episode script. Breakdown is useless.

**Why it happens:**
- AI has no context about user's life, work, or current projects
- No memory of past tasks or user's domain
- Prompt sends only the task title, nothing else
- Generic LLM training data assumes common interpretations

**Consequences:**
- User must manually rewrite or delete AI-generated subtasks
- Trust in AI feature erodes rapidly
- Feature becomes "gimmick" rather than genuinely helpful
- User stops using breakdown feature entirely

**Prevention:**
- Include context in AI prompt: recent tasks, task notes, project tags if present
- Allow user to add one-line context: "Task: X | Context: podcast script"
- Learn from user edits: track when user modifies/deletes AI suggestions
- Provide feedback mechanism: "Was this breakdown helpful? Y/N"
- Consider user's domain over time (e.g., "user often works on podcasts")
- Make AI suggestions editable BEFORE they become real tasks

**Detection:**
- Track how often users delete all AI-generated subtasks
- Monitor edit rate: >50% of AI tasks edited = poor quality
- User feedback scores trending negative

**Phase impact:** Phase 2 (AI integration) must include context passing, not just bare task title.

---

### Pitfall 4: Cross-Platform Sync Race Conditions
**What goes wrong:** User drags task to Friday on web app. While syncing, user marks same task done on mobile. Sync conflict: task is now both "Friday" and "completed" with different timestamps. System doesn't know which is authoritative. Task disappears or duplicates.

**Why it happens:**
- Last-write-wins sync strategy
- No conflict resolution strategy
- Optimistic UI updates without sync confirmation
- No vector clocks or operational transforms
- Editing same entity on multiple devices simultaneously

**Consequences:**
- Data loss: user's changes disappear mysteriously
- Duplicate tasks appear
- User loses trust in system reliability
- "It's buggy" perception kills app adoption
- Support burden explodes

**Prevention:**
- Implement conflict resolution strategy upfront (e.g., CRDTs, operational transforms, or explicit conflict UI)
- Use version vectors or logical clocks for change tracking
- Design data model for eventual consistency from day one
- Consider offline-first architecture (local source of truth)
- Test sync with two devices making conflicting changes simultaneously
- Show sync status clearly in UI ("Syncing...", "Synced ✓", "Conflict!")
- For MVP: consider simpler approach - last sync timestamp + conflict detection that prompts user

**Detection:**
- Bug reports: "my task disappeared"
- Data audits show orphaned or duplicate records
- Timestamp analysis reveals overlapping edits
- Support tickets about "wrong task appearing"

**Phase impact:** Foundation phase architecture decision. Cannot bolt on later without refactor.

---

### Pitfall 5: Calendar-Task Impedance Mismatch
**What goes wrong:** User has task "Write blog post" on Tuesday. Task takes 3 hours but user only has 45-minute block. Drags it to Wednesday. Realizes Wednesday is also packed. Drags to Thursday. Now feels behind and guilty. Task becomes anxiety trigger instead of clarity tool.

**Why it happens:**
- Calendar view implies time blocks but tasks have no duration
- No capacity planning: day can have infinite tasks
- No visual indication of overload
- System doesn't understand time estimation
- Drag-and-drop makes rescheduling too frictionless (sounds good, but enables avoidance)

**Consequences:**
- Tasks accumulate on "someday" days
- User experiences planning fallacy repeatedly
- Guilt and shame associated with app usage
- Specifically harmful for ADHD: time blindness already a challenge
- App reinforces executive dysfunction instead of supporting it

**Prevention:**
- Make time estimates optional but encouraged (AI can suggest)
- Visual capacity indicator: "You have 6 hours of tasks on a day you're free for 3 hours"
- Warn on overload: "This day looks packed. Still add here?"
- Offer "find time for this" feature: AI suggests realistic day based on existing load
- Track completion rates by day to show realistic capacity patterns
- Consider "energy available" not just time (ADHD users have variable energy)
- Separate "scheduled for date" from "hoping to do on date"

**Detection:**
- Analytics: tasks rescheduled 3+ times never get done
- Days with >8 hours of estimated tasks
- User doesn't complete >70% of planned tasks on any given day

**Phase impact:** MVP can skip duration tracking, but Phase 2 must add capacity awareness.

---

### Pitfall 6: AI Cost Explosion Without Budget Controls
**What goes wrong:** User creates 50 tasks in planning session. Each triggers AI breakdown (GPT-4 call). User generates $5 in API costs before adding a single real task. Monthly costs balloon to hundreds of dollars for personal use app.

**Why it happens:**
- No rate limiting on AI calls
- No cost estimation before API call
- Auto-breakdown on every task create
- No caching of similar breakdowns
- Using expensive models (GPT-4) when cheaper would work
- No user awareness of costs accumulating

**Consequences:**
- Unsustainable economics for free/personal tier
- Forced to add paywall before product-market fit
- Developer subsidy required for testing
- Can't afford to onboard users
- If costs passed to user, sticker shock kills adoption

**Prevention:**
- Require explicit user action to trigger breakdown (button, not automatic)
- Daily/monthly AI call limits for free tier
- Cache common task breakdowns (e.g., "clean kitchen" probably similar for everyone)
- Use cheaper models first (GPT-3.5 or Claude Haiku), upgrade only if needed
- Batch AI requests where possible
- Show user when they're approaching limits
- Consider local/smaller models for common patterns
- Implement debouncing: don't call AI on every keystroke

**Detection:**
- Monitor API costs daily during development
- Alert if cost per user exceeds threshold ($X/month)
- Track AI call patterns: spikes indicate no rate limiting

**Phase impact:** Must implement before any real user testing. Cost controls are Day 1.

---

### Pitfall 7: Recursive Tree Rendering Performance
**What goes wrong:** User has 200 tasks with 3 levels of subtasks each. UI tries to render entire tree on load. Page freeze for 5-10 seconds. Mobile app crashes. Scrolling is janky. Each drag-and-drop operation re-renders entire tree.

**Why it happens:**
- Naive recursive rendering: traverse entire tree on every render
- No virtualization for long lists
- React reconciliation on deeply nested components
- Querying entire tree from database instead of pagination
- No memoization of subtask trees
- Every state change triggers full tree re-render

**Consequences:**
- App unusable with real data volumes
- Mobile performance unacceptable (lower RAM, CPU)
- User frustration with lag
- Battery drain on mobile
- Cannot scale beyond toy examples

**Prevention:**
- Implement virtual scrolling for task lists (react-window, react-virtuoso)
- Lazy load subtasks: only fetch when parent expanded
- Memoize subtask components (React.memo, useMemo)
- Database: index on parent_id, fetch only visible level
- Consider flattened view options (show all as flat list with indent)
- Debounce drag operations
- Use optimistic UI updates while background sync happens
- Profile with realistic data: 500+ tasks, 3 levels deep
- Set performance budget: <100ms for initial render, <16ms for interactions

**Detection:**
- Lighthouse performance scores <80
- Render time profiling shows >100ms
- User reports of "app is slow"
- Frame drops during drag operations

**Phase impact:** Foundation phase must choose performant patterns. Optimizing later requires rewrite.

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt but are recoverable.

### Pitfall 8: Over-Engineering AI Provider Abstraction
**What goes wrong:** Spend 2 weeks building complex adapter pattern for swappable AI providers. Abstract every API difference. Build configuration UI for each provider. Ship MVP without any users, never need to swap providers.

**Why it happens:**
- Premature optimization
- "Future-proofing" that never pays off
- Confusing flexibility with value
- Not validating need before building abstraction

**Prevention:**
- Start with single provider (OpenAI or Anthropic)
- Simple function: `generateSubtasks(taskTitle: string): Promise<Subtask[]>`
- Add abstraction only when second provider is needed
- YAGNI principle: You Aren't Gonna Need It (until you do)
- Environment variable for API key, hard-code provider initially

**Detection:**
- Architecture planning takes longer than implementation would
- No users asking for provider choice
- Abstraction layer has one implementation for months

---

### Pitfall 9: Notification Hell
**What goes wrong:** App sends notifications for task due, task overdue, task due tomorrow, weekly summary, AI breakdown ready, sync complete, encouragement messages. User disables all notifications after 3 days.

**Why it happens:**
- Each feature team adds their notification
- No holistic notification strategy
- Assumption that more reminders = more helpful
- For ADHD users specifically: notification fatigue leads to learned helplessness

**Prevention:**
- Default to zero notifications
- Make every notification opt-in, not opt-out
- Batch notifications: one daily summary, not 15 individual alerts
- Respect notification preferences religiously
- Test: "Would I want this notification 30 days from now?"
- Consider alternative: in-app indicators instead of push

**Detection:**
- Analytics show notification disable rate >50%
- App uninstalls spike after notification feature ships
- User feedback: "too many notifications"

---

### Pitfall 10: Authentication Overload for Personal App
**What goes wrong:** Implement OAuth, social login, 2FA, email verification, password reset flow, session management. User just wants to try the app on their laptop.

**Why it happens:**
- Building for enterprise scale when it's personal use
- Cargo-culting auth patterns from other apps
- Security theater without threat model

**Prevention:**
- For initial MVP: localStorage or even no auth (single device)
- First multi-device need: simple email/password or magic link
- Add OAuth only when users request specific provider
- Don't build what Firebase Auth or Supabase Auth already provides
- Ask: "What's the actual risk of skipping this?"

**Detection:**
- Auth implementation takes >20% of MVP timeline
- No users yet but complex auth system built
- Auth code larger than core app features

---

### Pitfall 11: Ignoring Time Zones in Calendar View
**What goes wrong:** User schedules task for "Tuesday February 4, 2026." Travels to different time zone. Opens app, task now shows on Wednesday. Or creates task on mobile (PST), syncs to web (UTC stored), shows wrong day.

**Why it happens:**
- Storing dates as UTC timestamps instead of date-only
- Mixing Date objects (time-aware) with calendar dates (time-agnostic)
- Not considering user's local time zone on display
- Calendar libraries default to midnight UTC

**Prevention:**
- Store calendar dates as date-only strings: "2026-02-04" (ISO 8601 date)
- Never convert to timestamp for calendar dates
- Use time zone only for "created_at" and sync metadata
- Test with device time zone changed
- Library choice: consider date-fns or Temporal API for date handling

**Detection:**
- Bug reports: "task appeared on wrong day"
- Users in different time zones see different dates
- Daylight saving time transitions cause issues

---

### Pitfall 12: No Offline Support on Mobile
**What goes wrong:** User on subway, opens app, sees loading spinner forever. Cannot add task. Cannot check tasks. App is useless without connection.

**Why it happens:**
- API-first architecture without local cache
- No offline queue for writes
- Assuming constant connectivity

**Prevention:**
- Local-first architecture: SQLite or IndexedDB as source of truth
- Sync in background, not on user action
- Queue writes when offline, sync when reconnected
- Show clear offline indicator
- Use service workers (PWA) for web version

**Detection:**
- Network tab shows app broken without connection
- Mobile users report "app doesn't work on subway"
- Bounce rate correlated with network conditions

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major refactoring.

### Pitfall 13: No Undo for Drag-and-Drop
**What goes wrong:** User accidentally drags task to wrong day. No way to undo. Must manually drag back. Or worse, dropped it "somewhere" and now can't find it.

**Prevention:**
- Cmd/Ctrl+Z support for all mutations
- Toast notification after drag: "Moved to Friday. Undo?"
- Confirmation for destructive actions (delete task with subtasks)

---

### Pitfall 14: AI Subtask Generation Has No Loading State
**What goes wrong:** User clicks "Break down task," nothing happens for 3-5 seconds, user clicks again, now two breakdown requests, gets duplicate subtasks or error.

**Prevention:**
- Immediate loading indicator (spinner, skeleton UI)
- Disable button while request in flight
- Show progress: "Thinking..." → "Generating subtasks..."
- Timeout with friendly error: "AI is taking longer than usual. Try again?"

---

### Pitfall 15: Accessibility Ignored in Drag Interface
**What goes wrong:** Keyboard users, screen reader users cannot rearrange tasks. Drag-and-drop is mouse-only.

**Prevention:**
- Keyboard shortcuts for moving tasks (Cmd+↑/↓ for days, Cmd+→/← for indent)
- Screen reader announcements: "Task moved to Friday"
- Consider alternative UI: dropdown or date picker as fallback
- Test with keyboard only (unplug mouse)
- ARIA labels for drag handles

---

### Pitfall 16: No Empty States
**What goes wrong:** New user sees blank screen. No guidance. Doesn't know what to do.

**Prevention:**
- Welcome screen with sample task or tutorial
- Empty state messaging: "No tasks for today. Add one below!"
- Onboarding checklist: "Add your first task" → "Try AI breakdown" → "Move task to tomorrow"

---

### Pitfall 17: Mobile Keyboard Covers Input Field
**What goes wrong:** User taps to add task, keyboard appears, input field behind keyboard. Cannot see what they're typing.

**Prevention:**
- ScrollView with keyboardShouldPersistTaps
- Android: adjustResize window setting
- iOS: KeyboardAvoidingView component
- Test on multiple device sizes

---

### Pitfall 18: No Data Export
**What goes wrong:** User wants to switch tools or back up data. Locked in. Feels trapped. Doesn't trust app as long-term solution.

**Prevention:**
- Export to JSON or CSV
- Even simple MVP should have export
- Builds trust: "Your data is yours"
- Bonus: import from competitor formats

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation (Data model) | Recursive depth not enforced in schema | Add CHECK constraint: depth <= 3 |
| Foundation (Sync architecture) | Last-write-wins without conflict detection | Design conflict strategy upfront |
| AI Integration | Auto-breakdown on every task | Require explicit user trigger |
| AI Integration | No cost monitoring | Implement rate limits Day 1 |
| Calendar UI | Time-zone bugs with calendar dates | Store dates as strings, not timestamps |
| Mobile MVP | No offline support | Local-first architecture from start |
| Performance | Recursive tree renders entire dataset | Virtual scrolling, lazy loading, memoization |
| ADHD UX | Feature creep adds cognitive load | Ruthless scope control, test with ADHD users |
| Multi-platform | Sync race conditions not tested | Test with two devices making conflicting edits |

---

## Confidence Assessment

**Overall confidence:** MEDIUM

**Why MEDIUM:**
- Based on training knowledge of productivity app patterns (HIGH confidence)
- Based on known ADHD UX principles (MEDIUM-HIGH confidence)
- Based on recursive data structure performance patterns (HIGH confidence)
- Based on AI integration cost/quality tradeoffs (HIGH confidence)
- NOT verified with 2026 current sources due to WebSearch unavailability (reduces confidence)
- NOT verified with recent post-mortems or case studies (would increase confidence)
- Patterns are well-established but specific tools/solutions may have evolved

**What would increase confidence:**
- Access to recent productivity app post-mortems
- Current ADHD community feedback on existing apps
- Recent AI integration case studies
- Current cross-platform sync library best practices

---

## Sources

**Note:** Due to WebSearch unavailability, this research draws from training knowledge (as of January 2025) of:
- Productivity app development patterns
- ADHD-specific UX research (accessible technology guidelines)
- Recursive data structure performance characteristics
- AI integration cost and quality tradeoffs
- Cross-platform sync architecture patterns

**Recommended validation:**
- Test patterns with actual ADHD users during development
- Consult ADHD community forums (Reddit r/ADHD, ADDitude Magazine)
- Review recent productivity app case studies (Todoist, Things, TickTick engineering blogs)
- Validate AI costs with current OpenAI/Anthropic pricing
- Test cross-platform sync patterns with chosen tech stack

**Flag for phase-specific research:**
- Specific sync library recommendations (when tech stack chosen)
- Current AI model pricing and capabilities (before Phase 2)
- Performance profiling benchmarks for chosen framework (during Foundation)
