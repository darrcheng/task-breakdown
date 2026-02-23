# Phase 2: AI Task Breakdown - Research

**Researched:** 2026-02-22
**Domain:** AI-powered subtask generation (LLM API integration, streaming, provider abstraction)
**Confidence:** HIGH

## Summary

Phase 2 adds AI-powered task breakdown to a local-first React + Vite + Dexie.js application. The core challenge is integrating multiple LLM providers (Anthropic Claude, Google Gemini) directly from the browser without a backend server, while providing streaming subtask generation with a review-before-accept UX.

**Critical architecture finding:** Anthropic's API supports CORS for direct browser calls (using `dangerouslyAllowBrowser: true`), but Google Gemini's `generativelanguage.googleapis.com` does NOT support CORS headers. This means Gemini requires a lightweight CORS proxy or a different approach. For a local-first app with "bring your own key" pattern, a local proxy or service worker approach is needed for Gemini support.

**Primary recommendation:** Build a provider abstraction layer with a unified interface. Use `@anthropic-ai/sdk` directly in the browser for Claude. For Gemini, use `@google/genai` with a minimal local CORS proxy (or defer Gemini to a future update and launch with Claude-only browser-direct support). Subtasks are stored as first-class tasks in Dexie with a `parentId` field and `depth` counter, using the existing task schema with minimal extensions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- "Break it down" button lives inside the task detail modal (not on task rows)
- Subtasks stream in one-by-one as the AI generates them (progressive, feels fast)
- Generated subtasks become full independent tasks with a `parentId` field linking to the parent
- Subtasks land on the same calendar day as the parent task
- Subtasks appear in the calendar/list like any other task -- no visual distinction from regular tasks
- Subtasks look identical to regular tasks but have a parent link/badge
- Opening a parent task's modal shows a nested list of its subtasks with status checkboxes
- Nested indentation used to show depth for recursive breakdown (task -> subtask -> sub-subtask)
- When all subtasks are completed, parent shows a prompt: "All subtasks done -- mark parent complete?"
- Review step before creating: AI shows proposed subtasks in a preview, user edits/removes before they become real tasks
- Review actions available per subtask: edit title inline, remove individual subtask (X button), drag-to-reorder, "Accept all" button
- Keep/pin toggle per subtask -- regeneration only replaces unpinned subtasks, preserving the ones user has kept
- Recursive breakdown uses the same full review flow at every depth level
- First-use prompt when user first taps "Break it down" -- configure provider before proceeding
- Settings page for changing provider/key later
- Supported providers at launch: Google Gemini and Anthropic Claude (OpenAI deferred)
- API keys stored in local encrypted storage (OS keychain or equivalent)

