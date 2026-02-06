# Project Research Summary

**Project:** ADHD-focused To-Do List with AI Task Breakdown
**Domain:** Cross-platform productivity application with AI assistance
**Researched:** 2026-02-05
**Confidence:** MEDIUM (based on training data through Jan 2025, external verification unavailable)

## Executive Summary

This is a cross-platform productivity application targeting ADHD users with AI-powered task breakdown as the primary differentiator. Based on research, the recommended approach is React Native + Expo for unified web/mobile delivery, with a local-first architecture using Cloudflare's edge stack (Hono + D1) for near-zero operational costs. The AI integration should use the Vercel AI SDK with a tier-based provider strategy (Gemini free tier → Claude Haiku → Claude Sonnet) to manage costs while maintaining quality.

The core architectural risk is complexity overload — ADHD users specifically need friction-free task capture and minimal cognitive load, which means ruthless feature restraint despite temptation to add "helpful" options. Technical risks center on recursive task breakdown (must enforce depth/breadth limits to prevent explosion), AI cost control (require explicit triggers, not auto-breakdown), and cross-platform sync race conditions (requires conflict resolution strategy from foundation phase). The competitive opportunity lies in combining AI breakdown sophistication (Goblin Tools level) with visual calendar scheduling (Structured app style) at recursive depth (3-4 levels) that exceeds existing tools.

The recommended build order follows a local-first MVP pattern: establish data model and single-platform core task management first, add AI differentiation second, polish ADHD-specific UX third, and defer sync/multi-device until core value is validated. This approach minimizes premature optimization while ensuring the foundation supports eventual multi-platform scaling without rewrites.

## Key Findings

### Recommended Stack

React Native + Expo provides the best balance for equal web/mobile priority, with JavaScript/TypeScript unification reducing context switching. Expo specifically delivers out-of-box web support, file-based routing, and OTA updates that accelerate iteration. The backend strategy leverages Cloudflare's generous free tiers: Hono for edge-compatible APIs (ultralight at 12KB), D1 for SQLite-based edge database (5GB storage, 5M reads/day free), and Workers for serverless hosting (100K requests/day free). This stack can operate at literally $0/month for personal use with room to scale.

**Core technologies:**
- **React Native + Expo SDK 52+**: Cross-platform framework — best web/mobile parity, Flutter web isn't production-ready for complex drag-drop interactions
- **Hono 4.x + Cloudflare Workers**: Backend API — edge-first, near-zero cost, faster than Express/Fastify, web-standard Request/Response
- **D1 + Drizzle ORM 0.36+**: Database — free tier covers personal use scale, relational model suits hierarchical subtasks, lighter than Prisma
- **Vercel AI SDK 3.x + Zod 3.x**: AI abstraction — provider-agnostic, streaming support, type-safe schema validation for structured output
- **Zustand 5.x + TanStack Query 5.x**: State management — minimal boilerplate, handles optimistic updates and caching elegantly
- **NativeWind 4.x**: Styling — unified Tailwind syntax across web/mobile, compile-time CSS generation

**Alternative consideration:** Local-first architecture (IndexedDB + optional sync to R2) could eliminate backend costs entirely and deliver zero-latency offline-first experience that particularly benefits ADHD users. This aligns better with "personal use first, shareable later" but adds client complexity.

### Expected Features

**Must have (table stakes):**
- Quick task capture — ADHD brains need immediate offload, single input field with keyboard shortcuts
- Daily/calendar view — time blindness requires concrete "today" visualization, clear separation from future tasks
- Visual task organization — drag-and-drop, color coding, spatial hierarchy prevents text-heavy overwhelm
- Task completion feedback — dopamine hits essential for ADHD motivation, needs satisfying visual/audio confirmation
- Low friction editing — inline editing, no modal dialogs, perfectionism paralysis requires effortless changes
- Mobile + desktop parity — task capture happens anywhere, desktop-only breaks ADHD workflow

