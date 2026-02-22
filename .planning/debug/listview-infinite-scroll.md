---
status: diagnosed
trigger: "Investigate why the list view infinite scroll is limited to dates 2/8 to 3/15 instead of loading more days dynamically"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - CSS layout prevents scrollRef from being a scroll container; IntersectionObserver root is wrong
test: Compared with CalendarGrid which uses the correct pattern
expecting: n/a
next_action: Report diagnosis

## Symptoms

expected: Scrolling to top/bottom extends the date range by 7 days in each direction, infinitely
actual: Date range stays fixed at roughly one extension each direction (2/8 to 3/15, which is initial 2/15-3/8 + one 7-day extension each way)
errors: None
reproduction: Open list view, scroll to top or bottom boundary, observe no extension
started: Likely never worked correctly

## Eliminated

- hypothesis: stale closures in IntersectionObserver callback
  evidence: extendTop/extendBottom use useCallback with [] deps and functional state updates -- both are correct
  timestamp: 2026-02-22

- hypothesis: observer disconnected/recreated unexpectedly
  evidence: deps [extendTop, extendBottom] are stable references, effect runs once
  timestamp: 2026-02-22

- hypothesis: React StrictMode double-invocation breaking observer
  evidence: StrictMode cleanup+re-run creates a fresh observer that should work fine
  timestamp: 2026-02-22

- hypothesis: sentinel DOM nodes replaced on re-render
  evidence: sentinels have stable positions in JSX tree, no key changes, React reuses DOM nodes
  timestamp: 2026-02-22

## Evidence

- timestamp: 2026-02-22
  checked: Date range 2/8-3/15 vs initial window calculation
  found: 2/22 - 7 = 2/15, 2/22 + 14 = 3/8. Then 2/15-7=2/8, 3/8+7=3/15. Range extended exactly once each direction.
  implication: Observer fires once (on mount when sentinels are initially visible) but never fires again on scroll

- timestamp: 2026-02-22
  checked: ListView root div CSS classes (line 101)
  found: "flex-1 relative" -- no overflow property set. Default overflow is "visible".
  implication: As a flex item in a column layout, min-height:auto resolves to content size, so this div grows with content

- timestamp: 2026-02-22
  checked: scrollRef div CSS classes (line 102)
  found: "h-full overflow-y-auto" -- h-full = 100% of parent, which grows with content
  implication: scrollRef height equals content height, so it never overflows and is NOT a scroll container

- timestamp: 2026-02-22
  checked: CalendarGrid root div CSS (comparable view)
  found: "flex-1 overflow-auto" -- overflow directly on the flex item
  implication: CalendarGrid correctly makes its flex item the scroll container (min-height:auto resolves to 0 when overflow != visible)

- timestamp: 2026-02-22
  checked: IntersectionObserver root option (line 84)
  found: root is scrollRef.current, which is not actually a scroll container
  implication: Observer root contains all content without scrolling; sentinels are always "visible" within it

## Resolution

root_cause: The ListView root div (line 101, "flex-1 relative") lacks overflow constraint. In the flex-column layout, this makes it grow to content height (min-height:auto = content size when overflow is visible). The scrollRef child div (line 102, "h-full overflow-y-auto") inherits this inflated height via h-full, so it never actually overflows. Since scrollRef is not a real scroll container, the IntersectionObserver (which uses scrollRef as its root) sees both sentinels as permanently visible -- the observer fires once on mount and never transitions again.
fix: Add "min-h-0" (or "overflow-hidden") to the ListView root div to force it to respect flex allocation rather than growing with content. This makes scrollRef become a true scroll container.
verification:
files_changed: []
