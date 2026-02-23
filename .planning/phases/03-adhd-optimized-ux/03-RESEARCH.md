# Phase 3: ADHD-Optimized UX - Research

**Researched:** 2026-02-23
**Domain:** ADHD-specific UX patterns, CSS animation, AI prompt engineering, Dexie schema migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Completion Celebrations**
- Subtle & satisfying intensity — not over-the-top
- No sound — visual only
- Fade & strikethrough animation style: task text gets gentle strikethrough, row fades slightly
- Completed tasks stay visible until end of day, then auto-archive
- No tiered celebrations — same treatment for all task completions

**Overdue Task Nudges**
- Closeable banner at the top of the calendar view when overdue tasks exist
- Warm & casual tone: "You've got 3 tasks from earlier this week — want to move them?"
- Banner shows once per day — if dismissed, won't reappear until tomorrow
- Tapping banner opens a quick picker with all overdue tasks listed
- Per-task actions in quick picker: date picker (reschedule), archive to Someday, mark done
- Bulk actions at bottom: "Move all to today" (default date = today, one tap) and "Send all to Someday"
- "Someday" list — a separate accessible list for archived tasks the user wants to remember but isn't committing to a date

**AI Time Estimates**
- Automatic generation for all tasks — background process when AI is available, no manual trigger needed
- Display in both places: small badge on task card ("~15m") + detailed view inside task modal
- User can tap estimate to manually override
- Smart calibration: estimates learn from user corrections — store override history and use it to improve future estimates for similar tasks
- AI-generated estimates should also be consistent with past estimates and corrections for similar tasks

**Start-Here Highlighting**
- First subtask gets an accent border or subtle glow — visual cue that draws the eye
- No text label — purely visual treatment
- Applied automatically to the first incomplete subtask in a breakdown

### Claude's Discretion
- Energy tagging UI design (chips, colors, filter placement)
- Exact animation timing and easing curves for completion celebrations
- Someday list access point (sidebar, menu, or dedicated section)
- How "similar tasks" are matched for time estimate calibration
- Accent color choice for start-here highlighting

### Deferred Ideas (OUT OF SCOPE)
- Dedicated "today view" — potential future phase for a focused daily dashboard
- Tiered celebrations (bigger reward for completing parent tasks with all subtasks) — revisit in v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TASK-07 | Task completion shows satisfying visual/audio feedback | CSS transition pattern (departing state + strikethrough + fade); no audio per locked decisions; existing `departing` state machine in TaskListItem/SubtaskRow is the hook point |
| TASK-08 | Uncompleted tasks can be easily rescheduled with no guilt language | Overdue banner in calendar header + quick picker modal; guilt-free copy ("want to move them?" not "you missed these"); bulk-move-to-today and send-to-Someday actions |
| ADHD-01 | User can tag tasks by energy level (low/medium/high) | New `energyLevel` field on Task type; Dexie v3 migration adding index; chip UI in TaskForm/TaskModal; filter in header or above calendar grid |
| ADHD-02 | User can see AI-suggested time estimates for tasks | New `timeEstimate` + `timeEstimateOverride` fields on Task; background AI call after task save; badge on TaskCard and detail in TaskModal; override stored to localStorage calibration map |
| ADHD-03 | Completing tasks shows positive celebration animation | Enhance existing `departing` state pattern: add `ring-2` accent glow + gentle CSS keyframe; 1500ms window aligns with current departure timing |
| ADHD-04 | Overdue tasks show gentle reschedule prompts (not guilt) | `useOverdueTasks` hook querying tasks with date < today and status !== 'done'; dismissal stored in localStorage keyed by date; OverdueBanner and OverdueQuickPicker components |
| ADHD-05 | First subtask is visually highlighted as "start here" | In SubtaskList, identify first item where status !== 'done'; apply `ring-2 ring-violet-400` or equivalent; purely CSS — no label; auto-updates as subtasks complete |
</phase_requirements>

---

## Summary

Phase 3 is a pure enhancement layer on top of the existing React + Vite + Tailwind CSS 4 + Dexie.js stack. No new library installations are required. Every feature augments existing components rather than adding new screens: TaskListItem and SubtaskRow already have the `departing` state machine that forms the natural hook point for celebration animations; DayCell and the calendar header are the right locations for energy filtering and the overdue banner; the AI provider abstraction (`useAIProvider` / `AIProvider` interface) supports adding a new prompt without changing the provider wiring.