**Should have (competitive differentiators):**
- AI task breakdown — core differentiator that solves "where to start" paralysis, must handle recursive 3-4 levels
- Task time estimates — helps with time blindness, AI can suggest durations and learn from completion patterns
- Energy level tagging — ADHD has variable capacity, need to match tasks to current state (low/medium/high energy)
- Gentle reschedule prompts — no guilt-inducing overdue badges, supportive "would you like to move this?" language
- Calendar time blocking — drag tasks to time slots for realistic day visualization

**Defer (v2+):**
- Gamification/rewards system — complex to implement well, validate engagement need first
- Body doubling/focus timer — valuable but not core to task breakdown value proposition
- Routine templates — useful but not essential for validating core AI concept
- External calendar integration — internal calendar must work first before syncing Google/Outlook
- Real-time collaboration — far future, focus on personal use first

**Anti-features (explicitly avoid):**
- Guilt-inducing overdue indicators — red badges worsen ADHD shame spiral
- Rigid deadline enforcement — ADHD has unpredictable energy, rigid deadlines cause anxiety
- Mandatory categorization — forced organization blocks task capture momentum
- Achievement streaks that reset — losing streaks feels punishing for inconsistent ADHD productivity
- Complex hierarchy beyond 3 levels — deep nesting causes overwhelm and paralysis

### Architecture Approach

The recommended architecture follows a local-first pattern with platform-specific storage (IndexedDB for web, SQLite for mobile) and maximum code sharing through a monorepo structure. Business logic lives in platform-agnostic `/core` package while UI components remain platform-specific. This enables sharing of Task Logic, Calendar Logic, and AI Service layers while allowing best-in-class storage implementations per platform.

**Major components:**
1. **Shared State (Zustand)** — application state management, coordinates between UI components and business logic with unidirectional data flow
2. **Task Logic** — pure business logic for CRUD operations, subtask recursion with adjacency list pattern (parent_id references), status management
3. **AI Service with Provider Adapter** — orchestrates task breakdown via Strategy pattern, abstracts provider differences (Gemini/Claude/OpenAI), handles prompt management and retry logic
4. **Calendar Logic** — temporal operations for date scheduling, drag-between-days calculations, view state separation from domain data
5. **Local Database** — source of truth with IndexedDB/SQLite, recursive queries via CTE, indexed on parent_id and scheduled_date for performance
6. **Sync Engine (deferred)** — eventual consistency layer for multi-device, not needed for MVP, conflict resolution must be designed upfront even if not implemented

**Key patterns:**
- **Recursive Task Tree (Adjacency List)**: Store parent_id reference only, compute hierarchy on demand, enforces depth limits via schema constraints
- **Optimistic Updates with Rollback**: Update UI immediately, persist asynchronously, rollback on failure for responsive offline-first UX
- **AI Provider Strategy Pattern**: Unified interface for swappable backends, avoid vendor lock-in, enable cost-tier experimentation

### Critical Pitfalls

1. **Overwhelming ADHD users with complexity** — More features creates cognitive load exceeding benefit. Default to zero-config, make everything optional, ruthlessly cut pre-task-entry decisions. Test with actual ADHD users not productivity enthusiasts. Measure time-to-first-task (must be under 10 seconds).

2. **Infinite recursion and subtask explosion** — AI generating 4+ levels with 47 subtasks for "clean kitchen" creates paralyzing overwhelm. Hard limit depth to 3 levels max, breadth to 5-7 subtasks per parent, require user confirmation before breakdown, collapse by default, enforce via database constraints. This must be MVP requirement, not deferred optimization.

3. **AI cost explosion without controls** — User creates 50 tasks in planning session, auto-breakdown triggers $5 in API costs before real usage begins. Require explicit breakdown trigger (button not automatic), implement daily/monthly rate limits, cache common breakdowns, use cheaper models first (Gemini free tier → Claude Haiku), show approaching limits. Cost controls are Day 1 requirement.