### Claude's Discretion
- Prompt engineering for subtask generation quality
- Exact streaming implementation details
- Free tier vs bring-your-own-key default (pick what's practical for local-first)
- Number of subtasks generated per breakdown (requirement says 3-5)
- Parent link badge design and placement
- Exact "all subtasks done" prompt UI

### Deferred Ideas (OUT OF SCOPE)
- OpenAI/GPT provider support -- add in a future update when Gemini + Claude are solid
- AI-suggested time estimates for tasks -- Phase 3 (ADHD-02)
- "Start here" highlighting for first subtask -- Phase 3 (ADHD-05)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | User can tap a button to generate subtasks for any task | "Break it down" button in task modal triggers LLM call; streaming response renders subtasks progressively |
| AI-02 | User can edit AI-generated subtasks | Review preview with inline title editing before acceptance; standard TaskForm after acceptance |
| AI-03 | User can reorder AI-generated subtasks | dnd-kit sortable in review preview; `sortOrder` field on accepted subtasks |
| AI-04 | User can delete individual AI-generated subtasks | X button per subtask in review preview; standard delete flow after acceptance |
| AI-05 | User can regenerate all subtasks for a task | "Regenerate" button replaces unpinned subtasks; pin/keep toggle preserves user-approved ones |
| AI-06 | User can recursively break down subtasks up to 3 levels deep | `depth` field (0-3) on tasks; "Break it down" available when depth < 3; same review flow at each level |
| AI-07 | AI provider is swappable (Claude/Gemini, OpenAI deferred) | Provider abstraction layer with unified interface; settings UI for provider selection + API key entry |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.61+ | Claude API client with browser CORS support | Official Anthropic SDK, supports `dangerouslyAllowBrowser` for direct browser calls, built-in streaming |
| @google/genai | ^1.0+ | Gemini API client | Official Google Gen AI SDK, `generateContentStream` for streaming responses |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/sortable | ^10.0.0 | Drag-to-reorder subtasks in review preview | Already in project; use `verticalListSortingStrategy` for subtask reorder |
| dexie | ^4.3.0 | Store subtasks as tasks with parentId | Already in project; add parentId index for subtask queries |
| lucide-react | ^0.575.0 | Icons for breakdown button, pin toggle, parent badge | Already in project |
| Web Crypto API | native | Encrypt API keys at rest | Browser-native, no dependency needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct SDK calls | Vercel AI SDK (`ai` package) | AI SDK requires a server endpoint for streaming; overkill for local-first app with no backend |
| Custom provider abstraction | multi-llm-ts, any-llm | Extra dependency for 2 providers; custom interface is ~50 lines and tighter |
| Web Crypto API | crypto-js | Native API is sufficient; no need for external crypto dependency |

**Installation:**
```bash
npm install @anthropic-ai/sdk @google/genai
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── ai/
│   ├── providers/
│   │   ├── types.ts           # Provider interface + shared types
│   │   ├── anthropic.ts       # Claude provider implementation
│   │   └── gemini.ts          # Gemini provider implementation
│   ├── provider-factory.ts    # Factory: returns provider by name
│   ├── prompts.ts             # Prompt templates for subtask generation
│   └── key-storage.ts         # Encrypted API key storage (Web Crypto + IndexedDB)
├── components/
│   ├── task/
│   │   ├── BreakdownButton.tsx    # "Break it down" trigger
│   │   ├── SubtaskReview.tsx      # Review preview with edit/reorder/pin/accept
│   │   ├── SubtaskList.tsx        # Nested subtask display in parent modal
│   │   └── ParentBadge.tsx        # Visual indicator linking to parent task
│   └── settings/
│       └── AIProviderSettings.tsx # Provider selection + API key entry
├── db/
│   └── database.ts            # Extended schema: parentId, depth, sortOrder
├── hooks/
│   ├── useBreakdown.ts        # Orchestrates: generate -> review -> accept flow
│   ├── useSubtasks.ts         # Query subtasks by parentId (useLiveQuery)
│   └── useAIProvider.ts       # Load/save provider config from settings
└── types/
    └── index.ts               # Extended Task type with parentId, depth, sortOrder
```

### Pattern 1: Provider Abstraction Interface
**What:** A unified TypeScript interface that all AI providers implement, enabling provider swapping without changing consumer code.
**When to use:** Any time multiple LLM providers need the same capability.
**Example:**
```typescript
// src/ai/providers/types.ts
export interface SubtaskSuggestion {
  title: string;
  description: string;
}

export interface StreamCallbacks {
  onSubtask: (subtask: SubtaskSuggestion) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface AIProvider {
  name: string;
  generateSubtasks(
    taskTitle: string,
    taskDescription: string,
    parentContext: string,
    callbacks: StreamCallbacks,
  ): Promise<void>;
  testConnection(): Promise<boolean>;
}
```

### Pattern 2: Streaming Subtask Generation with Progressive Rendering
**What:** Parse LLM streaming output to extract individual subtasks as they arrive, rendering each one immediately in the review UI.
**When to use:** When generating multiple structured items (subtasks) and wanting one-by-one appearance.
**Example:**
```typescript
// Anthropic streaming pattern (browser-direct)
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: userApiKey,
  dangerouslyAllowBrowser: true,
});

const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});

let buffer = '';
for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    buffer += event.delta.text;
    // Parse complete subtasks from buffer (JSON lines or numbered list)
    const parsed = extractCompleteSubtasks(buffer);
    for (const subtask of parsed.complete) {
      callbacks.onSubtask(subtask);
    }
    buffer = parsed.remaining;
  }
}
```

### Pattern 3: Dexie Schema Extension for Subtask Hierarchy
**What:** Extend existing Task type with `parentId`, `depth`, and `sortOrder` fields. Use Dexie version migration.
**When to use:** Adding subtask hierarchy to existing task table.
**Example:**
```typescript
// Database migration (version 2)
db.version(2).stores({
  tasks: '++id, date, status, categoryId, parentId, depth',
  categories: '++id, name',
});

// Query subtasks for a parent
const subtasks = useLiveQuery(
  () => db.tasks.where('parentId').equals(parentId).sortBy('sortOrder'),
  [parentId]
);
```

### Pattern 4: Encrypted API Key Storage
**What:** Use Web Crypto API to encrypt API keys before storing in IndexedDB/localStorage. A device-bound key (generated once, stored as non-extractable CryptoKey in IndexedDB) encrypts the user's API key.
**When to use:** Storing sensitive credentials in browser storage.
**Example:**
```typescript
// Generate a device-bound encryption key (once, on first use)
const encKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false, // non-extractable
  ['encrypt', 'decrypt']
);
// Store encKey in IndexedDB (it's non-extractable, can't be read by JS)

// Encrypt API key
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  encKey,
  new TextEncoder().encode(apiKey)
);
// Store { iv, encrypted } in localStorage or IndexedDB
```

### Pattern 5: Review-Before-Accept Flow (State Machine)
**What:** A state machine managing the breakdown lifecycle: idle -> generating -> reviewing -> accepting -> done.
**When to use:** Complex multi-step UI flows with intermediate states.
**Example:**
```typescript
type BreakdownState =
  | { status: 'idle' }
  | { status: 'configuring' } // First-use provider setup
  | { status: 'generating'; subtasks: SubtaskSuggestion[]; progress: number }
  | { status: 'reviewing'; subtasks: ReviewSubtask[] } // User editing
  | { status: 'accepting' } // Writing to Dexie
  | { status: 'error'; message: string };

interface ReviewSubtask extends SubtaskSuggestion {
  id: string; // temp ID for dnd-kit
  pinned: boolean;
  removed: boolean;
}
```

### Anti-Patterns to Avoid
- **Creating subtasks immediately without review:** User MUST see and approve subtasks before they become real tasks. The review step is a locked decision.
- **Storing subtasks in a separate table:** Subtasks are first-class tasks. Use the same `tasks` table with `parentId` and `depth` fields.
- **Hardcoding provider logic:** Always go through the provider interface. Never import `@anthropic-ai/sdk` directly in components.
- **Storing API keys in plaintext:** Even in localStorage, API keys must be encrypted with Web Crypto API.
- **Deep nesting beyond 3 levels:** Enforce `depth < 3` check before showing "Break it down" button.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder subtasks | Custom drag handlers | @dnd-kit/sortable with `verticalListSortingStrategy` | Already in project, handles accessibility, touch, keyboard |
| API key encryption | Custom encryption | Web Crypto API (native) | Browser-native AES-GCM, non-extractable keys, zero dependencies |
| Streaming text parsing | Character-by-character state machine | JSON streaming with delimiter-based parsing | Structured output (JSON lines) is more reliable than parsing free-text |
| LLM response format | Free-text parsing | Structured/JSON output from LLM | Both Claude and Gemini support JSON mode; parse objects, not prose |

**Key insight:** The AI providers handle the hard parts (generation, streaming). The app code should focus on orchestration (provider -> stream -> parse -> review -> persist) and UX (progressive rendering, pin/keep, reorder).

## Common Pitfalls

### Pitfall 1: Gemini CORS Blocking
**What goes wrong:** `generativelanguage.googleapis.com` returns no `Access-Control-Allow-Origin` header. Browser blocks the response.
**Why it happens:** Google's Gemini API does not support CORS for direct browser calls, unlike Anthropic's API.
**How to avoid:** Option A: Ship Claude-only for browser-direct, add Gemini with a minimal CORS proxy. Option B: Use a Vite dev proxy for development and document the production proxy requirement. Option C: Explore if `@google/genai` has built-in browser support via fetch mode.
**Warning signs:** Network tab shows preflight OPTIONS request failing with no CORS headers.

### Pitfall 2: Streaming JSON Parse Failures
**What goes wrong:** LLM streams partial JSON that breaks `JSON.parse()`. Subtasks appear corrupted or duplicated.
**Why it happens:** Streaming delivers chunks at arbitrary boundaries, splitting JSON objects mid-token.
**How to avoid:** Use a line-delimited format (one JSON object per line). Buffer text, split on newlines, only parse complete lines. Include clear delimiters in the prompt (e.g., "Output each subtask as a separate JSON line").
**Warning signs:** `SyntaxError: Unexpected token` during streaming, subtasks with truncated titles.

### Pitfall 3: Dexie Version Migration Breaking Existing Data
**What goes wrong:** Changing the schema version without proper upgrade logic drops or corrupts existing task data.
**Why it happens:** Dexie's version().stores() defines indexes. Adding new indexed fields requires a version bump, but the data itself is preserved as long as you don't change the primary key.
**How to avoid:** Bump to `db.version(2)` with the new index list. Existing tasks will have `undefined` for `parentId`, `depth`, and `sortOrder`. Handle `undefined` as "no parent" / "depth 0" in queries.
**Warning signs:** Tasks disappear after schema change; `UpgradeError` in console.

### Pitfall 4: Recursive Depth Exceeding Limit
**What goes wrong:** User can break down a depth-2 subtask, creating depth-3 sub-subtasks, then tries to break down depth-3.
**Why it happens:** Depth check missing or off-by-one. Parent depth is 0 (root), subtask is 1, sub-subtask is 2, sub-sub-subtask is 3 -- that's 3 levels below root.
**How to avoid:** Define: root task = depth 0, first breakdown = depth 1, second = depth 2, third = depth 3. Allow breakdown when `depth < 3`. Show "Break it down" only when this check passes.
**Warning signs:** "Break it down" button appears on tasks that shouldn't support further breakdown.

### Pitfall 5: API Key Exposure in Bundle
**What goes wrong:** API key appears in browser's JS bundle, network inspector, or dev tools memory.
**Why it happens:** User-provided key stored in plaintext state, passed to SDK, visible in network headers.
**How to avoid:** The API key WILL be visible in network requests (Authorization header). This is unavoidable for direct browser calls. The encrypted storage protects at-rest keys (tab closed, device shared). Document this trade-off clearly in settings UI. For truly secure usage, a backend proxy is needed.
**Warning signs:** Users expecting enterprise-grade key security from a local-first browser app.

### Pitfall 6: Race Condition in Accept Flow
**What goes wrong:** User accepts subtasks while a regeneration is in progress, creating duplicate tasks.
**Why it happens:** Async state not properly guarded; accept handler doesn't check generation status.
**How to avoid:** Disable "Accept" during generation. Use the state machine pattern (generating/reviewing states are mutually exclusive). Cancel in-flight streams before regeneration.
**Warning signs:** Duplicate subtasks in Dexie after accept+regenerate overlap.

## Code Examples

### Claude Streaming Subtask Generation (Browser-Direct)
```typescript
// src/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, StreamCallbacks, SubtaskSuggestion } from './types';
import { buildSubtaskPrompt } from '../prompts';

export class AnthropicProvider implements AIProvider {
  name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateSubtasks(
    taskTitle: string,
    taskDescription: string,
    parentContext: string,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const prompt = buildSubtaskPrompt(taskTitle, taskDescription, parentContext);

    try {
      const stream = await this.client.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      let buffer = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          buffer += event.delta.text;
          const { complete, remaining } = parseSubtaskLines(buffer);
          for (const subtask of complete) {
            callbacks.onSubtask(subtask);
          }
          buffer = remaining;
        }
      }
      // Parse any remaining buffer
      if (buffer.trim()) {
        const { complete } = parseSubtaskLines(buffer + '\n');
        for (const subtask of complete) {
          callbacks.onSubtask(subtask);
        }
      }
      callbacks.onComplete();
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}

function parseSubtaskLines(buffer: string): { complete: SubtaskSuggestion[]; remaining: string } {
  const lines = buffer.split('\n');
  const remaining = lines.pop() || '';
  const complete: SubtaskSuggestion[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.title) {
        complete.push({ title: parsed.title, description: parsed.description || '' });
      }
    } catch {
      // Not valid JSON yet, skip
    }
  }

  return { complete, remaining };
}
```

### Dexie Schema Migration
```typescript
// src/db/database.ts — version 2
db.version(2).stores({
  tasks: '++id, date, status, categoryId, parentId, depth',
  categories: '++id, name',
});

// Querying subtasks
import { useLiveQuery } from 'dexie-react-hooks';

function useSubtasks(parentId: number | undefined) {
  return useLiveQuery(
    () => parentId
      ? db.tasks.where('parentId').equals(parentId).sortBy('sortOrder')
      : [],
    [parentId]
  );
}
```

### Subtask Review Component (dnd-kit Sortable)
```typescript
// src/components/task/SubtaskReview.tsx (sketch)
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function SubtaskReview({ subtasks, onAccept, onRegenerate }: Props) {
  const [items, setItems] = useState<ReviewSubtask[]>(subtasks);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIndex = prev.findIndex(s => s.id === active.id);
        const newIndex = prev.findIndex(s => s.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {items.filter(s => !s.removed).map(subtask => (
          <SortableSubtaskItem
            key={subtask.id}
            subtask={subtask}
            onEdit={...}
            onRemove={...}
            onTogglePin={...}
          />
        ))}
      </SortableContext>
      <button onClick={() => onAccept(items.filter(s => !s.removed))}>Accept All</button>
      <button onClick={() => onRegenerate(items.filter(s => s.pinned))}>Regenerate</button>
    </DndContext>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-only LLM calls | Anthropic supports CORS for browser-direct calls | Aug 2024 | Claude can be called directly from browser with `dangerouslyAllowBrowser` |
| @google/generative-ai | @google/genai (new SDK) | May 2025 GA | New official SDK with streaming, but still no CORS support |
| Custom fetch for streaming | SDK-native streaming (`.stream()`, `generateContentStream`) | 2024-2025 | Both SDKs handle SSE parsing internally |
| localStorage for keys | Web Crypto API + IndexedDB | Ongoing | Non-extractable CryptoKeys for at-rest encryption |

**Deprecated/outdated:**
- `@google/generative-ai`: Replaced by `@google/genai` as the recommended Google Gen AI SDK
- Manual SSE parsing: Both Claude and Gemini SDKs now handle streaming internally

## Open Questions

1. **Gemini CORS Strategy**
   - What we know: Gemini API does not support CORS. Browser-direct calls will fail.
   - What's unclear: Whether `@google/genai` SDK has an undocumented browser mode or CORS workaround.
   - Recommendation: Launch with Claude browser-direct support. For Gemini, implement a minimal local CORS proxy option OR defer Gemini to when a Vite proxy plugin can handle it in dev, with documentation for production deployment.

2. **Structured Output vs Free-Text Parsing**
   - What we know: Both Claude and Gemini support JSON mode / structured output.
   - What's unclear: Whether JSON mode works well with streaming (partial JSON objects mid-stream).
   - Recommendation: Use JSON Lines format (one complete JSON object per line) in the prompt. This is streaming-friendly and parseable line-by-line.

3. **API Key "Encrypted Storage" Scope**
   - What we know: User decision says "local encrypted storage (OS keychain or equivalent)". Web Crypto API provides AES-GCM encryption with non-extractable keys in IndexedDB.
   - What's unclear: Whether the user expects true OS keychain integration (not available in pure web apps) or if Web Crypto-based encryption is sufficient.
   - Recommendation: Use Web Crypto API with non-extractable device key. This is the best available for a pure browser app. Document the security model clearly.

## Sources

### Primary (HIGH confidence)
- [@anthropic-ai/sdk GitHub](https://github.com/anthropics/anthropic-sdk-typescript) - Browser usage, `dangerouslyAllowBrowser`, streaming API
- [Anthropic Streaming Messages](https://docs.anthropic.com/en/api/messages-streaming) - SSE event types, streaming format
- [@google/genai GitHub](https://github.com/googleapis/js-genai) - Gemini SDK, `generateContentStream`
- [dnd-kit Sortable docs](https://docs.dndkit.com/presets/sortable) - `verticalListSortingStrategy`, `SortableContext`
- [Web Crypto API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - AES-GCM, `generateKey`, non-extractable
- [Dexie.js docs](https://dexie.org/docs) - Version migration, compound indexes

### Secondary (MEDIUM confidence)
- [Simon Willison: Claude API CORS](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) - Confirmed CORS support for Anthropic API
- [Gemini CORS discussion](https://discuss.ai.google.dev/t/gemini-api-cors-error-with-openai-compatability/58619) - Confirmed no CORS on Gemini API
- [web-crypto-storage npm](https://www.npmjs.com/package/@webcrypto/storage) - IndexedDB + Web Crypto pattern reference

### Tertiary (LOW confidence)
- Gemini browser-direct workarounds: No verified solution found; all sources recommend server proxy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDKs well-documented, browser patterns verified
- Architecture: HIGH - Provider abstraction is well-established pattern; Dexie migration is straightforward
- Pitfalls: HIGH - CORS limitation verified from multiple sources; streaming parse issues are well-documented
- Gemini CORS workaround: LOW - No verified browser-direct solution exists

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days - stable domain, SDKs at GA)
