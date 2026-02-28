# Phase 5: Wire Swipe-Complete to Celebration Pipeline - Research

**Researched:** 2026-02-28
**Domain:** React state coordination, swipe gesture integration, celebration animation pipeline
**Confidence:** HIGH

## Summary

Phase 5 closes two integration gaps: INT-02 (swipe bypasses celebration) and FLOW-03 (missing haptic on swipe). Currently, both `DaySwipeView` and `DayGroup` wire `SwipeableTaskRow.onComplete` to raw `db.tasks.update()`, which immediately marks the task as done and skips the 4-phase departure animation (ring -> fade -> settling -> null) and haptic feedback that `TaskListItem.handleStatusClick` provides.

The fix requires exposing a "trigger completion" mechanism from `TaskListItem` so that when `SwipeableTaskRow`'s green Complete button is tapped, it routes through the same celebration pipeline as the checkbox. The key constraint is that the DB update must NOT happen immediately -- it must go through the 1500ms celebration window with cancel-on-reclick support.

**Primary recommendation:** Add an `onSwipeComplete` callback prop to `TaskListItem` that triggers its internal `handleStatusClick` logic programmatically, or expose a ref-based `triggerComplete()` method. The simplest approach is to lift the completion logic into a shared handler that both checkbox click and swipe-complete invoke.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Swipe-complete taps the green Complete button -> action panel closes -> celebration animation plays on the TaskListItem row (same ring -> fade -> settling -> DB update sequence)
- The DB update must NOT happen immediately on swipe -- it must go through the same delayed pipeline as checkbox (1500ms celebration window before DB write)
- Same cancel mechanism as checkbox: during the 1500ms celebration window, tapping the row cancels and reverts to 'todo'
- No separate undo UI needed -- reuse the existing re-click-to-cancel pattern
- Same 10ms haptic as checkbox -- identical experience regardless of completion method
- One completion gesture = one haptic pattern (consistency over differentiation)
- Full-swipe-to-complete shortcut is NOT in scope -- swipe reveals action buttons only (current behavior)

### Claude's Discretion
- How to refactor the completion logic (extract shared handler vs. callback prop vs. event-based)
- Whether to extract the departure animation state machine from TaskListItem into a reusable hook
- Exact timing of action panel close relative to celebration start

### Deferred Ideas (OUT OF SCOPE)
- Full-swipe-to-complete gesture (swipe all the way through without tapping button) -- future enhancement
- Distinct haptic patterns per gesture type -- not needed for consistency goal
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TASK-07 | Task completion shows satisfying visual/audio feedback | Wiring swipe-complete through the existing departure animation ensures TASK-07 coverage for swipe path |
| ADHD-03 | Completing tasks shows positive celebration animation | Same celebration animation (ring -> fade -> settling) must play regardless of completion method |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18+ | Component framework | Already in use, hooks for state/ref |
| react-swipeable | 7+ | Swipe gesture detection | Already powers SwipeableTaskRow |
| Dexie.js | 3+ | IndexedDB wrapper | Already handles task persistence |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 2+ | Date formatting | Already used in DaySwipeView/DayGroup |
| clsx | 2+ | Conditional classNames | Already used in TaskListItem |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Callback prop on TaskListItem | useImperativeHandle + forwardRef | More coupling, overkill for single method |
| Lifting state to parent | Custom hook | Adds complexity, over-engineers for this scope |

## Architecture Patterns

### Pattern 1: Callback Prop for External Completion Trigger
**What:** Add an `onExternalComplete` callback registration prop to `TaskListItem`. When swipe-complete fires, it calls this registration function which triggers the internal departure animation.
**When to use:** When a parent component needs to trigger internal state changes in a child.
**Why chosen:** Simpler than ref forwarding, follows React's top-down data flow.

**Implementation approach:**
```typescript
// TaskListItem receives a way for parent to trigger completion
interface TaskListItemProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task) => void;
  onRegisterComplete?: (triggerFn: () => void) => void;
}
```

However, the simpler pattern for this case:

### Pattern 2: Swipe Triggers Checkbox Click (Recommended)
**What:** `SwipeableTaskRow.onComplete` calls a function that programmatically triggers TaskListItem's completion logic. The cleanest way is to pass a `triggerComplete` ref callback from TaskListItem to its parent via an `onRegisterComplete` prop, or simply restructure so SwipeableTaskRow doesn't need to know about the animation at all.
**When to use:** When the child already has the complete logic and we just need to invoke it.

