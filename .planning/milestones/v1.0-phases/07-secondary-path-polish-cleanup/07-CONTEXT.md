# Phase 7: Secondary Path Polish + Cleanup - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three specific gap closures: (1) wire AI time estimation to inline task creation, (2) connect the keyboard shortcuts toggle to the actual keyboard handler, (3) remove TaskInlineEdit dead code. No new features — only connecting existing wiring and removing dead code.

</domain>

<decisions>
## Implementation Decisions

### Inline create estimation (FLOW-01)
- Fire triggerEstimate immediately after db.tasks.add in TaskInlineCreate, same fire-and-forget pattern as TaskModal
- Use title-only estimation: pass empty description and default categoryId (0) — AI can still provide a useful estimate from just the title
- No minimum title length threshold — estimate for all inline-created tasks

### Keyboard shortcuts toggle (INT-03)
- Toggle should disable all keyboard shortcuts (not just hide visual hints) — when OFF, the global keydown handler in App.tsx is completely disabled
- Rename setting label from "Show Keyboard Shortcuts" to "Enable Keyboard Shortcuts" to reflect functional control vs visual display
- Guard the useEffect keydown handler in App.tsx with `settings.showKeyboardShortcuts` check

### Dead code cleanup (FLOW-02)
- Remove TaskInlineEdit.tsx only — strictly scoped to the confirmed dead code
- Do not actively sweep for other dead code (keep phase tight and focused)

### Claude's Discretion
- Whether to add useTimeEstimate hook directly in TaskInlineCreate or thread triggerEstimate as a prop from DayGroup
- Exact placement of the settings guard in the keydown useEffect (early return vs conditional addEventListener)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTimeEstimate` hook (src/hooks/useTimeEstimate.ts): Fire-and-forget triggerEstimate(taskId, title, description, categoryId). Already used in TaskModal.
- `useSettings` hook (src/hooks/useSettings.ts): Returns `settings.showKeyboardShortcuts` boolean. Already wired to SettingsModal toggle.
- `TaskInlineCreate` (src/components/task/TaskInlineCreate.tsx): Inline quick-add form in DayGroup. Creates tasks via db.tasks.add. No estimation wiring currently.

### Established Patterns
- TaskModal calls `triggerEstimate(newId, data.title, data.description, data.categoryId)` right after `db.tasks.add()` — same pattern should apply to TaskInlineCreate
- `useSettings()` already called in App.tsx — `settings` object available in the keyboard handler scope
- Fire-and-forget pattern: `triggerEstimate` is intentionally not awaited, caller never blocks

### Integration Points
- TaskInlineCreate: add `useTimeEstimate()` hook, call `triggerEstimate` after `db.tasks.add` with the returned ID
- App.tsx keyboard useEffect: add `settings.showKeyboardShortcuts` to the guard condition
- SettingsModal: rename label text from "Show Keyboard Shortcuts" to "Enable Keyboard Shortcuts"
- TaskInlineEdit.tsx: delete file entirely (no imports reference it)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all three changes are well-defined wiring/cleanup tasks with clear implementation paths already established in the codebase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-secondary-path-polish-cleanup*
*Context gathered: 2026-03-01*
