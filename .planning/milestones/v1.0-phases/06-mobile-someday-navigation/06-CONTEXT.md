# Phase 6: Mobile Someday Navigation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing SomedayView accessible on mobile via BottomTabBar. The SomedayView component already exists and works on desktop (via `viewMode === 'someday'` and keyboard shortcut `s`). This phase adds the mobile navigation path — a 4th tab in BottomTabBar that switches to SomedayView.

</domain>

<decisions>
## Implementation Decisions

### Tab bar layout
- 4 equal tabs: Calendar | List | Someday | Settings
- Evenly spaced at ~25% width each
- Tab order: views first (Calendar, List, Someday), utility last (Settings)

### Tab icon and label
- Icon: Archive (matches the Archive icon already used in SomedayView's header)
- Label: "Someday" (matches existing terminology in SomedayView header and TaskForm's "Save for Someday" button)

### Someday view mobile adaptation
- Reduce padding from px-6 to px-4 on mobile for tighter fit
- DatePicker expands inline below task row (same as desktop) — no BottomSheet needed
- No + button to add tasks from SomedayView — users send tasks via "Save for Someday" in TaskForm
- No badge/count on the Someday tab — low-pressure parking lot, badge creates urgency counter to ADHD-friendly design

### Claude's Discretion
- Exact touch target sizing for SomedayTaskRow action buttons on mobile
- Whether max-w-2xl constraint should be removed on mobile or kept
- Any responsive breakpoint adjustments for SomedayView internals

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SomedayView` (src/components/overdue/SomedayView.tsx): Fully built, renders task list with rescue (DatePicker) and delete actions. Just needs mobile padding adjustment.
- `BottomTabBar` (src/components/mobile/BottomTabBar.tsx): Typed `MobileTab` union, TABS array of {id, icon, label}. Adding a tab = extend union + add array entry.
- `MobileLayout` (src/components/mobile/MobileLayout.tsx): Wraps content with header + BottomTabBar. Already handles tab switching via `onTabChange`.
- `useSomedayTasks` (src/db/hooks.ts): Dexie liveQuery hook for Someday tasks. Already used by SomedayView.

### Established Patterns
- `MobileTab` type union drives tab rendering and active state
- `handleMobileTabChange` in App.tsx maps tabs to viewMode/settings state
- `activeMobileTab` derived from `viewMode` for BottomTabBar highlight
- SomedayView already rendered conditionally: `viewMode === 'someday' ? <SomedayView> : ...`

### Integration Points
- `MobileTab` type: extend from `'calendar' | 'list' | 'settings'` to include `'someday'`
- `handleMobileTabChange` in App.tsx: add `'someday'` case → `setViewMode('someday')`
- `activeMobileTab` derivation: map `viewMode === 'someday'` to `'someday'` tab (currently maps to `'list'`)
- Mobile render branch in App.tsx: SomedayView already conditionally rendered

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the SomedayView is already built and just needs a navigation path on mobile. The implementation is straightforward: extend the tab type, add the tab, wire the handler.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-mobile-someday-navigation*
*Context gathered: 2026-03-01*
