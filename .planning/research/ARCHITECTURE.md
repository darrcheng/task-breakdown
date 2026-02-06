# Architecture Patterns

**Domain:** Cross-platform to-do list with AI task breakdown
**Researched:** 2026-02-05
**Confidence:** MEDIUM (based on established patterns for similar applications)

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Web Client  │              │ Mobile Client │            │
│  │   (React)    │              │ (React Native)│            │
│  └──────┬───────┘              └───────┬───────┘            │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          └──────────┬───────────────────┘
                     │
┌────────────────────┼─────────────────────────────────────────┐
│              Application Layer                                │
│         ┌────────┴────────┐                                  │
│         │  Shared State   │                                  │
│         │   (Zustand/     │                                  │
│         │    Jotai)       │                                  │
│         └────────┬────────┘                                  │
│                  │                                            │
│    ┌─────────────┼─────────────────┐                        │
│    │             │                 │                         │
│    ▼             ▼                 ▼                         │
│ ┌──────┐    ┌────────┐      ┌──────────┐                   │
│ │ Task │    │Calendar│      │    AI    │                   │
│ │ Logic│    │ Logic  │      │  Service │                   │
│ └──┬───┘    └───┬────┘      └────┬─────┘                   │
│    │            │                 │                          │
└────┼────────────┼─────────────────┼──────────────────────────┘
     │            │                 │
     │            │                 │
┌────┼────────────┼─────────────────┼──────────────────────────┐
│    │     Data Layer               │                          │
│    │            │                 │                          │
│    ▼            ▼                 ▼                          │
│ ┌──────────────────────┐    ┌──────────────┐               │
│ │   Local Database     │    │ AI Provider  │               │
│ │   (IndexedDB/SQLite) │    │   Adapter    │               │
│ └──────────┬───────────┘    └──────┬───────┘               │
│            │                       │                         │
│            │                       └──────┐                 │
│            │                              │                 │
│            ▼                              ▼                 │
│ ┌────────────────────┐          ┌────────────────┐         │
│ │  Sync Engine       │          │  External APIs │         │
│ │  (eventual)        │          │  - Gemini      │         │
│ └────────────────────┘          │  - Claude      │         │
│                                  │  - OpenAI      │         │
│                                  └────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Notes |
|-----------|---------------|-------------------|-------|
| **Web Client** | Browser UI, calendar view, drag-drop | Shared State, Local DB | React-based, responsive |
| **Mobile Client** | Native mobile UI, gestures | Shared State, Local DB | React Native, shares business logic |
| **Shared State** | Application state management, UI state | All UI components, Business Logic | Zustand or Jotai recommended |
| **Task Logic** | CRUD operations, subtask recursion, status management | Local Database, Shared State | Pure business logic, platform-agnostic |
| **Calendar Logic** | Date scheduling, drag-between-days, view calculations | Task Logic, Shared State | Handles temporal operations |
| **AI Service** | Task breakdown orchestration, prompt management, retry logic | AI Provider Adapter, Task Logic | Coordinates AI interactions |
| **Local Database** | Persistent storage, queries, indexing | Task Logic, Sync Engine | IndexedDB (web) / SQLite (mobile) |
| **AI Provider Adapter** | Provider abstraction, unified interface | External AI APIs, AI Service | Strategy pattern for swappable providers |
| **Sync Engine** | Conflict resolution, background sync (future) | Local Database, Remote API | Not needed for MVP, defer to later phase |

### Data Flow

**Task Creation Flow:**
```
User Input (UI)
  → Shared State
  → Task Logic (validate, create task object)
  → Local Database (persist)
  → Shared State (update)
  → UI (re-render)
```

**AI Breakdown Flow:**
```
User Triggers Breakdown (UI)
  → AI Service (build prompt, get task context)
  → AI Provider Adapter (select provider, format request)
  → External API (Gemini/Claude/OpenAI)
  → AI Provider Adapter (normalize response)
  → AI Service (parse subtasks)
  → Task Logic (create subtask tree)
  → Local Database (persist subtasks)
  → Shared State (update)
  → UI (show new subtasks)
```

