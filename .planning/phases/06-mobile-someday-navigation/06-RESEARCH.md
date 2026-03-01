# Phase 6: Mobile Someday Navigation - Research

**Researched:** 2026-03-01
**Domain:** React mobile navigation / BottomTabBar extension
**Confidence:** HIGH

## Summary

Phase 6 is a focused gap closure that makes the existing SomedayView reachable on mobile. The SomedayView component is fully built and renders correctly — it just lacks a navigation path on mobile because BottomTabBar only has 3 tabs (Calendar, List, Settings) and the `activeMobileTab` derivation currently maps `viewMode === 'someday'` to `'list'` instead of its own tab.

The implementation requires exactly 4 code changes across 2 files: extend the `MobileTab` type union, add a tab entry to the TABS array, add a `'someday'` case to `handleMobileTabChange`, and fix the `activeMobileTab` derivation. The SomedayView already renders conditionally in the mobile layout when `viewMode === 'someday'`, so no new component rendering logic is needed.

**Primary recommendation:** Extend BottomTabBar's MobileTab type and TABS array, then wire the tab change handler and active derivation in App.tsx. Adjust SomedayView padding from px-6 to px-4 on mobile for better fit.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 4 equal tabs: Calendar | List | Someday | Settings
- Evenly spaced at ~25% width each
- Tab order: views first (Calendar, List, Someday), utility last (Settings)
- Icon: Archive (matches the Archive icon already used in SomedayView's header)
- Label: "Someday" (matches existing terminology in SomedayView header and TaskForm's "Save for Someday" button)
- Reduce padding from px-6 to px-4 on mobile for tighter fit
- DatePicker expands inline below task row (same as desktop) — no BottomSheet needed
- No + button to add tasks from SomedayView — users send tasks via "Save for Someday" in TaskForm
- No badge/count on the Someday tab — low-pressure parking lot, badge creates urgency counter to ADHD-friendly design

### Claude's Discretion
- Exact touch target sizing for SomedayTaskRow action buttons on mobile
- Whether max-w-2xl constraint should be removed on mobile or kept
- Any responsive breakpoint adjustments for SomedayView internals

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAT-02 | App works on mobile (iOS and Android) | SomedayView currently unreachable on mobile; adding Someday tab closes this gap |
| ADHD-04 | Overdue tasks show gentle reschedule prompts (not guilt) | SomedayView contains gentle rescue/reschedule actions; mobile tab makes these accessible on mobile |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in project |
| lucide-react | latest | Icons (Archive) | Already used for all icons in project |
| clsx | latest | Conditional classnames | Already used in BottomTabBar |
| Tailwind CSS | 4 | Styling | Already in project |

### Supporting
No new libraries needed. All changes use existing project dependencies.

### Alternatives Considered
None — this is an extension of existing code patterns, not a new feature requiring library choices.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Current BottomTabBar Pattern
```
src/components/mobile/BottomTabBar.tsx
├── MobileTab type union (drives tab rendering and active state)
├── TABS array (id, icon, label — declarative tab config)
└── BottomTabBar component (maps TABS to buttons)
```

### Pattern 1: Tab Extension Pattern
**What:** Add a new tab by extending MobileTab type + TABS array + handler
**When to use:** Any time a new mobile navigation target is needed
**Example:**
```typescript
// BottomTabBar.tsx — extend type and array
export type MobileTab = 'calendar' | 'list' | 'someday' | 'settings';

const TABS: { id: MobileTab; icon: typeof Calendar; label: string }[] = [
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'list', icon: List, label: 'List' },
  { id: 'someday', icon: Archive, label: 'Someday' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];
```

### Pattern 2: Tab-to-ViewMode Mapping in App.tsx
**What:** handleMobileTabChange maps tab IDs to state changes; activeMobileTab derives tab from state
**When to use:** Every tab must have both a forward mapping (tab -> state) and reverse mapping (state -> tab)
**Example:**
```typescript
// App.tsx — forward mapping
const handleMobileTabChange = (tab: MobileTab) => {
  if (tab === 'settings') {
    setIsSettingsOpen(true);
  } else if (tab === 'someday') {
    setViewMode('someday');
  } else {
    setViewMode(tab as ViewMode);
  }
};

// App.tsx — reverse mapping
const activeMobileTab: MobileTab = isSettingsOpen
  ? 'settings'
  : viewMode === 'someday'
    ? 'someday'
    : viewMode === 'list'
      ? 'list'
      : 'calendar';
```

### Anti-Patterns to Avoid
- **Badge on Someday tab:** Creates urgency counter to ADHD-friendly design. User explicitly prohibited this.
- **BottomSheet for DatePicker:** DatePicker already expands inline on desktop and should do same on mobile. No BottomSheet abstraction needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation | Custom tab state management | Existing MobileTab pattern | Pattern is already established and works |

**Key insight:** This phase extends existing patterns, not builds new ones. The BottomTabBar, MobileLayout, and tab handler infrastructure already exist and work correctly.

## Common Pitfalls

### Pitfall 1: Forgetting activeMobileTab Reverse Mapping
**What goes wrong:** Tab highlights incorrectly — Someday tab never shows as active because `activeMobileTab` maps `viewMode === 'someday'` to `'list'`
**Why it happens:** The current code has this exact bug: `viewMode === 'someday' || viewMode === 'list' ? 'list'`
**How to avoid:** Update the ternary chain to check for `'someday'` before the `'list'` fallback
**Warning signs:** Tapping Someday tab shows SomedayView but List tab stays highlighted

### Pitfall 2: Tab Type Not Updated in All Import Sites
**What goes wrong:** TypeScript errors if MobileTab type is used elsewhere with old union
**Why it happens:** MobileTab is imported in App.tsx and MobileLayout.tsx
**How to avoid:** Change type at source (BottomTabBar.tsx) — imports resolve automatically since it's `export type`
**Warning signs:** TypeScript compile errors after changing BottomTabBar

### Pitfall 3: SomedayView px-6 Padding Too Wide on Mobile
**What goes wrong:** Content area has excessive horizontal padding on small screens
**Why it happens:** SomedayView was designed for desktop where px-6 (24px) is appropriate
**How to avoid:** Use responsive padding: `px-4 sm:px-6` or just change to px-4 since SomedayView is primarily a mobile target now
**Warning signs:** Visual cramping or excessive whitespace on mobile

### Pitfall 4: Settings Tab Case Handling
**What goes wrong:** Tapping 'someday' tab opens settings instead of SomedayView
**Why it happens:** Current handleMobileTabChange casts non-settings tabs directly to ViewMode. 'someday' IS a valid ViewMode, so `setViewMode(tab as ViewMode)` works. But explicitly handling it is cleaner.
**How to avoid:** The existing `else { setViewMode(tab as ViewMode) }` actually handles 'someday' correctly since 'someday' is already a valid ViewMode. But explicit handling is more readable.
**Warning signs:** None if using existing pattern; but explicit is better.

## Code Examples

### Current Code: BottomTabBar.tsx (lines 1-41)
```typescript
import { Calendar, List, Settings } from 'lucide-react';
import clsx from 'clsx';

export type MobileTab = 'calendar' | 'list' | 'settings';

const TABS: { id: MobileTab; icon: typeof Calendar; label: string }[] = [
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'list', icon: List, label: 'List' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];
```

### Current Code: App.tsx handleMobileTabChange (lines 162-168)
```typescript
const handleMobileTabChange = (tab: MobileTab) => {
  if (tab === 'settings') {
    setIsSettingsOpen(true);
  } else {
    setViewMode(tab as ViewMode);
  }
};
```

### Current Code: App.tsx activeMobileTab (lines 171-175)
```typescript
const activeMobileTab: MobileTab = isSettingsOpen
  ? 'settings'
  : viewMode === 'someday' || viewMode === 'list'
    ? 'list'
    : 'calendar';
```

### Current Code: SomedayView padding (line 85)
```typescript
<div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl mx-auto w-full">
```

## State of the Art

No technology changes relevant — this phase uses only existing project patterns.

## Open Questions

1. **max-w-2xl on SomedayView for mobile**
   - What we know: Desktop uses max-w-2xl (672px) which is fine on wide screens
   - What's unclear: Whether to keep or remove on mobile (Claude's Discretion area)
   - Recommendation: Keep max-w-2xl — it has no effect on mobile since mobile screens are < 672px anyway. No change needed.

2. **Touch target sizing for SomedayTaskRow buttons**
   - What we know: Current buttons use p-1.5 with w-4 h-4 icons (total ~28px)
   - What's unclear: Whether 28px is enough for mobile touch targets (44px recommended by Apple HIG)
   - Recommendation: Increase to p-2.5 for ~36px touch targets, or p-3 for ~40px. Good enough for a parking lot view.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: src/components/mobile/BottomTabBar.tsx — current MobileTab type and TABS array
- Codebase analysis: src/App.tsx — handleMobileTabChange and activeMobileTab patterns
- Codebase analysis: src/components/overdue/SomedayView.tsx — current rendering and padding
- Codebase analysis: src/components/mobile/MobileLayout.tsx — layout wrapper structure

### Secondary (MEDIUM confidence)
- None needed — pure codebase extension

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, pure extension of existing code
- Architecture: HIGH - patterns are already established in the codebase
- Pitfalls: HIGH - identified from direct code analysis of current behavior

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable — no external dependency changes)
