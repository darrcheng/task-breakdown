---
phase: 03-adhd-optimized-ux
plan: 09
subsystem: ai-provider, task-forms
tags: [bug-fix, gemma, ai-breakdown, inline-create, sticky-buttons]
requirements: [TASK-07, ADHD-01]

dependency-graph:
  requires: []
  provides: [gemma-ai-breakdown, inline-create-submission, sticky-form-actions]
  affects: [src/ai/providers/gemini.ts, src/components/task/TaskInlineCreate.tsx, src/components/task/TaskForm.tsx]

tech-stack:
  added: []
  patterns:
    - Gemma-conditional API call: prepend system prompt to user message instead of systemInstruction config
    - form.requestSubmit() for explicit cross-browser form submission trigger
    - sticky bottom-0 with negative margin extension (-mx-6 px-6) for full-width sticky bar inside padded container

key-files:
  modified:
    - src/ai/providers/gemini.ts
    - src/components/task/TaskInlineCreate.tsx
    - src/components/task/TaskForm.tsx

decisions:
  - isGemmaModel() helper using model.startsWith('gemma-') centralizes Gemma detection for reuse in generateSubtasks and testConnection
  - form.requestSubmit() preferred over direct handleSubmit call — triggers native form validation and onSubmit handler correctly
  - Visible "Add" button chosen over sr-only hidden button — provides user affordance showing how to submit inline create

metrics:
  duration: ~2 min
  completed: 2026-02-24
  tasks: 2
  files-modified: 3
---

# Phase 03 Plan 09: Three Bug Fixes — Gemma AI Breakdown, Inline Create Submission, Sticky Form Buttons Summary

Fixed three independent bugs: Gemma model AI breakdown (400 error from unsupported systemInstruction), inline create Enter-key submission (no submit button causing implicit form submission failure), and Create/Save button visibility (sticky positioning in task modal).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix Gemma model systemInstruction 400 error | 0c04c8d | src/ai/providers/gemini.ts |
| 2 | Fix inline create Enter submission and sticky form buttons | 78fa52d | src/components/task/TaskInlineCreate.tsx, src/components/task/TaskForm.tsx |

## What Was Built

### Task 1: Gemma model systemInstruction fix

`GeminiProvider.generateSubtasks()` was unconditionally passing `config.systemInstruction` to the Gemini API. Gemma models (`gemma-3-12b-it`, `gemma-3-27b-it`) do not support this parameter, causing a 400 error: "Developer instruction is not enabled for models/gemma-3-27b-it".

Added `isGemmaModel()` private helper using `this.model.startsWith('gemma-')`. In `generateSubtasks()`, Gemma models now receive the system prompt prepended to the user message content with `systemPrompt + '\n\n' + prompt`, while Gemini models continue to use `config.systemInstruction`. Also updated `testConnection()` to omit `systemInstruction` for Gemma models, so the "Test & Save" button in settings no longer gives false confidence.

`estimateTime()` was already working correctly (no systemInstruction) and was left unchanged.

### Task 2: Inline create submission and sticky buttons

**TaskInlineCreate.tsx:** The form had two text inputs and zero submit buttons. Per the HTML spec, implicit form submission via Enter requires either a submit button or exactly one text input — with two inputs and no button, Enter did nothing. Fixed by:
1. Adding a visible "Add" submit button after the CategoryCombobox, enabling both implicit submission and providing a visual affordance.
2. Updating `handleKeyDown` to use `form.requestSubmit()` on Enter — this triggers the native form validation and the `onSubmit` handler correctly.

**TaskForm.tsx:** The Actions div (Cancel + Create/Save buttons) could be pushed below the visible area in task modals opened from calendar day clicks (which have a 700px `maxHeight`). Changed the Actions div to `sticky bottom-0` with `bg-white` to pin it to the bottom of the scrollable modal. Used `-mx-6 px-6` to extend the white background to the modal edges (matching the parent `p-6` padding), and `border-t border-slate-100` for a subtle separator.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with 0 errors
- `npm run build` succeeds
- `src/ai/providers/gemini.ts` contains `this.model.startsWith('gemma-')` at line 44
- `src/ai/providers/gemini.ts` conditionally omits systemInstruction: `const config = isGemma ? {} : { systemInstruction: systemPrompt }` at line 62
- `src/components/task/TaskInlineCreate.tsx` contains `<button type="submit">` at line 70-75
- `src/components/task/TaskForm.tsx` Actions div has `sticky bottom-0` at line 235

## Self-Check: PASSED

Files exist:
- FOUND: src/ai/providers/gemini.ts
- FOUND: src/components/task/TaskInlineCreate.tsx
- FOUND: src/components/task/TaskForm.tsx

Commits exist:
- FOUND: 0c04c8d (fix Gemma systemInstruction)
- FOUND: 78fa52d (fix inline create + sticky buttons)