**Calendar Drag Flow:**
```
User Drags Task to New Date (UI)
  → Calendar Logic (calculate new date)
  → Task Logic (update task.scheduledDate)
  → Local Database (persist change)
  → Shared State (update)
  → UI (re-render in new position)
```

**Offline-First Flow:**
```
User Actions (offline)
  → Shared State (immediate UI update)
  → Local Database (queue operations)
  → [Network Available]
  → Sync Engine (process queue, eventual)
  → Remote API (eventual)
```

## Patterns to Follow

### Pattern 1: Recursive Task Tree (Adjacency List)

**What:** Store tasks with `parentId` reference, query recursively
**When:** Need flexible subtask depth, efficient queries
**Why:** Allows arbitrary nesting depth without schema changes

**Data Model:**
```typescript
interface Task {
  id: string;              // UUID
  parentId: string | null; // null = root task
  title: string;
  description?: string;
  scheduledDate: string;   // ISO date string
  status: 'pending' | 'done';
  createdAt: string;
  updatedAt: string;
  order: number;           // For sibling ordering
}

// Query helpers
function getSubtasks(taskId: string): Task[] {
  return db.tasks.where({ parentId: taskId }).sortBy('order');
}

function getTaskTree(taskId: string): TaskTree {
  const task = db.tasks.get(taskId);
  const subtasks = getSubtasks(taskId).map(getTaskTree);
  return { ...task, subtasks };
}

function getRootTasks(date: string): Task[] {
  return db.tasks
    .where({ parentId: null, scheduledDate: date })
    .sortBy('order');
}
```

**Indexing Strategy:**
```typescript
// Required indexes for performance
indexes: [
  'id',                    // Primary key
  'parentId',              // For subtask queries
  'scheduledDate',         // For calendar view
  '[parentId+order]',      // For ordered sibling queries
  '[scheduledDate+parentId]' // For root tasks on date
]
```

### Pattern 2: AI Provider Adapter (Strategy Pattern)

**What:** Unified interface for multiple AI providers
**When:** Need swappable AI backends
**Why:** Avoid vendor lock-in, allow experimentation, graceful degradation

```typescript
interface AIProvider {
  name: string;
  breakdownTask(task: Task, depth: number): Promise<SubtaskSuggestion[]>;
  isAvailable(): Promise<boolean>;
}

class GeminiProvider implements AIProvider {
  async breakdownTask(task: Task, depth: number) {
    const prompt = buildPrompt(task, depth);
    const response = await gemini.generateContent(prompt);
    return parseSubtasks(response);
  }
}

class ClaudeProvider implements AIProvider {
  async breakdownTask(task: Task, depth: number) {
    const prompt = buildPrompt(task, depth);
    const response = await anthropic.messages.create({ ... });
    return parseSubtasks(response);
  }
}

class AIService {
  private provider: AIProvider;

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async breakdown(task: Task, depth = 1) {
    const suggestions = await this.provider.breakdownTask(task, depth);
    return this.createSubtasks(task.id, suggestions);
  }
}
```

### Pattern 3: Optimistic Updates with Rollback

**What:** Update UI immediately, persist asynchronously, rollback on failure
**When:** Need responsive UI, offline support
**Why:** Better UX, handles network latency/failures gracefully

```typescript
async function updateTaskStatus(taskId: string, status: TaskStatus) {
  // 1. Store previous state for rollback
  const previousTask = store.getTask(taskId);

  // 2. Update UI immediately (optimistic)
  store.updateTask(taskId, { status, updatedAt: new Date().toISOString() });

  // 3. Persist to database
  try {
    await db.tasks.update(taskId, { status });
  } catch (error) {
    // Rollback on failure
    store.updateTask(taskId, previousTask);
    throw error;
  }
}
```

### Pattern 4: Calendar View State Separation

