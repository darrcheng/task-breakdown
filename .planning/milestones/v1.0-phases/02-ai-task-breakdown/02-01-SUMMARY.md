# Plan 02-01 Summary: Data Model + Provider Abstraction

**Status:** Complete
**Duration:** ~5 min

## What was built

Extended the Task data model with subtask hierarchy fields (parentId, depth, sortOrder), migrated Dexie to v2 with new indexes, and built the complete AI provider abstraction layer.

## Key files

### Created
- `src/ai/providers/types.ts` — AIProvider interface, SubtaskSuggestion, StreamCallbacks
- `src/ai/providers/anthropic.ts` — Claude provider with browser CORS support and streaming
- `src/ai/providers/gemini.ts` — Gemini provider with streaming and CORS error handling
- `src/ai/provider-factory.ts` — Factory returning provider by name
- `src/ai/prompts.ts` — Subtask generation and regeneration prompt templates
- `src/ai/key-storage.ts` — Encrypted API key storage using Web Crypto AES-GCM

### Modified
- `src/types/index.ts` — Added parentId, depth, sortOrder to Task; added AIProviderName, AIProviderConfig, AISettings types
- `src/db/database.ts` — Added v2 schema with parentId/depth indexes and aiSettings table
- `src/db/hooks.ts` — Added useSubtasks and useSubtaskCount hooks
- `src/components/task/TaskModal.tsx` — Added depth: 0 for new task creation
- `src/components/task/TaskInlineCreate.tsx` — Added depth: 0 for inline task creation

## Decisions

- Used `crypto.subtle` with AES-GCM and non-extractable device key in separate IndexedDB for key storage
- Dexie v2 migration sets depth=0 on existing tasks via upgrade function
- JSON Lines format for streaming subtask parsing (one JSON object per line)
- AnthropicProvider uses `dangerouslyAllowBrowser: true` for direct browser CORS calls
- GeminiProvider includes CORS error detection with helpful fallback message

## Self-Check: PASSED
- TypeScript compiles clean (`npx tsc --noEmit`)
- Build succeeds (`npm run build`)
- All 6 AI module files created
- Provider factory correctly instantiates both providers