The two most architecturally significant pieces are (1) a Dexie v3 schema migration adding `energyLevel` and `timeEstimate*` fields to the `tasks` table, and (2) a background AI estimation service that fires after task creation/edit without blocking the UI. Both are contained changes: the migration follows the existing versioned upgrade pattern already in `database.ts`, and the estimation service can be a standalone hook (`useTimeEstimate`) that reads the AI provider and writes back to Dexie, keeping concerns separated.

The overdue banner and Someday list require the most new surface area: a new `someday` date sentinel (or a `isSomeday` boolean field), localStorage-keyed dismissal state, and a new `OverdueQuickPicker` component. All of these are straightforward given the existing patterns.

**Primary recommendation:** Extend the existing `Task` type and Dexie schema first (Wave 0), then layer each UX feature as isolated component enhancements. This keeps the work parallelizable and avoids merge conflicts.

---

## Standard Stack

### Core (already installed — no new deps needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2 | Component rendering, state | Project foundation |
| Tailwind CSS | 4.2 | Utility styling, animation classes | Project foundation; has `transition`, `animate-*`, ring utilities |
| Dexie.js | 4.3 | IndexedDB ORM, schema versioning | Project foundation; versioned migrations already used |
| dexie-react-hooks | 4.2 | `useLiveQuery` reactive DB reads | Project foundation; used throughout |
| lucide-react | 0.575 | Icons (Battery/Zap for energy, Clock for estimates) | Project foundation; 20+ icons already imported |
| clsx | 2.1 | Conditional class composition | Project foundation; used in every component |
| date-fns | 4.1 | Date arithmetic for overdue detection | Project foundation; already imported in App.tsx and DayCell.tsx |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | 0.78 | Anthropic AI provider | When user has Anthropic key selected |
| @google/genai | 1.42 | Gemini AI provider | When user has Gemini key selected |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS keyframes via Tailwind | framer-motion / react-spring | Motion libraries add 20-50KB and are not needed for simple fade+strikethrough; Tailwind 4 `transition` utilities cover the requirement |
| localStorage for dismissal state | Dexie table | A lightweight `taskbreaker-overdue-dismissed` localStorage key avoids a DB write for a purely UI-session concern |
| localStorage for estimate calibration | Dexie table | Calibration map (task title tokens → correction factor) is user-device-local and small; localStorage is fine unless multi-device sync is added (Phase 4 deferred) |

**Installation:** None required. All dependencies are present.

---

## Architecture Patterns

### Recommended Project Structure Extensions

```
src/
├── components/
│   ├── task/
│   │   ├── TaskCard.tsx           # add energyLevel chip + time estimate badge
│   │   ├── TaskForm.tsx           # add energy level selector
│   │   ├── TaskModal.tsx          # add time estimate detail + override
│   │   └── SubtaskList.tsx        # add start-here ring on first incomplete subtask
│   ├── calendar/
│   │   └── OverdueBanner.tsx      # NEW — dismissable banner above calendar grid
│   └── overdue/
│       └── OverdueQuickPicker.tsx # NEW — modal with per-task rescue actions
├── hooks/
│   ├── useOverdueTasks.ts         # NEW — reactive query for past-due non-done tasks
│   └── useTimeEstimate.ts         # NEW — background AI estimation + calibration
├── db/
│   └── database.ts                # v3 migration: energyLevel, timeEstimate fields
├── types/
│   └── index.ts                   # EnergyLevel type, Task field additions
└── utils/
    └── estimateCalibration.ts     # NEW — localStorage calibration map read/write
```

### Pattern 1: Dexie Versioned Migration (existing pattern)

**What:** Add new optional fields to `tasks` table in a new `db.version(N).stores()` block.
**When to use:** Any time the schema changes; existing data must survive.
**Example:**
```typescript
// Source: existing src/db/database.ts pattern
db.version(3).stores({
  tasks: '++id, date, status, categoryId, parentId, depth, energyLevel',
  categories: '++id, name',
  aiSettings: '++id, key',
}).upgrade((tx) => {
  return tx.table('tasks').toCollection().modify((task) => {
    if (task.energyLevel === undefined) task.energyLevel = null;
    if (task.timeEstimate === undefined) task.timeEstimate = null;
    if (task.timeEstimateOverride === undefined) task.timeEstimateOverride = null;
    if (task.isSomeday === undefined) task.isSomeday = false;
  });
});
```

