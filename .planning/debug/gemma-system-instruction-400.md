---
status: diagnosed
trigger: "AI breakdown fails with error: Developer instruction is not enabled for models/gemma-3-27b-it"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: Gemma models (gemma-3-12b-it, gemma-3-27b-it) do not support the systemInstruction parameter in the Gemini API; the GeminiProvider unconditionally sends systemInstruction for all models.
test: Trace code path from model selection through to API call
expecting: systemInstruction is sent regardless of model
next_action: Report diagnosis

## Symptoms

expected: Clicking "Break it down" with gemma-3-27b-it selected should stream subtask suggestions
actual: 400 error from Gemini API: "Developer instruction is not enabled for models/gemma-3-27b-it"
errors: 400 Bad Request - "Developer instruction is not enabled for models/gemma-3-27b-it"
reproduction: Select gemma-3-27b-it in settings, click "Break it down" on any task
started: Since gemma model options were added

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-23T00:00:00Z
  checked: src/ai/providers/gemini.ts generateSubtasks method (lines 54-60)
  found: systemInstruction is unconditionally passed in config for ALL models
  implication: Gemma models will always receive systemInstruction, triggering the 400 error

- timestamp: 2026-02-23T00:00:00Z
  checked: src/ai/providers/gemini.ts estimateTime method (lines 114-117)
  found: estimateTime does NOT use systemInstruction - only sends contents
  implication: estimateTime will work with Gemma models; only generateSubtasks is broken

- timestamp: 2026-02-23T00:00:00Z
  checked: src/types/index.ts (lines 7-12)
  found: GeminiModelId includes both gemma-3-12b-it and gemma-3-27b-it
  implication: Both Gemma models are affected, not just 27b

- timestamp: 2026-02-23T00:00:00Z
  checked: Google AI documentation on Gemma prompt structure
  found: Gemma models do not support system role / system instructions. System-level instructions must be prepended to the user message instead.
  implication: The fix must detect Gemma models and move system instructions into the user prompt

- timestamp: 2026-02-23T00:00:00Z
  checked: src/ai/providers/gemini.ts testConnection method (lines 132-141)
  found: testConnection does NOT use systemInstruction
  implication: Test & Save in settings will pass even for Gemma models, giving false confidence

## Resolution

root_cause: GeminiProvider.generateSubtasks() unconditionally passes `config.systemInstruction` to the Gemini API (line 58). Gemma models (gemma-3-12b-it, gemma-3-27b-it) do not support the systemInstruction parameter, causing a 400 error. The estimateTime and testConnection methods happen to work because they don't use systemInstruction.
fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