4. **Cross-platform sync race conditions** — User drags task to Friday on web while marking done on mobile, conflicting timestamps cause data loss or duplication. Design conflict resolution strategy upfront (CRDTs, operational transforms, or explicit conflict UI), use vector clocks for change tracking, test with simultaneous conflicting edits. Foundation phase architecture decision that cannot be bolted on later.

5. **Calendar-task impedance mismatch** — Task "write blog post" scheduled Tuesday but takes 3 hours when only 45-minute block available, endless rescheduling creates guilt loop. Add capacity indicators ("6 hours tasks on 3-hour-free day"), warn on overload, offer "find time for this" suggestions, separate "scheduled for" from "hoping to do."

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation — Local-First Core
**Rationale:** Establish data model and single-platform basic task management before AI complexity. Local-first architecture provides immediate usability without backend dependency and ensures solid foundation for eventual sync.

**Delivers:** Functional single-device task manager with calendar view
- Data model with recursive task tree (adjacency list, depth constraints)
- Local storage layer (IndexedDB for web OR SQLite for mobile, choose one platform to start)
- Core task CRUD operations with optimistic updates
- Basic UI: quick task capture, daily calendar view, drag-and-drop scheduling
- Task completion with positive feedback

**Addresses features:**
- Quick task capture (table stakes)
- Daily calendar view (table stakes)
- Visual task organization via drag-drop (table stakes)
- Task completion feedback (table stakes)
- Low friction editing (table stakes)

**Avoids pitfalls:**
- Complexity overload: zero-config task capture, minimal setup required
- Performance issues: proper indexing from day one (parent_id, scheduled_date)
- Time zone bugs: store dates as ISO strings "2026-02-04" not timestamps

**Research needs:** SKIP — established patterns for local task managers, well-documented storage libraries

### Phase 2: AI Differentiation
**Rationale:** Core value proposition depends on AI breakdown working well. Implement with strict controls to avoid cost explosion and subtask overload. Build provider abstraction from start to enable experimentation.

**Delivers:** Task breakdown with recursive subtasks
- AI Provider abstraction (Strategy pattern with single provider implementation)
- Gemini integration as initial free-tier provider
- Prompt engineering for 3-5 actionable subtasks
- Subtask creation with depth/breadth enforcement (3 levels max, 5-7 per parent)
- UI: "Break down task" button, loading states, edit AI suggestions before accepting
- Cost controls: rate limiting, explicit triggers only, usage tracking

**Addresses features:**
- AI task breakdown (primary differentiator)
- Recursive breakdown to 3-4 levels (competitive advantage)
- Task time estimates (AI can suggest durations)

**Avoids pitfalls:**
- Infinite recursion: hard limits enforced in AI Service and database schema
- AI cost explosion: explicit triggers, rate limits, free tier provider first
- Stale AI context: pass task description and recent task context in prompt
- No loading states: immediate spinner, disable button during request

**Research needs:** DEEP RESEARCH REQUIRED
- Current Gemini API structured output capabilities and free tier limits
- Prompt engineering patterns for task breakdown (quality vs tokens)
- Latest Vercel AI SDK integration patterns for Zod schema validation
- Rate limiting strategies for AI endpoints

### Phase 3: ADHD-Specific Polish
**Rationale:** Differentiate from generic task apps by addressing ADHD pain points. These features make the difference between "tried it" and "can't live without it."

**Delivers:** ADHD-optimized user experience
- Energy level tagging for tasks (low/medium/high)
- Filter tasks by current energy capacity
- Capacity awareness: visual day overload indicators
- Gentle reschedule prompts (no guilt language)
- Enhanced completion feedback (celebrate small wins)
- Undo support for all mutations
- Empty states and onboarding flow

**Addresses features:**
- Energy level tagging (differentiator)
- Gentle reschedule prompts (ADHD-specific)
- Positive completion feedback (ADHD motivation support)