**Key insight:** `energyLevel` is indexed (listed in stores string) so filtering by energy level uses a Dexie index query, not a full table scan. `timeEstimate`, `timeEstimateOverride`, and `isSomeday` are NOT indexed — they're filter/display data only.

### Pattern 2: Reactive Overdue Hook (useLiveQuery)

**What:** Query tasks where date < today and status !== 'done' and isSomeday !== true.
**When to use:** OverdueBanner and OverdueQuickPicker.
**Example:**
```typescript
// Source: existing src/db/hooks.ts useLiveQuery pattern
export function useOverdueTasks() {
  const today = formatDateKey(new Date());
  return useLiveQuery(
    () =>
      db.tasks
        .where('date')
        .below(today)
        .filter((t) => t.status !== 'done' && !t.isSomeday && !t.parentId)
        .toArray(),
    [today],
  );
}
```

Note: `parentId` filter excludes subtasks — only root tasks appear in the overdue banner.

### Pattern 3: Background AI Estimation (fire-and-forget)

**What:** After a task is saved to Dexie, call the AI provider asynchronously to generate a time estimate and write it back.
**When to use:** In TaskModal `handleSubmit` after `db.tasks.add` or `db.tasks.update`.
**Example:**
```typescript
// Pattern: fire-and-forget after DB write; no await in UI path
const triggerEstimate = useCallback(async (taskId: number, title: string, description: string) => {
  const provider = await getProvider();
  if (!provider) return; // AI not configured — silently skip
  const estimate = await generateTimeEstimate(provider, title, description, getCalibration(title));
  if (estimate) {
    await db.tasks.update(taskId, { timeEstimate: estimate, updatedAt: new Date() });
  }
}, [getProvider]);

// In handleSubmit:
const newId = await db.tasks.add({ ... });
triggerEstimate(newId, data.title, data.description); // no await — UI proceeds immediately
```

**Key insight:** No `await` on `triggerEstimate` in the UI path. The estimate badge on TaskCard updates reactively via `useLiveQuery` when the DB write lands.

### Pattern 4: Per-Day Dismissal with localStorage

**What:** Store dismissed date in localStorage; compare against today to decide whether to show the banner.
**When to use:** OverdueBanner visibility logic.
**Example:**
```typescript
const DISMISS_KEY = 'taskbreaker-overdue-dismissed';

function isDismissedToday(): boolean {
  const stored = localStorage.getItem(DISMISS_KEY);
  return stored === formatDateKey(new Date());
}

function dismissToday(): void {
  localStorage.setItem(DISMISS_KEY, formatDateKey(new Date()));
}
```

### Pattern 5: Departure State Enhancement (celebration animation)

**What:** Augment the existing `departing` boolean in TaskListItem/SubtaskRow to apply a brief glow before fade-out.
**When to use:** At the moment status transitions to 'done'.
**Example:**
```typescript
// In the departing className block — extend current pattern
departing && 'ring-2 ring-emerald-400 ring-offset-1 opacity-0 transition-all duration-[1500ms] line-through decoration-green-600 text-green-600'
```

The `ring-*` classes fire immediately, then `opacity-0` + `duration-1500` fade the row out — satisfying without being over-the-top. The 1500ms timeout is already wired in; no timing changes needed.

### Pattern 6: Start-Here Ring on First Incomplete Subtask

**What:** In `SubtaskList`, compute the index of the first subtask with `status !== 'done'` and apply a ring class to that row.
**When to use:** Always when `SubtaskList` renders at least one incomplete subtask.
**Example:**
```typescript
const firstIncompleteIndex = subtasks.findIndex((s) => s.status !== 'done');

// In the map:
subtasks.map((subtask, index) => (
  <SubtaskRow
    key={subtask.id}
    subtask={subtask}
    isStartHere={index === firstIncompleteIndex}
    ...
  />
))

// In SubtaskRow className:
isStartHere && 'ring-2 ring-violet-400 ring-offset-1 rounded-md'
```

### Anti-Patterns to Avoid

