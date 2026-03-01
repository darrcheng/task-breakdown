# Plan 02-03 Summary: Breakdown Flow — Button, Streaming, Review

**Status:** Complete
**Duration:** ~8 min

## What was built

Built the core AI task breakdown feature: the "Break it down" button, streaming subtask generation with a state-machine hook, and the review-before-accept flow with edit, reorder, pin, and remove capabilities using dnd-kit sortable.

## Key files

### Created
- `src/hooks/useBreakdown.ts` — State machine hook: idle→configuring→generating→reviewing→accepting. Manages streaming generation, edit/remove/reorder/pin operations, accept (bulkAdd to Dexie), and regeneration with pinned preservation.
- `src/components/task/BreakdownButton.tsx` — Blue "Break it down" button with Sparkles icon, loading spinner, depth guard (hidden at depth >= 3), level indicator for nested tasks.
- `src/components/task/SortableSubtaskItem.tsx` — dnd-kit sortable row with drag handle (GripVertical), inline title/description editing, pin toggle (Pin icon, filled when active), remove button (X icon), removed items shown with strikethrough.
- `src/components/task/SubtaskReview.tsx` — DndContext + SortableContext wrapper. Shows generating indicator while streaming, full action bar in review state: Accept All, Regenerate (with pinned count), Cancel.

### Modified
- `src/components/task/TaskModal.tsx` — Major rewrite: integrated useBreakdown hook, BreakdownButton below form, SubtaskReview panel during generation/review, ProviderSetupModal overlay for first-use, parent↔subtask navigation with back breadcrumb, live task refresh via useLiveQuery.

## Decisions

- Used `stateRef` pattern (useRef synced with useEffect) to avoid stale closure issues in `acceptSubtasks` and `regenerateSubtasks` callbacks
- Regeneration uses dynamic import of `buildRegenerationPrompt` to reuse the prompts module
- Subtask review uses the same DndContext pattern as existing drag-to-reschedule (PointerSensor + KeyboardSensor)
- Modal width/height increased to 420/700 to accommodate the review panel

## Self-Check: PASSED
- TypeScript compiles clean (`npx tsc --noEmit`)
- Build succeeds (`npm run build`)
- All 4 new files created, TaskModal modified
- State machine transitions verified: idle→generating→reviewing→accepting→idle
