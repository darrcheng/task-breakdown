# Technology Stack

**Project:** ADHD-focused To-Do List with AI Task Breakdown
**Researched:** 2026-02-05
**Confidence:** MEDIUM (based on training data through Jan 2025, external verification unavailable)

## Recommended Stack

### Cross-Platform Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Native + Expo** | Expo SDK 52+ | Cross-platform mobile & web | Best balance of web/mobile parity, vast ecosystem, faster iterations than Flutter. Expo provides web support out-of-box. JavaScript/TypeScript familiarity reduces context switching. |
| TypeScript | 5.x | Type safety | Essential for AI response parsing, complex state management, reduces runtime errors |

**Rationale:**
- **React Native + Expo over Flutter:** Your requirement for web AND mobile with equal priority strongly favors React Native. Flutter web is still not production-ready for complex interactions (drag-and-drop is notoriously problematic). Expo provides unified web/iOS/Android builds from one codebase.
- **React Native over PWA-only:** PWAs lack native calendar integration, file system access for offline-first, and app store presence. Given ADHD users need friction-free access, native app experience is critical.
- **Expo over bare React Native:** Expo Router (file-based routing), EAS Build, OTA updates, and web support are essential for rapid iteration. You can always eject if needed.

**Confidence:** HIGH (React Native + Expo is the clear choice for your requirements as of 2025)

### Backend Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Hono** | 4.x | Edge-compatible API server | Ultralight (~12KB), runs on Cloudflare Workers for near-zero cost, faster than Express/Fastify, web-standard Request/Response |
| Cloudflare Workers | Latest | Serverless hosting | Free tier: 100K requests/day. Perfect for personal use with room to scale. Zero cold starts. |