**What:** Separate calendar view state from task data
**When:** Complex UI state (selected date, view mode, filters)
**Why:** Prevents mixing view concerns with domain data

```typescript
// Domain state (shared, persisted)
interface TaskStore {
  tasks: Map<string, Task>;
  addTask(task: Task): void;
  updateTask(id: string, updates: Partial<Task>): void;
}

// View state (local, ephemeral)
interface CalendarViewStore {
  selectedDate: string;
  viewMode: 'day' | 'week' | 'month';
  draggedTask: string | null;

  setSelectedDate(date: string): void;
  startDrag(taskId: string): void;
  dropOnDate(date: string): void; // Delegates to TaskStore
}
```

### Pattern 5: Cross-Platform Code Sharing

**What:** Maximum code reuse between web and mobile
**When:** Building web + mobile with shared business logic
**Why:** Reduce duplication, ensure consistency

**Recommended Structure:**
```
/packages
  /core           # Platform-agnostic business logic
    /models       # TypeScript interfaces
    /logic        # Task operations, calendar logic
    /ai           # AI service, provider adapters
  /web            # React web app
    /components   # Web-specific UI
    /hooks        # Web-specific hooks
  /mobile         # React Native mobile app
    /components   # Mobile-specific UI
    /hooks        # Mobile-specific hooks
  /storage        # Platform-specific storage implementations
    /web          # IndexedDB wrapper
    /mobile       # SQLite wrapper
```

**Storage Abstraction:**
```typescript
// Core defines interface
interface TaskRepository {
  getTask(id: string): Promise<Task>;
  getTasks(filter: TaskFilter): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
}

// Web implementation
class IndexedDBTaskRepository implements TaskRepository {
  // Uses Dexie.js or similar
}

// Mobile implementation
class SQLiteTaskRepository implements TaskRepository {
  // Uses expo-sqlite or similar
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Computed Hierarchy in Database

**What:** Storing full subtask paths or materialized hierarchies
**Why bad:**
- Requires updates when moving tasks in tree
- Increases storage size
- Creates sync conflicts
- Harder to maintain consistency

**Instead:**
- Store only `parentId` reference
- Compute hierarchy on query
- Cache computed trees in memory if needed

```typescript
// BAD: Storing path
interface Task {
  id: string;
  path: string[];  // ['root', 'parent', 'this']
  level: number;   // Computed from path
}

// GOOD: Store reference, compute on demand
interface Task {
  id: string;
  parentId: string | null;
}

function getTaskPath(taskId: string): string[] {
  const task = db.tasks.get(taskId);
  if (!task.parentId) return [task.id];
  return [...getTaskPath(task.parentId), task.id];
}
```

### Anti-Pattern 2: Tight Coupling to AI Provider

**What:** Directly calling OpenAI/Gemini APIs throughout the codebase
**Why bad:**
- Hard to swap providers
- Duplicated error handling
- Can't mock for testing
- Vendor lock-in

**Instead:** Use adapter pattern (see Pattern 2 above)

### Anti-Pattern 3: Sync Before Offline Support

**What:** Building backend sync before local-first works
**Why bad:**
- Can't use app offline
- Premature complexity
- Delays MVP
- Sync conflicts harder without solid local foundation

**Instead:**
- Build fully-functional local-first app first
- Add sync as separate layer later
- Use local storage as source of truth initially

### Anti-Pattern 4: Shared Mutable State Across Components

**What:** Direct DOM manipulation or component-to-component state passing
**Why bad:**
- Hard to track data flow
- Causes re-render bugs
- Difficult to debug
- Breaks React/React Native patterns

**Instead:** Use unidirectional data flow with state management library

### Anti-Pattern 5: Calendar Logic in UI Components

**What:** Date calculations, task filtering in component render methods
**Why bad:**
- Not testable in isolation
- Duplicated across web/mobile
- Performance issues (re-calculating on every render)
- Hard to maintain

**Instead:** Extract to pure functions in `CalendarLogic` service

```typescript
// BAD: In component
function CalendarDay({ date }) {
  const tasks = allTasks.filter(t =>
    t.scheduledDate === date && !t.parentId
  );
  // ... rendering
}