**Simplest approach:** Move the completion trigger to the parent. Instead of SwipeableTaskRow calling `db.tasks.update` directly, it calls a completion handler that was already wired to trigger TaskListItem's departure animation.

The cleanest pattern:
1. `TaskListItem` exposes `triggerComplete()` via a ref callback prop
2. Parent captures the ref
3. `SwipeableTaskRow.onComplete` calls `triggerComplete()` instead of raw DB update
4. `SwipeableTaskRow` action panel closes (setRevealed(false), setSwipeOffset(0)) before/as celebration starts

```typescript
// In TaskListItem: expose triggerComplete
const triggerComplete = useCallback(() => {
  if (!task.id || departing) return;
  const nextStatus = getNextStatus(task.status);
  if (nextStatus === 'done') {
    setDepartingPhase('ring');
    setDisplayStatus('done');
    hapticFeedback(10);
    departureTimeout.current = setTimeout(async () => {
      departureTimeout.current = null;
      setDepartingPhase('settling');
      settlingTimeout.current = setTimeout(async () => {
        settlingTimeout.current = null;
        setDepartingPhase(null);
        await db.tasks.update(task.id!, {
          status: 'done',
          updatedAt: new Date(),
        });
      }, 400);
    }, 1500);
  }
}, [task.id, task.status, departing]);

// Notify parent when triggerComplete is available
useEffect(() => {
  onRegisterComplete?.(triggerComplete);
}, [onRegisterComplete, triggerComplete]);
```

### Anti-Patterns to Avoid
- **Direct DB update in swipe handler:** This is the current bug. Bypasses celebration entirely.
- **Duplicating departure animation logic:** Don't copy the animation state machine into DaySwipeView/DayGroup. Reuse TaskListItem's existing logic.
- **Using DOM events for component communication:** Custom DOM events add indirection; callback props are cleaner for parent-child communication.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Departure animation state machine | Second copy in DaySwipeView | TaskListItem's existing implementation | Single source of truth, already tested through Phase 3 |
| Haptic feedback | Direct navigator.vibrate calls | hapticFeedback() from utils/haptics.ts | Handles browser compat, already imported in TaskListItem |
| Swipe gesture detection | Custom touch handlers | react-swipeable (already used) | SwipeableTaskRow already handles reveal/hide |

**Key insight:** The entire celebration pipeline already exists in TaskListItem. The only work is wiring the swipe Complete button to trigger it.

## Common Pitfalls

### Pitfall 1: Stale Closure in triggerComplete
**What goes wrong:** The `triggerComplete` callback captures stale `task.status` or `departing` values
**Why it happens:** React closures capture values at render time; if task status changes between registration and invocation, the check may fail
**How to avoid:** Use `useCallback` with proper dependency array; or use refs for values that change frequently
**Warning signs:** Swipe-complete works first time but fails after status cycles

### Pitfall 2: SwipeableTaskRow Panel Stays Open During Animation
**What goes wrong:** The green Complete button is still visible while the ring animation plays
**Why it happens:** `handleComplete` in SwipeableTaskRow calls `setRevealed(false)` but the parent might not close the panel before triggering animation
**How to avoid:** Ensure SwipeableTaskRow's `handleComplete` closes the panel (setRevealed(false), setSwipeOffset(0)) BEFORE (or simultaneously with) triggering the celebration. The current implementation already does this.
**Warning signs:** Action buttons visible during celebration animation

### Pitfall 3: Double Completion on Fast Tap
**What goes wrong:** User taps Complete button twice quickly, queuing two departure animations
**Why it happens:** No guard against triggering completion while already departing
**How to avoid:** The `departing` guard in `triggerComplete` prevents this -- check `if (departing) return;`
**Warning signs:** Multiple haptic pulses, corrupted animation state

### Pitfall 4: Cancel-on-Reclick Not Working for Swipe-Completed Tasks
**What goes wrong:** Re-clicking a task during swipe-triggered celebration doesn't cancel
**Why it happens:** If the completion is triggered correctly through TaskListItem's existing handleStatusClick logic path, cancel works. But if a separate code path handles the swipe completion, it might not integrate with the cancel mechanism.
**How to avoid:** Ensure swipe-complete goes through the SAME code path as checkbox complete (reuse the exact same function). Don't create a parallel path.
**Warning signs:** Tapping row during swipe-triggered animation doesn't revert to 'todo'