**Rationale:**
- **Hono over Express/Fastify:** Modern, edge-first design. Express is legacy (callback-based), Fastify is heavier. Hono's middleware system is cleaner and TypeScript-native.
- **Cloudflare Workers over Vercel/AWS Lambda:** Your "minimize costs" requirement is paramount. CF Workers free tier is generous (100K req/day vs Vercel's 100GB bandwidth). Edge deployment means global speed.
- **Alternative considered:** Supabase (free tier includes auth + DB + edge functions). Valid option if you want batteries-included, but less control and vendor lock-in.

**Confidence:** HIGH (Hono + CF Workers is optimal for your cost/performance needs)

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Cloudflare D1** | Latest | SQLite-based edge database | Free tier: 5GB storage, 5M reads/day, 100K writes/day. Relational model suits hierarchical subtasks. Zero-latency reads from edge. |
| Drizzle ORM | 0.36+ | Type-safe query builder | Best TypeScript DX, generates migrations, works with D1, lighter than Prisma |

**Rationale:**
- **D1 over PostgreSQL (Neon/Supabase):** Your usage pattern (personal, <1K tasks) fits D1's free tier perfectly. Relational model is ideal for recursive subtasks. PostgreSQL is overkill and adds hosting costs.
- **D1 over Firebase/Firestore:** Real-time sync sounds appealing, but Firebase's pricing scales unpredictably. D1 + manual polling or WebSockets (Durable Objects) gives you control.
- **Drizzle over Prisma:** Prisma's runtime overhead is significant (5-10MB bundle size). Drizzle is edge-compatible and lighter. For D1 specifically, Drizzle has better support.

**Alternative for consideration:** IndexedDB (client-side) with optional cloud sync. For "personal use first," local-first architecture (CRDT-based) could eliminate backend costs entirely. Libraries: ElectricSQL, Replicache, or PowerSync.

**Confidence:** HIGH (D1 + Drizzle is solid for your scale, but consider local-first for true zero-cost)

### AI Provider Abstraction
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel AI SDK** | 3.x | Unified LLM interface | Provider-agnostic (OpenAI, Anthropic, Google AI), streaming support, React hooks for UI, edge-compatible |
| Zod | 3.x | Schema validation | Parse AI responses into type-safe structures, essential for subtask generation |

**Rationale:**
- **Vercel AI SDK over LangChain:** LangChain is overengineered for your use case. You need simple prompt → structured response, not chains/agents. Vercel AI SDK is lightweight, edge-compatible, and has excellent TypeScript DX.
- **Vercel AI SDK over direct API calls:** Abstracts away provider differences (OpenAI vs Claude vs Gemini), handles streaming, retries, and errors. Switching providers is a config change, not a rewrite.
- **Zod for structured outputs:** AI SDK integrates with Zod for type-safe parsing. Define subtask schema once, get validation + TypeScript types + runtime checks.

**Implementation pattern:**
```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const subtaskSchema = z.object({
  subtasks: z.array(z.object({
    title: z.string(),
    estimatedMinutes: z.number(),
    order: z.number(),
  })),
});

// Swap providers via config
const result = await generateObject({
  model: openai('gpt-4o') || anthropic('claude-3-5-sonnet') || google('gemini-2.0-flash'),
  schema: subtaskSchema,
  prompt: `Break down: "${taskTitle}"`,
});
```

**Confidence:** HIGH (Vercel AI SDK is the current standard for LLM abstraction as of 2025)

### State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zustand** | 5.x | Global state | Simpler than Redux, no boilerplate, React Native compatible, <1KB |
| TanStack Query | 5.x | Server state caching | Handles API calls, caching, optimistic updates, background refetching |

**Rationale:**
- **Zustand over Redux/MobX:** Redux is verbose (actions, reducers, thunks). MobX's magic is hard to debug. Zustand is transparent, minimal API, perfect for task lists.
- **TanStack Query over manual fetch:** Your app needs optimistic UI updates (drag task → instant feedback while API syncs). TanStack Query handles this pattern elegantly, plus caching reduces API calls (cost savings).

**Confidence:** HIGH (Zustand + TanStack Query is the modern standard)

### UI & Interactions
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **NativeWind** | 4.x | Styling (Tailwind for RN) | Unified styling syntax across web/mobile, compile-time CSS generation |
| @dnd-kit | 6.x (web) | Drag-and-drop | Accessible, touch-friendly, works with virtual lists |
| react-native-draggable-flatlist | 4.x (mobile) | Native drag-and-drop | Native gesture handling, smooth 60fps |

**Rationale:**
- **NativeWind over styled-components/Emotion:** Tailwind's utility-first approach is faster for prototyping. NativeWind compiles to native styles (no runtime cost).
- **@dnd-kit for web:** Modern, accessible, tree-shakeable. Better than react-beautiful-dnd (unmaintained) or react-dnd (complex API).
- **Separate DnD libraries for web/mobile:** Gesture systems differ fundamentally. Attempting unified abstraction (like react-native-gesture-handler web support) leads to compromises. Accept the platform difference.

**Confidence:** HIGH (NativeWind is standard, but MEDIUM on DnD library versions without verification)

### Calendar/Date Handling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **date-fns** | 4.x | Date manipulation | Tree-shakeable, functional API, smaller than Moment/Day.js |
| react-native-calendars | 1.x | Calendar UI component | Mature, customizable, handles edge cases (week start, localization) |

**Rationale:**
- **date-fns over Moment/Day.js:** Moment is deprecated. Day.js is smaller but date-fns has better TypeScript support and tree-shaking (only import functions you use).
- **react-native-calendars over custom build:** Calendar UI is deceptively complex (timezones, DST, week boundaries). Don't reinvent.

**Confidence:** HIGH

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Expo Router | 4.x | File-based navigation | Unified routing for web/mobile, type-safe |
| Expo Secure Store | Latest | API key storage | Encrypt user's OpenAI/Claude keys on-device |
| React Hook Form | 7.x | Form handling | Task creation/edit forms, validation |
| Zod | 3.x | Schema validation | AI responses, form validation, API contracts |
| clsx | 2.x | Conditional classnames | NativeWind utility |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Cross-platform** | React Native + Expo | Flutter | Flutter web is not production-ready for complex interactions. Dart learning curve. Smaller ecosystem. |
| **Cross-platform** | React Native + Expo | PWA-only | Lacks native integrations (calendar, notifications), poor offline UX, no app store presence |
| **Backend** | Hono + CF Workers | Next.js API routes | Next.js requires hosting ($$$). Vercel free tier limits are tight. Edge middleware adds complexity. |
| **Backend** | Hono + CF Workers | Supabase | Vendor lock-in. Less control over caching/performance. Generous free tier, but pricing jumps sharply. VALID alternative if you want auth + DB + functions in one. |
| **Database** | D1 + Drizzle | PostgreSQL (Neon) | Overkill for personal use. D1's free tier covers your scale. PG adds latency (not edge-colocated). |
| **Database** | D1 + Drizzle | Local-first (ElectricSQL) | MORE aligned with "zero cost" goal. Consider this seriously. Eliminates backend, works offline-native. Trade-off: no built-in sync UI, more client complexity. |
| **AI SDK** | Vercel AI SDK | LangChain | Overengineered. Heavy dependencies. You don't need agents/chains, just structured generation. |
| **State** | Zustand | Redux Toolkit | Boilerplate, even with RTK. Zustand is simpler and sufficient for your state shape. |
| **Styling** | NativeWind | Tamagui | Tamagui is compelling (animated, typed styles) but immature. Breaking changes common. NativeWind is stable. |

## Installation

### Initialize Project
```bash
# Create Expo app with TypeScript
npx create-expo-app@latest task-breakdown --template tabs

cd task-breakdown

# Install dependencies
npx expo install react-native-web react-dom
```

### Core Dependencies
```bash
# State & data fetching
npm install zustand @tanstack/react-query

# Styling
npm install nativewind
npm install -D tailwindcss

# AI integration
npm install ai zod
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google-generative-ai

# Date handling
npm install date-fns react-native-calendars

# Forms
npm install react-hook-form @hookform/resolvers

# DnD (install per platform)
npm install @dnd-kit/core @dnd-kit/sortable  # web only
npm install react-native-draggable-flatlist  # mobile only

# Navigation
npx expo install expo-router

# Security
npx expo install expo-secure-store

# Utilities
npm install clsx
```

### Backend Setup (Cloudflare Workers)
```bash
# In separate /backend directory
npm create cloudflare@latest backend -- --framework hono

cd backend

# Database ORM
npm install drizzle-orm
npm install -D drizzle-kit

# Wrangler (CF CLI) is included by create-cloudflare
```

## Architecture Notes

### Local-First Alternative (Recommended Consideration)

For truly minimized costs and ADHD-optimal UX (instant, offline-first), consider **local-first architecture**:

**Pattern:** IndexedDB (client) + optional sync to cheap cloud storage (Cloudflare R2, $0.015/GB/month)

**Libraries:**
- **Replicache** (MIT license, self-hostable sync server)
- **ElectricSQL** (Postgres-based sync, overkill but mature)
- **TinyBase** (in-memory reactive store + persistence)

**Why this matters for ADHD users:**
- Zero latency (everything is local)
- Works offline (no "loading" states to break flow)
- No backend costs for personal use
- Sync is optional (enable when ready to share)

**Trade-off:** More client complexity, but aligns with "personal use first, shareable later."

### Recursive Subtasks Data Model

```typescript
// D1 schema (Drizzle)
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').references(() => tasks.id), // self-reference
  title: text('title').notNull(),
  description: text('description'),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  order: integer('order').notNull(),
  depth: integer('depth').default(0), // track nesting level
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Recursive CTE query for subtree
const subtree = db.execute(sql`
  WITH RECURSIVE task_tree AS (
    SELECT * FROM tasks WHERE id = ?
    UNION ALL
    SELECT t.* FROM tasks t
    JOIN task_tree tt ON t.parent_id = tt.id
    WHERE t.depth <= 4  -- limit to 4 levels
  )
  SELECT * FROM task_tree
`);
```

### AI Provider Cost Optimization

**Strategy:** Free tier → cheap → expensive

1. **Start with Gemini 2.0 Flash (Google):**
   - Free tier: 1500 requests/day
   - Fast, sufficient for subtask generation
   - Model: `gemini-2.0-flash-exp`

2. **Fallback to Claude Haiku (Anthropic):**
   - $0.25/MTok input, $1.25/MTok output
   - Better reasoning for complex tasks
   - Model: `claude-3-5-haiku-20241022`

3. **Premium: Claude Sonnet (Anthropic):**
   - $3/MTok input, $15/MTok output
   - For deeply nested breakdowns
   - Model: `claude-3-5-sonnet-20241022`

**Implementation:**
```typescript
// config/ai-providers.ts
export const AI_PROVIDERS = {
  free: google('gemini-2.0-flash-exp'),
  standard: anthropic('claude-3-5-haiku-20241022'),
  premium: anthropic('claude-3-5-sonnet-20241022'),
} as const;

// User preference stored in Zustand
const aiTier = useAIStore(state => state.tier); // 'free' | 'standard' | 'premium'
```

## Deployment

### Mobile (Expo)
```bash
# Build for app stores via EAS
eas build --platform all

# Or development builds
npx expo run:ios
npx expo run:android
```

### Web (Expo)
```bash
# Static export (host on Cloudflare Pages)
npx expo export:web

# Outputs to /web-build, deploy to CF Pages (free)
npx wrangler pages deploy web-build
```

### Backend (Cloudflare Workers)
```bash
cd backend

# Deploy Workers + D1
npx wrangler deploy

# Run migrations
npx drizzle-kit push
```

**Total monthly cost (personal use):**
- Cloudflare Workers: $0 (free tier)
- D1: $0 (free tier)
- Cloudflare Pages: $0 (free tier)
- Gemini API: $0 (free tier)
- **Total: $0** until you exceed free tiers

## Sources

**Confidence caveat:** This research is based on training data through January 2025. External verification (Context7, WebSearch, official docs) was unavailable. Key recommendations (React Native + Expo, Hono, D1, Vercel AI SDK) reflect the state of the ecosystem as of late 2024/early 2025, but specific version numbers and API details should be verified against current documentation before implementation.

**Recommended verification steps:**
1. Check Expo SDK latest version: https://docs.expo.dev/
2. Verify Hono + Cloudflare Workers compatibility: https://hono.dev/getting-started/cloudflare-workers
3. Confirm D1 free tier limits: https://developers.cloudflare.com/d1/platform/pricing/
4. Review Vercel AI SDK docs: https://sdk.vercel.ai/docs
5. Check Gemini API free tier: https://ai.google.dev/pricing

**High confidence areas:** Framework choices (React Native + Expo, Hono, Vercel AI SDK) are well-established as of Jan 2025.

**Medium confidence areas:** Specific version numbers, D1 stability (still in beta as of training cutoff), NativeWind v4 maturity.

**Recommended architecture exploration:** Seriously evaluate local-first (IndexedDB + optional sync) vs client-server. For ADHD users and "personal use first," local-first offers superior UX and zero costs.
