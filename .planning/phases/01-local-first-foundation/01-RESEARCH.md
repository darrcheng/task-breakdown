# Phase 1: Local-First Foundation - Research

**Researched:** 2026-02-22
**Domain:** React task management with calendar UI, local-first storage, drag-and-drop
**Confidence:** HIGH

## Summary

Phase 1 builds a React-based task management app with two views (calendar grid and list), local-first data persistence via IndexedDB, and drag-to-reschedule between days. The modern React ecosystem in 2026 provides mature, well-documented solutions for every piece of this phase: Vite + TypeScript for tooling, Dexie.js for IndexedDB abstraction with reactive queries, dnd-kit for accessible drag-and-drop, and date-fns for calendar math.

The calendar view should be built as a custom grid component rather than using a heavyweight calendar library like FullCalendar or react-big-calendar. Those libraries are designed for time-slot scheduling (Google Calendar-style events with start/end times), which adds complexity and constraints we don't need. Our calendar shows task cards per day with no time slots -- a custom CSS grid is simpler, more flexible, and easier to integrate with dnd-kit for drag-between-days.

**Primary recommendation:** Custom React calendar grid + Dexie.js + dnd-kit + date-fns, scaffolded with Vite + TypeScript + Tailwind CSS. No heavyweight calendar libraries.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Web-first (Phase 4 adds mobile parity)
- React frontend framework
- Local data storage approach at Claude's discretion
- **Calendar view:** Monthly grid, continuous month-to-month, with weekly view toggle
- **List view:** Infinite scroll day-by-day (like Google Calendar's Schedule view), with a "Today" button to jump to current day
- Calendar view: Click a day -> popup modal with title, status, category, description (Google Calendar-style)
- List view: Click a day -> inline input for task creation
- Calendar view: Click existing task -> popup modal (same as creation, pre-filled with task details)
- List view: Click existing task -> inline expand to edit in place
- Categories: Presets + custom, ship with sensible defaults (e.g., Work, Personal), user can add/edit their own
- Category represented by an icon on task cards
- Three states: To-do -> In progress -> Done
- Status indicated by task box color in both views
- Status colors at Claude's discretion (accessible and ADHD-friendly)
- Task card (calendar view): category icon + task title, box color encodes status
- Day boxes expand vertically to fit all tasks (no overflow truncation or "+N more")
- Drag-to-reschedule works in both calendar view and list view
- Completed tasks disappear from view by default
- Global toggle to show/hide completed tasks across all days
- Empty state: Clean view with subtle hint "Click a day to add your first task"
- No onboarding walkthrough

### Claude's Discretion
- Local storage implementation (IndexedDB, localStorage, etc.)
- Status color palette
- List view task card detail level
- Calendar grid spacing and typography
- Loading states and error handling
- Exact category preset list and icons

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TASK-01 | User can create a task via single-input quick capture | Modal (calendar) / inline input (list) -- standard React form patterns, Dexie `table.add()` |
| TASK-02 | User can view tasks in a daily calendar view | Custom CSS grid calendar component with date-fns for date math |
| TASK-03 | User can drag tasks between calendar days to reschedule | dnd-kit with DndContext + useDroppable per day cell + useDraggable per task |
| TASK-04 | User can edit task title and details inline | Modal (calendar) / inline expand (list) -- controlled form components, Dexie `table.update()` |
| TASK-05 | User can delete a task | Dexie `table.delete()` with confirmation UX |
| TASK-06 | User can mark a task as done (clears from calendar view) | Status field toggle via Dexie, filtered out of default view, global toggle to show |
| PLAT-03 | Data persists across sessions | Dexie.js wrapping IndexedDB -- data survives browser close, tab close, refresh |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | User decision (locked) |
| TypeScript | 5.x | Type safety | Industry standard for React apps in 2026 |
| Vite | 6.x | Build tool + dev server | Fastest DX: sub-second HMR, native ESM, React SWC plugin |
| Dexie.js | 4.x | IndexedDB wrapper with reactive queries | Only ~29KB gzipped, `useLiveQuery` hook auto-updates components on data change |
| dexie-react-hooks | 4.x | React bindings for Dexie | `useLiveQuery()` for reactive data, `useSuspendingLiveQuery()` for Suspense |
| @dnd-kit/core | 6.x | Drag-and-drop foundation | Modular, 12KB gzipped, accessible, 60fps with hundreds of items |
| @dnd-kit/sortable | 10.x | Sortable preset for dnd-kit | Multi-container support for dragging tasks between day cells |
| @dnd-kit/utilities | 3.x | DnD utility functions | CSS transform helpers, sensor utilities |
| date-fns | 4.x | Date manipulation | Tree-shakeable (import only what you use), functional API, immutable |
| Tailwind CSS | 4.x | Utility-first CSS | Zero runtime overhead, design-system constraints, rapid prototyping |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/vite | 4.x | Tailwind Vite integration | Build-time CSS generation |
| lucide-react | latest | Icons (categories, UI controls) | Category icons on task cards, navigation, action buttons |
| clsx | latest | Conditional class joining | Status-based color classes, active states |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom calendar grid | react-big-calendar / FullCalendar | Heavyweight, time-slot-oriented, harder to integrate dnd-kit, overkill for task cards |
| Dexie.js | localStorage / raw IndexedDB | localStorage: 5MB limit, no queries, no reactivity. Raw IndexedDB: verbose, error-prone API |
| dnd-kit | react-beautiful-dnd / hello-pangea/dnd | react-beautiful-dnd in maintenance mode; hello-pangea/dnd is list-oriented, dnd-kit handles arbitrary drop zones better |
| date-fns | dayjs | dayjs is 2KB lighter but date-fns tree-shakes better for selective imports; either works |
| Tailwind CSS | CSS Modules / styled-components | CSS Modules lack design constraints; styled-components adds runtime overhead |
| Zustand | React Context | Context causes full-tree re-renders; but for Phase 1 complexity, Context is sufficient. Zustand recommended if perf issues arise |

**Installation:**
```bash
npm create vite@latest task-breakdown -- --template react-swc-ts
cd task-breakdown
npm install dexie dexie-react-hooks @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns lucide-react clsx
npm install -D @tailwindcss/vite tailwindcss
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── calendar/          # CalendarGrid, DayCell, WeekView, MonthNavigation
│   ├── list/              # ListView, DayGroup, TaskListItem
│   ├── task/              # TaskCard, TaskModal, TaskInlineEdit, TaskForm
│   ├── dnd/               # DndProvider, DraggableTask, DroppableDay
│   └── ui/                # Button, Modal, Toggle, Icon, EmptyState
├── db/
│   ├── database.ts        # Dexie database class, schema, migrations
│   └── hooks.ts           # Custom hooks wrapping useLiveQuery (useTasksByDate, etc.)
├── types/
│   └── index.ts           # Task, Category, TaskStatus, ViewMode types
├── utils/
│   ├── dates.ts           # date-fns wrappers for calendar math
│   └── categories.ts      # Default categories, icon mapping
├── App.tsx                # Root: view toggle, DnD context, main layout
└── main.tsx               # Vite entry point
```

### Pattern 1: Reactive Database Queries with Dexie

**What:** Use `useLiveQuery` to subscribe to IndexedDB data. Components auto-update when data changes -- no manual state sync needed.
**When to use:** Every component that reads task data.
**Example:**
```typescript
// db/database.ts
import Dexie, { type EntityTable } from 'dexie';

interface Task {
  id?: number;
  title: string;
  description: string;
  date: string;        // ISO date string 'YYYY-MM-DD'
  status: 'todo' | 'in-progress' | 'done';
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

const db = new Dexie('TaskBreaker') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  categories: EntityTable<Category, 'id'>;
};

db.version(1).stores({
  tasks: '++id, date, status, categoryId',
  categories: '++id, name'
});

export { db };

// db/hooks.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';

export function useTasksByDate(date: string, showCompleted: boolean) {
  return useLiveQuery(
    () => {
      let query = db.tasks.where('date').equals(date);
      if (!showCompleted) {
        return query.filter(t => t.status !== 'done').toArray();
      }
      return query.toArray();
    },
    [date, showCompleted]
  );
}
```

### Pattern 2: dnd-kit Multi-Container (Days as Drop Zones)

**What:** Each calendar day cell is a droppable container. Tasks are draggable items. Dragging a task to a different day updates its `date` field.
**When to use:** Calendar view and list view for task rescheduling.
**Example:**
```typescript
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';

function DroppableDay({ dateStr, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  return (
    <div ref={setNodeRef} className={isOver ? 'bg-blue-50' : ''}>
      {children}
    </div>
  );
}

function DraggableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });
  // ... render task card with drag handle
}

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.data.current?.task) {
    const task = active.data.current.task;
    const newDate = over.id as string;  // droppable ID = date string
    db.tasks.update(task.id, { date: newDate, updatedAt: new Date() });
    // useLiveQuery auto-updates all affected day cells
  }
}
```

### Pattern 3: Custom Calendar Grid with date-fns

**What:** Build the monthly calendar as a CSS grid. Use date-fns to compute days in month, start/end offsets, week numbers.
**When to use:** Calendar view rendering.
**Example:**
```typescript
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday
} from 'date-fns';

function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  return eachDayOfInterval({ start, end });
}

// Renders a 7-column grid with day cells
function CalendarGrid({ month }: { month: Date }) {
  const days = getCalendarDays(month);
  return (
    <div className="grid grid-cols-7 gap-px">
      {days.map(day => (
        <DroppableDay key={format(day, 'yyyy-MM-dd')} dateStr={format(day, 'yyyy-MM-dd')}>
          <DayCell day={day} isCurrentMonth={isSameMonth(day, month)} />
        </DroppableDay>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Storing dates as Date objects in IndexedDB:** Use ISO strings (`YYYY-MM-DD`) for date-only fields. IndexedDB can index strings but Date comparison is unreliable across browsers.
- **Re-rendering entire calendar on any task change:** Use `useLiveQuery` scoped per day cell, not a single query for all tasks in the month.
- **Putting DnD state in React state:** Let dnd-kit manage drag state internally. Only update Dexie on `onDragEnd`, and `useLiveQuery` handles the re-render.
- **Using FullCalendar/react-big-calendar for simple task cards:** These impose time-slot UX and are hard to customize for card-based layouts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD + reactivity | Custom IndexedDB wrapper | Dexie.js + useLiveQuery | IndexedDB API is notoriously verbose and error-prone; Dexie handles versioning, migrations, compound indexes, and reactive queries |
| Drag-and-drop between containers | Custom mouse/touch event handling | dnd-kit | Accessibility (keyboard DnD, screen readers), touch support, collision detection algorithms, smooth animations |
| Calendar date math | Manual date arithmetic | date-fns | Timezone bugs, DST edge cases, locale handling, week-start day variations |
| CSS utility system | Custom CSS variables/classes | Tailwind CSS | Consistent spacing/color scale, responsive design, dark mode (future), purged unused styles |
| Modal/dialog behavior | Custom modal with portal + focus trap | HTML `<dialog>` element + minimal wrapper | Native focus trapping, Esc to close, backdrop click, accessible by default |

**Key insight:** Every "simple" thing in this list has 10+ edge cases. IndexedDB transactions fail silently. Drag-and-drop needs touch, keyboard, and screen reader support. Date math breaks at DST boundaries. Use proven solutions.

## Common Pitfalls

### Pitfall 1: IndexedDB Schema Migrations
**What goes wrong:** Changing the schema (adding/removing indexes) without bumping the version number causes silent failures or data loss.
**Why it happens:** IndexedDB only runs upgrade transactions when the version number increases.
**How to avoid:** Always bump `db.version(N)` when changing `.stores()` definitions. Never delete a version -- keep the chain.
**Warning signs:** Data disappearing after code changes, "VersionError" in console.

### Pitfall 2: Calendar Grid Overflow
**What goes wrong:** Day cells with many tasks overflow their grid row, overlapping adjacent rows.
**Why it happens:** Fixed-height grid rows can't accommodate variable content.
**How to avoid:** Use `grid-auto-rows: min-content` or flexbox with auto-sizing rows. The user explicitly requires day boxes to expand vertically (no "+N more" truncation).
**Warning signs:** Tasks visually overlapping, scrollbars appearing inside day cells.

### Pitfall 3: Drag Preview Position Offset
**What goes wrong:** The drag preview (overlay) appears offset from the cursor, especially with CSS transforms or scrolled containers.
**Why it happens:** dnd-kit calculates positions relative to the viewport; CSS transforms and scroll offsets can shift the reference point.
**How to avoid:** Use `DragOverlay` component for custom drag previews. Avoid nesting draggables inside transformed containers.
**Warning signs:** Drag preview jumps when drag starts, preview not under cursor.

### Pitfall 4: useLiveQuery Returning Undefined
**What goes wrong:** Components flash empty state on mount before data loads.
**Why it happens:** `useLiveQuery` returns `undefined` on first render while the async IndexedDB query resolves.
**How to avoid:** Use `useSuspendingLiveQuery` with React Suspense boundaries, or handle the `undefined` initial state with a loading indicator.
**Warning signs:** Flash of empty content on page load or navigation.

### Pitfall 5: Infinite Scroll Performance (List View)
**What goes wrong:** List view becomes sluggish with months of data loaded into the DOM.
**Why it happens:** Rendering hundreds of day groups with tasks creates thousands of DOM nodes.
**How to avoid:** Virtualize the list view. Use `IntersectionObserver` to lazy-load day groups as the user scrolls. Only query tasks for visible date ranges.
**Warning signs:** Scroll jank, high memory usage, slow initial render.

### Pitfall 6: Date String Timezone Mismatch
**What goes wrong:** A task created on "Feb 22" appears on "Feb 21" for some users.
**Why it happens:** Converting between Date objects and date strings without controlling timezone. `new Date('2026-02-22')` is parsed as UTC midnight, which is Feb 21 in negative UTC-offset timezones.
**How to avoid:** Store dates as plain `YYYY-MM-DD` strings. Use `format(date, 'yyyy-MM-dd')` from date-fns (which uses local timezone). Never parse date-only strings with `new Date()`.
**Warning signs:** Off-by-one-day errors, tasks appearing on wrong days.

## Code Examples

### Database Setup with Seed Data
```typescript
// db/database.ts
import Dexie, { type EntityTable } from 'dexie';

export interface Task {
  id?: number;
  title: string;
  description: string;
  date: string;                              // 'YYYY-MM-DD'
  status: 'todo' | 'in-progress' | 'done';
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: string;
  name: string;
  icon: string;       // lucide icon name
  isDefault: boolean;
}

export const db = new Dexie('TaskBreaker') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  categories: EntityTable<Category, 'id'>;
};