**Avoids pitfalls:**
- Guilt-inducing indicators: neutral language, supportive prompts
- Notification hell: default to zero, opt-in only for what user wants
- No undo: Cmd/Ctrl+Z support, toast confirmations with undo option

**Research needs:** MODERATE RESEARCH RECOMMENDED
- ADHD community feedback on existing tools (r/ADHD, ADDitude forums)
- Energy-based task filtering patterns from ADHD apps
- Positive reinforcement patterns that don't feel patronizing

### Phase 4: Cross-Platform Expansion
**Rationale:** After core value validated on one platform, expand to second platform to enable task capture anywhere. Shared business logic reduces duplication.

**Delivers:** Full web + mobile parity
- Implement second platform (if started web, add mobile; if started mobile, add web)
- Extract shared logic to monorepo `/core` package
- Platform-specific UI components (web vs mobile drag-drop libraries)
- Unified state management across platforms
- Platform-specific storage adapters (IndexedDB + SQLite)

**Addresses features:**
- Mobile + desktop parity (table stakes requirement)
- Cross-platform sync foundation (architecture ready even if not syncing yet)

**Avoids pitfalls:**
- Mixing view concerns with domain data: strict separation maintained
- Shared mutable state: unidirectional data flow enforced
- Platform differences in drag-drop: accept separate libraries per platform

**Research needs:** SKIP — established React Native + Expo patterns, architecture already researched

### Phase 5: Multi-Device Sync (Deferred to Post-MVP)
**Rationale:** Validate core value proposition and user retention before investing in complex sync infrastructure. Conflict resolution is architecturally complex and can wait until proven user need.

**Delivers:** Use app across multiple devices with sync
- Backend API (Hono + Cloudflare Workers + D1)
- Authentication (simple email/password or magic link, not OAuth initially)
- Sync engine with conflict resolution (last-write-wins with conflict detection)
- Offline queue and background sync
- Sync status indicators in UI

**Avoids pitfalls:**
- Race conditions: implement conflict resolution strategy designed in Phase 1
- Authentication overload: start simple, add complexity only when needed
- Sync before offline: local-first foundation already solid

**Research needs:** DEEP RESEARCH REQUIRED (when phase begins)
- Cloudflare D1 production readiness and limitations at time of implementation
- Conflict resolution libraries and patterns for React Native
- Offline queue implementation patterns with TanStack Query

### Phase Ordering Rationale

- **Phase 1 first**: Foundation must be solid before adding AI complexity. Local-first architecture validates core task management patterns without backend dependency. Single platform reduces variables during initial development.

- **Phase 2 second**: AI differentiation is core value proposition but depends on stable task data model. Cost controls and limits must be MVP requirements, not optimizations. Provider abstraction from start avoids lock-in.

- **Phase 3 third**: ADHD-specific polish separates this from generic task managers but requires working task+AI foundation. These features are refinements, not core functionality.

- **Phase 4 fourth**: Cross-platform expansion proves architecture's portability but only after core value validated on single platform. Shared business logic reuse validates abstraction quality.

- **Phase 5 deferred**: Sync is most complex component with highest risk of premature optimization. Personal use MVP doesn't require it. Multi-device sync becomes valuable only after retention is proven.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (AI Integration)**: Gemini API capabilities evolve rapidly, prompt engineering is domain-specific, cost optimization strategies need current pricing verification
- **Phase 3 (ADHD Polish)**: ADHD community feedback on existing tools provides real user pain points, energy-based filtering patterns need UX validation
- **Phase 5 (Sync)**: Conflict resolution strategies and D1 production readiness require point-in-time verification when phase begins

