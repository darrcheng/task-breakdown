# Phase 5: Wire Swipe-Complete to Celebration Pipeline - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the swipe-to-complete action (in both DaySwipeView and DayGroup) through TaskListItem's existing 4-phase departure animation and haptic feedback, so completion via swipe is visually and haptically identical to completion via checkbox.

Closes INT-02 (swipe bypasses celebration) and FLOW-03 (missing haptic on swipe).

</domain>

<decisions>
## Implementation Decisions

### Completion trigger coordination
- Swipe-complete taps the green Complete button → action panel closes → celebration animation plays on the TaskListItem row (same ring → fade → settling → DB update sequence)
- The DB update must NOT happen immediately on swipe — it must go through the same delayed pipeline as checkbox (1500ms celebration window before DB write)

### Cancel/undo behavior
- Same cancel mechanism as checkbox: during the 1500ms celebration window, tapping the row cancels and reverts to 'todo'
- No separate undo UI needed — reuse the existing re-click-to-cancel pattern

### Haptic pattern
- Same 10ms haptic as checkbox — identical experience regardless of completion method
- One completion gesture = one haptic pattern (consistency over differentiation)

### Full-swipe shortcut
- Not in scope — swipe reveals action buttons only (current behavior)
- Full-swipe-to-complete would be a separate enhancement for a future phase

### Claude's Discretion
- How to refactor the completion logic (extract shared handler vs. callback prop vs. event-based)
- Whether to extract the departure animation state machine from TaskListItem into a reusable hook
- Exact timing of action panel close relative to celebration start

</decisions>

<specifics>
## Specific Ideas

- Celebration must be identical whether triggered by checkbox or swipe — this is the core success criterion
- The existing departure animation in TaskListItem (ring → double-rAF → fade → settling) should be reused as-is, not reimplemented

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TaskListItem` (src/components/list/TaskListItem.tsx): Contains the full 4-phase departure animation (ring → fade → settling → null) with haptic, DB delay, and cancel-on-reclick
- `hapticFeedback()` (src/utils/haptics.ts): Simple vibration utility, already imported in TaskListItem
- `SwipeableTaskRow` (src/components/mobile/SwipeableTaskRow.tsx): Wraps rows with swipe-to-reveal Complete/Delete buttons

### Established Patterns
- Departure animation uses `departingPhase` state ('ring' | 'fade' | 'settling' | null) with double-rAF for paint guarantee
- DB update is deferred 1500ms (ring) + 400ms (settling) after visual completion starts
- Cancel-on-reclick: re-clicking during departure clears timeouts and reverts to 'todo'

### Integration Points
- `DaySwipeView` (src/components/mobile/DaySwipeView.tsx:73-79): SwipeableTaskRow onComplete does raw `db.tasks.update` — needs to route through celebration pipeline instead
- `DayGroup` (src/components/list/DayGroup.tsx:89-96): Same pattern on mobile — SwipeableTaskRow onComplete does raw DB update
- Both locations need their `onComplete` handler to trigger TaskListItem's departure animation rather than directly updating the DB

</code_context>

<deferred>
## Deferred Ideas

- Full-swipe-to-complete gesture (swipe all the way through without tapping button) — future enhancement
- Distinct haptic patterns per gesture type — not needed for consistency goal

</deferred>

---

*Phase: 05-swipe-complete-celebration-pipeline*
*Context gathered: 2026-02-28*