### Pitfall 5: Task Already Done — Swipe Complete on Completed Task
**What goes wrong:** SwipeableTaskRow shows Complete button for already-done tasks
**Why it happens:** `isCompleted` prop not properly set
**How to avoid:** `isCompleted={task.status === 'done'}` is already passed in both DaySwipeView and DayGroup. Verify this also accounts for `displayStatus` during departure.
**Warning signs:** Complete button appears on already-done tasks

## Code Examples

### Current Code to Modify

**DaySwipeView** (`src/components/mobile/DaySwipeView.tsx:71-93`):
```typescript
// CURRENT (bypasses celebration):
<SwipeableTaskRow
  key={task.id}
  onComplete={async () => {
    if (task.id) {
      await db.tasks.update(task.id, { status: 'done', updatedAt: new Date() });
    }
  }}
  onDelete={async () => {
    if (task.id) await db.tasks.delete(task.id);
  }}
  isCompleted={task.status === 'done'}
>
  <TaskListItem task={task} categoryMap={categoryMap} onClick={() => onTaskClick(task)} />
</SwipeableTaskRow>
```

**DayGroup** (`src/components/list/DayGroup.tsx:87-109`):
```typescript
// CURRENT (bypasses celebration):
<SwipeableTaskRow
  onComplete={async () => {
    if (task.id) {
      await db.tasks.update(task.id, { status: 'done', updatedAt: new Date() });
    }
  }}
  onDelete={async () => {
    if (task.id) await db.tasks.delete(task.id);
  }}
  isCompleted={task.status === 'done'}
>
  <TaskListItem task={task} categoryMap={categoryMap} onClick={onTaskClick} />
</SwipeableTaskRow>
```

### Target Pattern

```typescript
// TaskListItem.tsx — add onRegisterComplete prop
interface TaskListItemProps {
  task: Task;
  categoryMap?: Map<number, Category>;
  onClick?: (task: Task) => void;
  onRegisterComplete?: (triggerFn: () => void) => void;
}

// Extract completion logic into reusable function
const triggerComplete = useCallback(() => {
  if (!task.id || departing) return;
  if (getNextStatus(task.status) === 'done') {
    setDepartingPhase('ring');
    setDisplayStatus('done');
    hapticFeedback(10);
    departureTimeout.current = setTimeout(async () => { /* same as handleStatusClick */ }, 1500);
  }
}, [task.id, task.status, departing]);

useEffect(() => { onRegisterComplete?.(triggerComplete); }, [onRegisterComplete, triggerComplete]);
```

```typescript
// DaySwipeView.tsx / DayGroup.tsx — capture triggerComplete ref
// Use useRef map or per-task ref to store triggerComplete functions
const completeRefs = useRef<Map<number, () => void>>(new Map());

<SwipeableTaskRow
  onComplete={() => { completeRefs.current.get(task.id!)?.(); }}
  onDelete={async () => { if (task.id) await db.tasks.delete(task.id); }}
  isCompleted={task.status === 'done'}
>
  <TaskListItem
    task={task}
    categoryMap={categoryMap}
    onClick={() => onTaskClick(task)}
    onRegisterComplete={(fn) => { if (task.id) completeRefs.current.set(task.id, fn); }}
  />
</SwipeableTaskRow>
```

## Open Questions

1. **Action panel close timing relative to celebration start**
   - What we know: SwipeableTaskRow.handleComplete already calls setRevealed(false) + setSwipeOffset(0) before calling onComplete()
   - What's unclear: Whether the panel close animation (200ms transition) overlaps visually with the ring animation start
   - Recommendation: Accept the overlap — the 200ms panel slide is fast enough that it resolves before the 1500ms ring phase completes. No special coordination needed.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: TaskListItem.tsx, SwipeableTaskRow.tsx, DaySwipeView.tsx, DayGroup.tsx, haptics.ts
- Phase 3 and Phase 4 decisions from STATE.md documenting the departure animation pattern

### Secondary (MEDIUM confidence)
- React hooks documentation for useCallback/useEffect patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - direct codebase analysis, clear integration points
- Pitfalls: HIGH - identified from existing codebase patterns and Phase 3 gap closure history

**Research date:** 2026-02-28
**Valid until:** N/A (codebase-specific, not library-dependent)