// GOOD: In service
// packages/core/logic/calendar.ts
export function getTasksForDate(
  tasks: Task[],
  date: string
): Task[] {
  return tasks.filter(t =>
    t.scheduledDate === date && t.parentId === null
  );
}

// Component
function CalendarDay({ date }) {
  const tasks = getTasksForDate(allTasks, date);
  // ... rendering
}
```

## Build Order and Dependencies

### Phase 1: Local Foundation (MVP)
**Goal:** Fully functional single-device app

```
1. Data Model & Storage Layer
   - Task interface definition
   - IndexedDB wrapper (web) OR SQLite wrapper (mobile)
   - Basic CRUD operations
   - Indexes for queries

   Why first: Foundation for everything else

2. Core Task Logic
   - Create/update/delete tasks
   - Subtask operations (add child, get children)
   - Status management
   - Recursive queries

   Depends on: Data model
   Why second: Business logic before UI

3. Basic UI (Single Platform)
   - Choose web OR mobile to start
   - Simple task list
   - Add/edit/delete tasks
   - Mark done/pending
   - View subtasks

   Depends on: Task logic
   Why third: Validate data model with real UI

4. Calendar View
   - Date-based task display
   - Filter tasks by scheduled date
   - Navigate between dates

   Depends on: Basic UI, Task logic
   Why fourth: Core feature for ADHD workflow
```

### Phase 2: AI Integration
**Goal:** Task breakdown functionality

```
5. AI Provider Abstraction
   - AIProvider interface
   - Single provider implementation (Gemini recommended to start)
   - Prompt engineering
   - Response parsing

   Depends on: Task logic
   Why first in phase: Need abstraction before using AI

6. AI Service Layer
   - Breakdown orchestration
   - Subtask creation from AI response
   - Error handling and retries
   - Depth limiting (prevent infinite recursion)

   Depends on: AI Provider, Task logic

7. UI Integration
   - "Break down task" button
   - Loading states
   - Error handling
   - Review/edit AI suggestions

   Depends on: AI Service
```

### Phase 3: Enhanced UX
**Goal:** Polish core experience

```
8. Drag and Drop
   - Drag tasks between dates
   - Reorder tasks within a day
   - Visual feedback

   Depends on: Calendar view
   Why: Major UX improvement for scheduling

9. Additional AI Providers
   - Claude provider implementation
   - OpenAI provider implementation
   - Provider selection UI

   Depends on: AI Provider abstraction working
   Why: Experimentation and reliability

10. Cross-Platform (if started with one)
    - Implement second platform (web or mobile)
    - Extract shared logic to /core
    - Platform-specific storage adapters

    Depends on: All core features working on one platform
    Why: Validate abstraction works
```

### Phase 4: Sync and Multi-Device (Future)
**Goal:** Use across devices

```
11. Backend API
    - Task storage endpoints
    - Authentication
    - User management

    Why deferred: Not needed for personal use MVP

12. Sync Engine
    - Offline queue
    - Conflict resolution (last-write-wins or operational transform)
    - Background sync

    Depends on: Backend API
    Why last: Most complex, not needed for MVP
```

### Dependency Graph

```
Data Model (1)
    ↓
Task Logic (2)
    ↓
Basic UI (3) ←────────┐
    ↓                  │
Calendar View (4)      │
    ↓                  │
AI Provider (5)        │
    ↓                  │
AI Service (6)         │
    ↓                  │
AI UI Integration (7)  │
    ↓                  │
Drag & Drop (8)        │
    ↓                  │
More AI Providers (9)  │
    ↓                  │
Cross-Platform (10) ───┘
    ↓
Backend API (11)
    ↓