**Phases with standard patterns (skip research):**
- **Phase 1 (Foundation)**: Local task storage with IndexedDB/SQLite is well-documented, adjacency list for recursive trees is established pattern
- **Phase 4 (Cross-Platform)**: React Native + Expo patterns are mature, monorepo code sharing is standard practice

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | React Native + Expo, Hono + CF Workers, D1 + Drizzle are clear choices for requirements as of 2025; specific versions need verification |
| Features | MEDIUM | ADHD app patterns based on training knowledge of Goblin Tools, Structured, Llama Life; features align with known ADHD executive function challenges; validation with actual ADHD users needed |
| Architecture | HIGH | Local-first, adjacency list, provider abstraction are established patterns; cross-platform code sharing via monorepo is standard; sync complexity acknowledged and deferred appropriately |
| Pitfalls | MEDIUM-HIGH | Recursive explosion, cost controls, ADHD complexity overload are well-documented failure modes; sync race conditions are known distributed systems problems; specific ADHD pitfalls based on accessibility research |

**Overall confidence:** MEDIUM

Research is based on solid architectural patterns and established technology choices, but lacks external verification due to WebSearch unavailability. Stack recommendations reflect ecosystem state as of late 2024/early 2025 but specific versions, API capabilities, and pricing need point-in-time verification during implementation. ADHD-specific insights draw from training knowledge of executive function challenges and existing app patterns but would benefit from current community feedback.

### Gaps to Address

- **D1 production readiness**: Was in beta as of training cutoff, need to verify current status and any limitations discovered since then
- **Gemini API structured output**: Capabilities for Zod schema integration need verification during Phase 2 planning
- **NativeWind v4 maturity**: Check for breaking changes and stability reports before committing
- **ADHD user validation**: All ADHD-specific features should be validated with actual users, not just inferred from research
- **React Native drag-drop libraries**: Verify current maintenance status of @dnd-kit and react-native-draggable-flatlist
- **Cloudflare Workers cold start**: Verify free tier still has "zero cold starts" claim with current infrastructure

**How to handle during planning:**
- Phase 1: Verify IndexedDB/SQLite library current versions and React Native compatibility
- Phase 2: Run `/gsd:research-phase` for AI integration specifically (Gemini API, prompt patterns, cost optimization)
- Phase 3: Consider user research sprint with ADHD community before finalizing UX patterns
- Phase 4: Verify chosen libraries still maintained and compatible with latest Expo SDK
- Phase 5: Run `/gsd:research-phase` for sync strategies and conflict resolution when phase begins

## Sources

### Training Data Knowledge (MEDIUM-HIGH confidence)
- React Native, Expo, React ecosystem best practices (through Jan 2025)
- Cloudflare Workers, Hono, D1 architecture patterns (through late 2024)
- ADHD executive function challenges and productivity tool patterns (Goblin Tools, Structured, Llama Life, Finch app patterns)
- Recursive data structures, adjacency list patterns for hierarchical data
- Cross-platform mobile development patterns and monorepo strategies
- AI integration patterns, LLM cost optimization, provider abstraction strategies
- Sync conflict resolution patterns, CRDT concepts, eventual consistency

### Verification Needed (before implementation)
- Current Expo SDK version and web support capabilities: https://docs.expo.dev/
- Hono + Cloudflare Workers integration status: https://hono.dev/getting-started/cloudflare-workers
- D1 free tier limits and production status: https://developers.cloudflare.com/d1/
- Vercel AI SDK current capabilities: https://sdk.vercel.ai/docs
- Gemini API free tier and structured output: https://ai.google.dev/pricing
- ADHD community tool feedback: r/ADHD, ADDitude Magazine forums
- React Native drag-drop library status: @dnd-kit, react-native-draggable-flatlist GitHub

### Confidence Rationale
- **HIGH confidence**: Framework choices and architectural patterns are well-established, stable technologies
- **MEDIUM confidence**: ADHD-specific patterns based on known apps and executive function research, but lacking current user validation; specific versions and API details need point-in-time verification
- **LOW confidence**: None — all recommendations have reasonable evidence basis even if external verification unavailable

---
*Research completed: 2026-02-05*
*Ready for roadmap: yes*