db.version(1).stores({
  tasks: '++id, date, status, categoryId',
  categories: '++id, name'
});

// Seed default categories on first use
db.on('populate', (tx) => {
  tx.table('categories').bulkAdd([
    { name: 'Work', icon: 'briefcase', isDefault: true },
    { name: 'Personal', icon: 'user', isDefault: true },
    { name: 'Health', icon: 'heart', isDefault: true },
    { name: 'Learning', icon: 'book-open', isDefault: true },
    { name: 'Errands', icon: 'shopping-cart', isDefault: true },
  ]);
});
```

### Task CRUD Operations
```typescript
// Create
await db.tasks.add({
  title: 'Buy groceries',
  description: '',
  date: '2026-02-22',
  status: 'todo',
  categoryId: 'personal',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Update
await db.tasks.update(taskId, {
  title: 'Updated title',
  updatedAt: new Date(),
});

// Delete
await db.tasks.delete(taskId);

// Mark done
await db.tasks.update(taskId, {
  status: 'done',
  updatedAt: new Date(),
});
```

### Status Color Mapping (ADHD-Friendly)
```typescript
// Accessible, distinct, calming palette
const STATUS_COLORS = {
  'todo': {
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-700',
  },
  'in-progress': {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
  },
  'done': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
  },
} as const;
```

### Modal Using Native dialog Element
```typescript
import { useRef, useEffect } from 'react';

function TaskModal({ isOpen, onClose, children }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-lg p-0 backdrop:bg-black/50"
    >
      {children}
    </dialog>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite (with SWC) | 2023-2024 | 10-20x faster dev server startup, native ESM |
| react-beautiful-dnd | dnd-kit / hello-pangea/dnd | 2023 | react-beautiful-dnd in maintenance mode; dnd-kit is the modern choice |
| Moment.js | date-fns / dayjs | 2020 | Moment.js deprecated; date-fns tree-shakes, dayjs is tiny |
| localStorage for app data | IndexedDB via Dexie.js | Always (but more common now) | localStorage has 5MB limit, no queries, blocks main thread |
| styled-components (CSS-in-JS) | Tailwind CSS / CSS Modules | 2023-2025 | Zero runtime overhead, better performance with RSC |
| Custom modals with portals | Native `<dialog>` element | 2023-2024 | Built-in focus trap, backdrop, keyboard handling |

**Deprecated/outdated:**
- Create React App: No longer maintained, Vite is the standard
- react-beautiful-dnd: Maintenance mode since 2023, use dnd-kit or hello-pangea/dnd
- Moment.js: Officially deprecated, use date-fns or dayjs

## Open Questions

1. **Weekly view toggle -- separate component or same grid?**
   - What we know: User wants a toggle between monthly grid and weekly view
   - What's unclear: Whether weekly view is a 7-column single-row grid or a different layout entirely
   - Recommendation: Same CalendarGrid component with a `view` prop that controls how many weeks to render (1 for weekly, full month for monthly). Keeps DnD integration consistent.

2. **Continuous month-to-month scrolling**
   - What we know: User wants continuous months (not pagination with prev/next buttons only)
   - What's unclear: Whether this means infinite scroll of months or smooth transition between months
   - Recommendation: Start with prev/next month navigation (simpler, standard). Continuous scrolling can be added later if needed -- it requires virtualization which adds significant complexity.

3. **List view infinite scroll granularity**
   - What we know: "Infinite scroll day-by-day" like Google Calendar schedule view
   - What's unclear: How many days to pre-load, how far back/forward to allow scrolling
   - Recommendation: Load current week + 2 weeks ahead. Use IntersectionObserver to load more as user scrolls. "Today" button scrolls to current date.

## Sources

### Primary (HIGH confidence)
- Dexie.js official docs (dexie.org) -- useLiveQuery API, schema versioning, React hooks
- dnd-kit official docs (docs.dndkit.com) -- DndContext, useDroppable, useDraggable, multi-container patterns
- date-fns official docs (date-fns.org) -- calendar date utilities, formatting
- Vite official docs (vite.dev) -- project scaffolding, React SWC template

### Secondary (MEDIUM confidence)
- npm registry -- current versions: Dexie 4.3.0, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- LogRocket Blog -- Kanban board with dnd-kit (verified patterns match official docs)
- Builder.io -- React calendar library comparison (cross-verified with npm download counts)

### Tertiary (LOW confidence)
- Community discussions on optimal calendar grid implementation (custom vs library) -- consensus favors custom for simple card-based views but limited formal benchmarks

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are well-established, actively maintained, with official docs verified
- Architecture: HIGH -- patterns are standard React + documented library usage
- Pitfalls: HIGH -- common issues well-documented in official docs and community sources

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable ecosystem, no major changes expected)