Sync Engine (12)
```

## Technology Recommendations for Architecture

### State Management
**Recommendation:** Zustand or Jotai
- **Zustand:** Simple, minimal boilerplate, good TypeScript support
- **Jotai:** Atomic state, better for complex derived state
- **Avoid:** Redux (too much boilerplate for this use case)

### Local Storage
**Web:** Dexie.js (IndexedDB wrapper)
- Excellent TypeScript support
- Reactive queries
- Good indexing performance

**Mobile:** expo-sqlite or react-native-sqlite-storage
- Relational queries
- Good performance
- Wide compatibility

### Cross-Platform
**Recommendation:** Monorepo with shared core
- **Tool:** npm workspaces or pnpm workspaces
- **Structure:** packages/core, packages/web, packages/mobile
- **Build:** TypeScript project references for type safety

### AI Integration
**Start with:** Google Gemini API
- Free tier is generous
- Good at structured output
- Fast response times

**Add later:** Claude, OpenAI for comparison

## Scalability Considerations

| Concern | At 100 tasks | At 10K tasks | At 100K tasks |
|---------|--------------|--------------|---------------|
| **Query Performance** | No optimization needed | Index on scheduledDate, parentId | Consider virtual scrolling |
| **Memory Usage** | Load all tasks | Load all tasks | Paginate, load visible date range only |
| **Sync Conflicts** | N/A (local only) | Last-write-wins | Operational transform or CRDT |
| **Storage Size** | ~10KB | ~1MB | ~10MB, consider archiving old tasks |
| **Recursive Queries** | Depth 3-4 fine | Depth 3-4 fine | Limit depth, warn on deep nesting |

## Key Architecture Decisions

### Decision 1: Local-First, Sync Later
**Rationale:**
- Faster MVP
- Simpler mental model
- Offline by default
- Sync is complex, defer until proven need

**Implication:** Plan data model with sync in mind (UUIDs, timestamps), but don't build it yet

### Decision 2: Platform-Specific Storage, Shared Logic
**Rationale:**
- Web and mobile have different optimal storage solutions
- Business logic is platform-agnostic
- Allows best-in-class experience on each platform

**Implication:** Need storage abstraction interface

### Decision 3: Adjacency List for Task Tree
**Rationale:**
- Flexible depth
- Simple to query
- Easy to move nodes
- Standard pattern

**Implication:** Recursive queries needed, but libraries handle this well

### Decision 4: AI Provider Abstraction from Day 1
**Rationale:**
- AI landscape changes fast
- Want to experiment with providers
- Avoid vendor lock-in
- Easy to mock for testing

**Implication:** Slightly more upfront work, but pays off quickly

## Testing Strategy by Component

| Component | Testing Approach |
|-----------|------------------|
| Task Logic | Unit tests, mock database |
| Calendar Logic | Unit tests, pure functions |
| AI Service | Integration tests with mock provider |
| AI Providers | Integration tests with real APIs (in CI, not unit tests) |
| Storage | Integration tests, in-memory DB for speed |
| UI Components | Component tests, mock state |
| E2E | Playwright/Detox for critical flows |

## Sources

**Note:** This architecture is based on established patterns from my training knowledge (as of January 2025) for:
- Cross-platform to-do applications (e.g., Todoist, Things 3, Microsoft To Do architectural patterns)
- AI-integrated productivity tools
- Offline-first applications
- React/React Native best practices

**Confidence Level:** MEDIUM
- **HIGH confidence:** Core patterns (adjacency list, local-first, provider abstraction) are well-established
- **MEDIUM confidence:** Specific AI integration patterns are newer, evolving rapidly
- **LOW confidence:** Sync strategies at scale (deferred to later phases anyway)

**Recommended verification:**
- When implementing AI providers, check current API documentation for latest best practices
- Before choosing specific storage libraries, verify current maintenance status and React Native compatibility
- Validate state management choice against latest React/React Native recommendations

**Areas requiring phase-specific research:**
- Phase 2: Latest AI provider APIs and best practices for structured output
- Phase 3: Current drag-and-drop library options for React/React Native
- Phase 4: Sync conflict resolution strategies when that phase begins
