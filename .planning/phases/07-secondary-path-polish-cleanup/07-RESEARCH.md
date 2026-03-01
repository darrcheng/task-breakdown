# Phase 7: Secondary Path Polish + Cleanup - Research

**Researched:** 2026-03-01
**Domain:** React component wiring, settings integration, dead code removal
**Confidence:** HIGH

## Summary

Phase 7 is a focused gap-closure phase with three well-defined changes: (1) wire AI time estimation to inline task creation, (2) connect the keyboard shortcuts toggle to actually disable/enable the keyboard handler, and (3) remove confirmed dead code. All three changes involve modifying existing files with established patterns already used elsewhere in the codebase.

The codebase is mature and all integration points are verified. No new libraries or patterns are needed. The `useTimeEstimate` hook, `useSettings` hook, and fire-and-forget estimation pattern are all already established and working in other components.

**Primary recommendation:** Execute all three changes in a single plan — they are independent, small, and touch different files. No wave parallelization needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Inline create estimation (FLOW-01):** Fire triggerEstimate immediately after db.tasks.add in TaskInlineCreate, same fire-and-forget pattern as TaskModal. Use title-only estimation: pass empty description and default categoryId (0). No minimum title length threshold.
- **Keyboard shortcuts toggle (INT-03):** Toggle should disable all keyboard shortcuts (not just hide visual hints). Rename setting label from "Show Keyboard Shortcuts" to "Enable Keyboard Shortcuts". Guard the useEffect keydown handler in App.tsx with `settings.showKeyboardShortcuts` check.
- **Dead code cleanup (FLOW-02):** Remove TaskInlineEdit.tsx only — strictly scoped to the confirmed dead code. Do not actively sweep for other dead code.

### Claude's Discretion
- Whether to add useTimeEstimate hook directly in TaskInlineCreate or thread triggerEstimate as a prop from DayGroup
- Exact placement of the settings guard in the keydown useEffect (early return vs conditional addEventListener)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADHD-02 | User can see AI-suggested time estimates for tasks | Inline-created tasks currently skip estimation; wiring triggerEstimate closes this gap |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component framework | Already in use |
| Dexie.js | 3.x | IndexedDB wrapper | Already in use for db.tasks.add |
| TypeScript | 5.x | Type safety | Already in use |

### Supporting
No new libraries needed. All three changes use existing hooks and patterns.

## Architecture Patterns

### Pattern 1: Fire-and-Forget Estimation (from TaskModal)
**What:** Call `triggerEstimate()` immediately after `db.tasks.add()` without awaiting
**When to use:** After any task creation path
**Example:**
```typescript
// Source: src/components/task/TaskModal.tsx lines 129-130
const newId = await db.tasks.add({ ...data });
triggerEstimate(newId as number, data.title, data.description, data.categoryId);
```

### Pattern 2: Hook Direct Import (recommended for TaskInlineCreate)
**What:** Import and call `useTimeEstimate()` directly in the component that needs it
**When to use:** When a component already handles task creation internally
**Recommendation:** Add `useTimeEstimate()` directly in TaskInlineCreate rather than threading as prop from DayGroup. This matches the TaskModal pattern where the hook is used in the same component that calls `db.tasks.add()`.
```typescript
// In TaskInlineCreate.tsx
import { useTimeEstimate } from '../../hooks/useTimeEstimate';
// ...
const { triggerEstimate } = useTimeEstimate();
// In handleSubmit, after db.tasks.add:
const newId = await db.tasks.add({ ... });
triggerEstimate(newId as number, title.trim(), '', finalCategoryId);
```

### Pattern 3: Settings Guard on useEffect (recommended placement)
**What:** Early return at the top of the useEffect body
**When to use:** To completely disable a useEffect's event listener
**Recommendation:** Add `if (!settings.showKeyboardShortcuts) return;` as a second guard after the `if (isMobile) return;` check. This is cleaner than wrapping addEventListener conditionally because the cleanup function also needs to match.
```typescript
// In App.tsx keyboard useEffect
useEffect(() => {
  if (isMobile) return;
  if (!settings.showKeyboardShortcuts) return; // NEW: disable all shortcuts

  const handleKeyDown = (e: KeyboardEvent) => { ... };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isMobile, settings.showKeyboardShortcuts, /* ...existing deps */]);
```
**CRITICAL:** `settings.showKeyboardShortcuts` must be added to the dependency array so the effect re-runs when the toggle changes.

### Anti-Patterns to Avoid
- **Threading triggerEstimate as prop from DayGroup:** Adds unnecessary prop drilling when the hook can be used directly. DayGroup doesn't own task creation — TaskInlineCreate does.
- **Conditional addEventListener:** More complex than early return and requires matching conditional cleanup.

## Don't Hand-Roll

No hand-roll risks for this phase — all changes use existing hooks and APIs.

