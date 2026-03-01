---
phase: 03-adhd-optimized-ux
plan: 03
subsystem: ai-estimation, task-ui
tags: [time-estimation, ai-background, calibration, task-card-badge, modal-override]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [estimateTime-AIProvider, useTimeEstimate-hook, estimate-badge-TaskCard, estimate-override-TaskModal, estimateCalibration-util]
  affects: [src/ai/providers/types.ts, src/ai/providers/anthropic.ts, src/ai/providers/gemini.ts, src/ai/prompts.ts, src/utils/estimateCalibration.ts, src/hooks/useTimeEstimate.ts, src/components/task/TaskCard.tsx, src/components/task/TaskModal.tsx]
tech_stack:
  added: []
  patterns: [fire-and-forget-hook, AbortController-cancellation, localStorage-calibration-map]
key_files:
  created:
    - src/utils/estimateCalibration.ts
    - src/hooks/useTimeEstimate.ts
  modified:
    - src/ai/providers/types.ts
    - src/ai/providers/anthropic.ts
    - src/ai/providers/gemini.ts
    - src/ai/prompts.ts
    - src/components/task/TaskCard.tsx
    - src/components/task/TaskModal.tsx
decisions:
  - "estimateTime is non-streaming — single call returning {minutes: N} JSON for cost efficiency on simple task"
  - "triggerEstimate uses AbortController ref to cancel stale in-flight requests on hook instance"
  - "Estimate triggered on create always; on edit only when title changes — avoids wasteful re-estimation"
  - "Override saves timeEstimateOverride to DB and records calibration entry for future AI context"
  - "effectiveEstimate = timeEstimateOverride ?? timeEstimate — user override takes precedence everywhere"
metrics:
  duration: ~3 min
  completed: 2026-02-23
  tasks: 2
  files: 8
---

# Phase 03 Plan 03: AI-Powered Time Estimation Summary

**One-liner:** Background AI time estimation with calibration learning — estimates generate after task save, display as badge on TaskCard, and support manual override in TaskModal.

## What Was Built

### Task 1: Add estimateTime to AIProvider interface, implement in both providers, create prompt and calibration utils

Extended the `AIProvider` interface with a new non-streaming method:
```typescript
estimateTime(taskTitle: string, taskDescription: string, calibrationHint: string): Promise<number | null>
```

Added `buildTimeEstimatePrompt` to `src/ai/prompts.ts` — constrains AI output to `{"minutes": N}` JSON with a fixed rounding set (5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240).

**AnthropicProvider.estimateTime:** Non-streaming `messages.create` with `max_tokens: 50`, parses JSON response with markdown code fence stripping. Returns null on any parse failure.

**GeminiProvider.estimateTime:** `ai.models.generateContent` using `this.model` (respects user's selected Gemini model). Same JSON parse + strip logic.

Created `src/utils/estimateCalibration.ts` with localStorage key `taskbreaker-estimate-calibration`:
- `recordCalibration(categoryId, aiEstimate, userOverride)` — appends entry, trims to last 50
- `getCalibrationHint(categoryId)` — computes per-category average AI vs user times, returns hint string
- `formatEstimate(minutes)` — "15m", "1.5h", "2h" display format

### Task 2: Create useTimeEstimate hook, add estimate badge to TaskCard, add estimate display and override to TaskModal

**`src/hooks/useTimeEstimate.ts`:** Fire-and-forget hook returning `{ triggerEstimate }`. Uses `AbortController` ref to cancel stale requests, calls `getProvider()`, writes result to `db.tasks.update(taskId, { timeEstimate: result })`. Never throws — errors logged to console only.

**TaskCard estimate badge:** Computes `effectiveEstimate = task.timeEstimateOverride ?? task.timeEstimate`. Renders `~{formatEstimate(effectiveEstimate)}` in `text-[10px] text-slate-400` after the energy badge.

**TaskModal estimate display + override:**
- Shows `Clock` icon + formatted estimate with "(overridden)" label when user has set an override
- Pencil icon opens inline `number` input (step=5, min=5, max=480) pre-filled with current estimate
- On blur or Enter: saves `timeEstimateOverride` to DB, calls `recordCalibration` for future AI context
- Escape dismisses without saving
- Estimate triggered on task create (always) and on edit (only when title changes)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `8ee1f40` | feat(03-03): add estimateTime to AIProvider interface, implement in both providers, create prompt and calibration utils |
| 2 | `858dd34` | feat(03-03): create useTimeEstimate hook, add estimate badge to TaskCard, add estimate display and override to TaskModal |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused onClose parameter on OverdueTaskRow**
- **Found during:** Task 2 — `npm run build` failed with `TS6133: 'onClose' is declared but its value is never read`
- **Issue:** `OverdueTaskRow` declared `onClose: () => void` in its props but never called it (pre-existing from Phase 03 Plan 02). TypeScript strict mode (`tsc -b`) caught it during build.
- **Fix:** Removed `onClose` from `OverdueTaskRow`'s props type. Call site already didn't pass it (linter had already partially fixed this).
- **Files modified:** `src/components/overdue/OverdueQuickPicker.tsx`
- **Commit:** Included in `858dd34`

## Verification

- `npx tsc --noEmit`: PASSED (0 errors)
- `npm run build`: PASSED (4.01s, pre-existing chunk size warning)
- AIProvider.estimateTime on interface and both providers: CONFIRMED
- buildTimeEstimatePrompt in prompts.ts: CONFIRMED
- estimateCalibration.ts exports recordCalibration, getCalibrationHint, formatEstimate: CONFIRMED
- useTimeEstimate hook with triggerEstimate: CONFIRMED
- TaskCard shows estimate badge: CONFIRMED
- TaskModal shows estimate display with Pencil override: CONFIRMED
- triggerEstimate called in handleSubmit (create + edit-title-change): CONFIRMED

## Self-Check: PASSED

Files confirmed present:
- `src/ai/providers/types.ts` — contains `estimateTime`
- `src/ai/providers/anthropic.ts` — contains `estimateTime`
- `src/ai/providers/gemini.ts` — contains `estimateTime`
- `src/ai/prompts.ts` — contains `buildTimeEstimatePrompt`
- `src/utils/estimateCalibration.ts` — contains `getCalibrationHint`, `recordCalibration`, `formatEstimate`
- `src/hooks/useTimeEstimate.ts` — contains `useTimeEstimate`
- `src/components/task/TaskCard.tsx` — contains `effectiveEstimate`, `formatEstimate`
- `src/components/task/TaskModal.tsx` — contains `triggerEstimate`, `Clock`, `Pencil`, override logic

Commits confirmed: `8ee1f40`, `858dd34`