- **Blocking the UI on AI estimation:** Do not `await` time estimate generation in the submit handler. Users should not wait for AI to finish before the task is saved.
- **Storing Someday tasks with a fake date:** Use a `isSomeday: boolean` field rather than a sentinel date like `9999-12-31`. Sentinel dates leak into date range queries. A boolean field is explicit.
- **Re-rendering the whole calendar to apply energy filter:** Filter at the `useLiveQuery` level in `useTasksByDate` / `useTasksByDateRange` by accepting an optional `energyLevel` filter param. Do not filter in the component render.
- **Nesting OverdueQuickPicker inside OverdueBanner component:** Keep them separate. Banner controls open/close state; QuickPicker is a portal/overlay. This matches the existing TaskModal/ProviderSetupModal separation pattern.
- **Custom animation keyframes in raw CSS files:** Use Tailwind's `transition` + `duration-*` utilities. The project has no global CSS animation infrastructure; adding CSS `@keyframes` in `app.css` would be out of pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date comparison for overdue | Custom date math | `date-fns` `isBefore` + `formatDateKey` (already used) | Already in use; handles timezone edge cases correctly |
| Energy level icon selection | Custom icon map | `lucide-react` `Zap` (high), `Battery` (medium/low) | Already imported ecosystem; consistent with category icons |
| Dismissal expiry | TTL logic | Date string comparison (localStorage key = today's date) | Simpler than TTL; naturally expires at midnight |
| Subtask ordering for start-here | Sort algorithm | `findIndex` on already-sorted `useSubtasks` result | `useSubtasks` already sorts by `sortOrder`; first non-done item is index-based |
| AI prompt routing | New provider abstraction | Extend existing `AIProvider.generateSubtasks` pattern with a new method `estimateTime` | Provider interface already handles Anthropic/Gemini routing |

**Key insight:** Every capability needed for Phase 3 already has a project pattern or a built-in library. The risk is over-engineering (adding libraries, new routing, complex state) where simple extensions of existing patterns suffice.

---

## Common Pitfalls

### Pitfall 1: Someday Tasks Appearing in Calendar / Overdue Banner

**What goes wrong:** Tasks marked as Someday still have their original `date` field, so `useOverdueTasks` and `useTasksByDate` return them.
**Why it happens:** Failing to add `isSomeday` filter to both hooks, or using a sentinel date instead of a boolean.
**How to avoid:** Add `isSomeday` boolean to the Task type and Dexie schema. Filter `!t.isSomeday` in `useOverdueTasks`, `useTasksByDate`, and `useTasksByDateRange`.
**Warning signs:** Someday tasks reappearing in the overdue banner after being sent there; calendar showing archived tasks.

### Pitfall 2: Time Estimate Race Condition

**What goes wrong:** User saves a task, immediately edits it again, and two concurrent AI calls write conflicting `timeEstimate` values.
**Why it happens:** Fire-and-forget pattern with no cancellation.
**How to avoid:** Use a `AbortController` ref in `useTimeEstimate` to cancel the in-flight request when a new one starts for the same task. Or: only generate an estimate if one doesn't already exist (skip re-generation on edit unless title changes significantly).
**Warning signs:** Estimate badge flickering between two values; console errors about writing to a task mid-update.

### Pitfall 3: Energy Filter Breaking Existing useLiveQuery Dep Array

**What goes wrong:** Adding `energyFilter` as a dependency to `useTasksByDate` causes excessive re-renders when users switch views, because the filter value changes on every keystroke if derived from local state.
**Why it happens:** `useLiveQuery` re-runs whenever deps change; filter state should be stable (enum value, not derived string).
**How to avoid:** `energyLevel` filter state should be `EnergyLevel | null` stored in App-level state (or localStorage), not computed inline. Pass it as a prop to the query hook.
**Warning signs:** Calendar flickering when the energy filter chip is clicked.

### Pitfall 4: Overdue Banner Flickering on Midnight Boundary

**What goes wrong:** At midnight, `today` string changes, `useOverdueTasks` re-runs, and `isDismissedToday` resets — banner reappears while the user is mid-session.
**Why it happens:** `formatDateKey(new Date())` is called inline and changes at midnight.
**How to avoid:** Capture `today` once at component mount with `useState(() => formatDateKey(new Date()))`. The banner's dismissal state is session-scoped anyway. A page refresh at midnight is the natural reset point.
**Warning signs:** Banner appearing unexpectedly after being dismissed.

### Pitfall 5: Start-Here Ring Staying on Wrong Subtask After Completion

**What goes wrong:** User completes the first subtask but the ring stays on it because the component hasn't re-computed `firstIncompleteIndex`.
**Why it happens:** `useSubtasks` is reactive via `useLiveQuery`, but if the index computation runs before the DB write settles, the ring shows the wrong item.
**How to avoid:** Because `useSubtasks` uses `useLiveQuery`, it will reactively re-fetch when the DB write lands. The `departing` state delays the DB write by 1500ms. During that 1500ms window, the original first subtask still has `status: 'todo'` in the DB. The ring will correctly move only after `db.tasks.update` fires at the end of the timeout — which is the correct UX (ring stays on the completing item during the celebration, then moves).
**Warning signs:** Ring jumping to wrong item during the 1500ms departure animation.

### Pitfall 6: AI Estimate Prompt Quality

**What goes wrong:** AI returns unusable estimates ("unknown", "varies", or hallucinated multi-day values for simple tasks).
**Why it happens:** Prompt doesn't constrain output format or range.
**How to avoid:** Constrain the prompt: ask for a single number in minutes (15, 30, 60, 120, etc.), provide examples, and add a fallback null if the model refuses. Parse defensively.
**Warning signs:** Badge shows "~undefinedm" or raw JSON.

---

## Code Examples

Verified patterns from project source (not external libraries):

### Energy Level Type Addition

```typescript
// src/types/index.ts — extend existing types
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface Task {
  // ... existing fields ...
  energyLevel?: EnergyLevel | null;
  timeEstimate?: number | null;        // minutes, AI-generated
  timeEstimateOverride?: number | null; // minutes, user-set
  isSomeday?: boolean;                  // true = archived to Someday list
}
```

### Energy Level Chip Component (Claude's Discretion)

```typescript
// Recommended: 3-chip horizontal selector in TaskForm, after status
const ENERGY_OPTIONS: { value: EnergyLevel; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'low',    label: 'Low',    icon: Battery,    color: 'text-sky-600 bg-sky-50 border-sky-300' },
  { value: 'medium', label: 'Medium', icon: BatteryMedium, color: 'text-amber-600 bg-amber-50 border-amber-300' },
  { value: 'high',   label: 'High',   icon: Zap,        color: 'text-emerald-600 bg-emerald-50 border-emerald-300' },
];

// Usage: tap chip to select, tap again to deselect (null)
<div className="flex gap-2">
  {ENERGY_OPTIONS.map(opt => (
    <button
      key={opt.value}
      onClick={() => setEnergy(energy === opt.value ? null : opt.value)}
      className={clsx('flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium transition-colors',
        energy === opt.value ? opt.color : 'text-slate-500 bg-white border-slate-300 hover:border-slate-400'
      )}
    >
      <opt.icon className="w-3 h-3" />
      {opt.label}
    </button>
  ))}
</div>
```

### Time Estimate Badge on TaskCard

```typescript
// Small badge added to TaskCard after task title
{effectiveEstimate && (
  <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
    ~{formatEstimate(effectiveEstimate)}
  </span>
)}

// Where effectiveEstimate = task.timeEstimateOverride ?? task.timeEstimate
// formatEstimate(mins): mins < 60 ? `${mins}m` : `${Math.round(mins/60)}h`
```

### AI Time Estimate Prompt

```typescript
// src/ai/prompts.ts — new function
export function buildTimeEstimatePrompt(
  taskTitle: string,
  taskDescription: string,
  calibrationHint: string, // e.g. "Your past tasks like this took ~45 minutes"
): string {
  return `Estimate how long this task will take in minutes.

**Task:** ${taskTitle}
${taskDescription ? `**Description:** ${taskDescription}` : ''}
${calibrationHint ? `**Calibration note:** ${calibrationHint}` : ''}

**Rules:**
- Return ONLY a JSON object: {"minutes": <number>}
- Round to nearest: 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240
- If the task is vague or could vary greatly, pick the median realistic estimate
- Do not explain your answer

Example: {"minutes": 30}`;
}
```

### Overdue Banner Dismissal (localStorage pattern)

```typescript
// src/components/calendar/OverdueBanner.tsx
const DISMISS_KEY = 'taskbreaker-overdue-dismissed';

function OverdueBanner({ tasks, onOpenPicker }: OverdueBannerProps) {
  const today = useMemo(() => formatDateKey(new Date()), []); // stable per mount
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(DISMISS_KEY) === today
  );

  if (dismissed || tasks.length === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, today);
    setDismissed(true);
  };

  const msg = tasks.length === 1
    ? `You've got 1 task from earlier — want to move it?`
    : `You've got ${tasks.length} tasks from earlier this week — want to move them?`;

  return (
    <div className="mx-4 mt-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-sm text-amber-800">
      <span>{msg}</span>
      <div className="flex items-center gap-2">
        <button onClick={onOpenPicker} className="font-medium underline hover:no-underline">Review</button>
        <button onClick={handleDismiss} className="text-amber-600 hover:text-amber-800"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `opacity-0 transition duration-1500` class | Tailwind 4 `duration-[1500ms]` arbitrary value | Tailwind 4 | Arbitrary duration values are now inline — no custom CSS needed |
| `useLiveQuery` with empty deps | `useLiveQuery` with reactive deps array | Dexie 4 | Must include deps that affect the query; already done correctly in project |
| `db.version(N)` with no `.upgrade()` | `.upgrade(tx => ...)` for data migration | Dexie 4 | Required when adding fields that need defaults on existing records |

**Deprecated/outdated:**
- `isSomeday` as a sentinel date (`9999-12-31`): Don't use. Boolean flag is clearer and won't interfere with date range queries.

---

## Open Questions

1. **Someday List access point**
   - What we know: User needs to access Someday tasks; CONTEXT.md marks access point as Claude's discretion
   - What's unclear: Whether a dedicated modal, a sidebar drawer, or a new viewMode value is preferable
   - Recommendation: Add `'someday'` as a new `ViewMode` value (`'calendar' | 'list' | 'someday'`). Reuses the existing `ViewToggle` pattern with a third button. This avoids a new modal layer and gives the Someday list a permanent home in the nav.

2. **Energy filter placement**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Whether filter appears in the App header (global) or above each view (local)
   - Recommendation: Add energy filter chips to the App header, right of the ViewToggle. Filters apply globally across both calendar and list views. Matches the existing `showCompleted` toggle pattern.

3. **Calibration similarity matching**
   - What we know: CONTEXT.md says estimates should "learn from user corrections"; Claude's discretion on how similarity is matched
   - What's unclear: Whether to use exact title match, keyword match, or category-based matching
   - Recommendation: Use category-based averaging as v1 calibration. Store override history as `{ categoryId: number, estimatedMinutes: number, actualMinutes: number }[]` in localStorage. When estimating, compute average correction ratio for the same categoryId and include it in the prompt as a calibration hint. Simple, deterministic, no NLP required.

4. **`generateTimeEstimate` on the AIProvider interface**
   - What we know: Current `AIProvider` interface has only `generateSubtasks` and `testConnection`
   - What's unclear: Whether to add `estimateTime` as a first-class method or call `generateSubtasks` with a time-estimate prompt
   - Recommendation: Add `estimateTime(title: string, description: string, prompt: string): Promise<number | null>` to the `AIProvider` interface. This keeps the streaming pattern out of estimation (estimation is a single-shot response, not streamed), and both providers (Anthropic + Gemini) can implement non-streaming calls using their existing SDKs.

---

## Sources

### Primary (HIGH confidence)
- Project source: `src/db/database.ts` — Dexie versioned migration pattern confirmed
- Project source: `src/components/list/TaskListItem.tsx` — `departing` state machine confirmed
- Project source: `src/components/task/SubtaskList.tsx` — SubtaskRow structure confirmed
- Project source: `src/types/index.ts` — Task interface confirmed
- Project source: `src/db/hooks.ts` — `useLiveQuery` hook patterns confirmed
- Project source: `src/hooks/useAIProvider.ts` — AI provider abstraction confirmed
- Project source: `src/ai/providers/types.ts` — AIProvider interface confirmed
- Project source: `src/App.tsx` — App-level state, header, ViewMode confirmed
- Project source: `src/utils/categories.ts` — `STATUS_COLORS`, `departing` CSS patterns confirmed

### Secondary (MEDIUM confidence)
- Tailwind CSS 4 docs (via project usage): arbitrary duration values `duration-[1500ms]` confirmed in existing `TaskListItem.tsx`
- Dexie 4 docs (via project usage): `.upgrade(tx => ...)` migration pattern confirmed in `database.ts`

### Tertiary (LOW confidence)
- None — all findings grounded in project source inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json and all source imports
- Architecture: HIGH — patterns derived from existing project conventions
- Pitfalls: HIGH — derived from observed patterns in codebase + known Dexie/React pitfalls
- Open questions: MEDIUM — recommendations are reasoned but not user-validated

**Research date:** 2026-02-23
**Valid until:** 2026-03-25 (stable stack; 30-day window)