## Common Pitfalls

### Pitfall 1: Missing Dependency Array Update
**What goes wrong:** Adding `settings.showKeyboardShortcuts` guard but forgetting to add it to the useEffect dependency array
**Why it happens:** The existing deps list is already long and easy to miss
**How to avoid:** Add `settings.showKeyboardShortcuts` to the dependency array: `[isMobile, settings.showKeyboardShortcuts, calendarView, viewMode, ...]`
**Warning signs:** Toggle changes state but shortcuts still work/don't work until next unrelated re-render

### Pitfall 2: db.tasks.add Return Type
**What goes wrong:** Assuming `db.tasks.add()` returns a number directly
**Why it happens:** Dexie's `add()` returns `IndexableType` which needs casting
**How to avoid:** Cast with `as number` — same pattern as TaskModal line 130: `newId as number`
**Warning signs:** TypeScript error on triggerEstimate call

### Pitfall 3: Stale categoryId in triggerEstimate
**What goes wrong:** Using state value `categoryId` after the `setCategoryId(0)` reset
**Why it happens:** TaskInlineCreate resets categoryId to 0 after creation for rapid entry
**How to avoid:** Capture `finalCategoryId` before the db.tasks.add call (already done in existing code at line 23) and use it in triggerEstimate call
**Warning signs:** All inline-created tasks get estimated with categoryId 0 instead of selected category

### Pitfall 4: Forgetting to Verify TaskInlineEdit Has No Imports
**What goes wrong:** Deleting a file that's still imported somewhere
**Why it happens:** Assuming dead code without verifying
**How to avoid:** Already verified — `grep -r "TaskInlineEdit" src/` returns only the file itself, no imports
**Warning signs:** Build errors after deletion

## Code Examples

### TaskInlineCreate.tsx — Adding Time Estimation
```typescript
// Source: Verified pattern from src/components/task/TaskModal.tsx
import { useTimeEstimate } from '../../hooks/useTimeEstimate';

export function TaskInlineCreate({ date, onClose }: TaskInlineCreateProps) {
  const { triggerEstimate } = useTimeEstimate();
  // ... existing state ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategoryId = categoryId || 1;

    const newId = await db.tasks.add({
      title: title.trim(),
      description: '',
      date,
      status: 'todo',
      categoryId: finalCategoryId,
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fire-and-forget: estimate from title only
    triggerEstimate(newId as number, title.trim(), '', finalCategoryId);

    setTitle('');
    setCategoryId(0);
    inputRef.current?.focus();
  };
  // ... rest unchanged ...
```

### App.tsx — Settings Guard on Keyboard Handler
```typescript
// Source: Existing pattern in src/App.tsx
useEffect(() => {
  if (isMobile) return;
  if (!settings.showKeyboardShortcuts) return; // Completely disable when OFF

  const handleKeyDown = (e: KeyboardEvent) => {
    // ... existing handler unchanged ...
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isMobile, settings.showKeyboardShortcuts, calendarView, viewMode, modalState.isOpen, isCategoryManagerOpen, isSettingsOpen, isQuickPickerOpen]);
```

### SettingsModal.tsx — Label Rename
```typescript
// Source: src/components/ui/SettingsModal.tsx
// Change heading from "Keyboard shortcuts" to "Keyboard Shortcuts"
// The toggle label "Enabled" already implies functional control
// Add section heading that says "Enable Keyboard Shortcuts"
<h3 className="text-sm font-medium text-slate-700">Enable Keyboard Shortcuts</h3>
```

## Existing File Inventory

| File | Change | Lines Affected |
|------|--------|----------------|
| `src/components/task/TaskInlineCreate.tsx` | Add useTimeEstimate hook + triggerEstimate call | +3 lines (import, hook, call) |
| `src/App.tsx` | Add settings guard + dependency | +2 lines (guard, dep) |
| `src/components/ui/SettingsModal.tsx` | Rename heading text | 1 line change |
| `src/components/task/TaskInlineEdit.tsx` | DELETE entire file | -47 lines |

## Open Questions

None. All three changes are fully understood with verified patterns.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/task/TaskModal.tsx` lines 119-130 — triggerEstimate usage pattern
- Codebase inspection: `src/hooks/useTimeEstimate.ts` — full hook API
- Codebase inspection: `src/App.tsx` lines 61-134 — keyboard handler structure
- Codebase inspection: `src/hooks/useSettings.ts` — settings interface and defaults
- Codebase inspection: `src/components/ui/SettingsModal.tsx` lines 97-109 — toggle UI
- Codebase inspection: `src/components/task/TaskInlineEdit.tsx` — confirmed dead code (zero imports)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all existing code
- Architecture: HIGH - patterns verified from existing codebase
- Pitfalls: HIGH - all pitfalls are straightforward and preventable

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable — internal codebase patterns)
