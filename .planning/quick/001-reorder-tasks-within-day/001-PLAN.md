---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/db/hooks.ts
  - src/components/dnd/DndProvider.tsx
  - src/components/dnd/DroppableDay.tsx
  - src/components/list/DayGroup.tsx
  - src/components/calendar/DayCell.tsx
autonomous: true
requirements: [REORDER-01]

must_haves:
  truths:
    - "User can drag a task up or down within a day to reorder it in list view"
    - "User can drag a task up or down within a day to reorder it in calendar view"
    - "Reordered position persists across page refresh"
    - "Reordered position syncs to Firebase (sortOrder field already on Task type)"
    - "Cross-day drag-and-drop still works as before"
  artifacts:
    - path: "src/db/hooks.ts"
      provides: "Tasks sorted by sortOrder in query hooks"
    - path: "src/components/dnd/DndProvider.tsx"
      provides: "Handles both sortable reorder and cross-day drop"
    - path: "src/components/list/DayGroup.tsx"
      provides: "SortableContext wrapping task list in list view"
    - path: "src/components/calendar/DayCell.tsx"
      provides: "SortableContext wrapping task list in calendar view"
  key_links:
    - from: "DndProvider.tsx handleDragEnd"
      to: "db.tasks.update (sortOrder)"
      via: "arrayMove index calculation then bulk sortOrder update"
      pattern: "db\\.tasks\\.update.*sortOrder"
    - from: "DayGroup.tsx / DayCell.tsx"
      to: "@dnd-kit/sortable SortableContext"
      via: "wraps task list with sortable item IDs"
      pattern: "SortableContext"
---

<objective>
Add within-day task reordering via drag-and-drop using @dnd-kit/sortable (already installed).

Purpose: Users need to prioritize tasks within a day by arranging them in their preferred order, not just move tasks between days.

Output: Sortable task lists in both list view and calendar view. Order persists in Dexie via the existing `sortOrder` field on the Task type, and syncs to Firebase automatically through existing Dexie hooks.
</objective>

<execution_context>
@C:/Users/JenLab-User/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/JenLab-User/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/types/index.ts
@src/db/database.ts
@src/db/hooks.ts
@src/components/dnd/DndProvider.tsx
@src/components/dnd/DraggableTask.tsx
@src/components/dnd/DroppableDay.tsx
@src/components/list/DayGroup.tsx
@src/components/calendar/DayCell.tsx
@src/firebase/sync.ts

<interfaces>
<!-- Key contracts the executor needs -->

From src/types/index.ts:
```typescript
export interface Task {
  id?: number;
  title: string;
  description: string;
  date: string; // 'YYYY-MM-DD' format
  status: TaskStatus;
  categoryId: number;
  parentId?: number;
  depth: number;
  sortOrder?: number; // <-- THIS IS THE KEY FIELD. Already exists, already syncs.
  energyLevel?: EnergyLevel | null;
  timeEstimate?: number | null;
  timeEstimateOverride?: number | null;
  isSomeday?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

From @dnd-kit/sortable (already in package.json v10.0.0):
```typescript
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
```

Note: @dnd-kit/sortable v10 has a different API from earlier versions. The executor
should check the installed version's exports. Key difference: v10 may use `arrayMove`
from `@dnd-kit/sortable` directly. If import issues arise, `arrayMove` logic is trivial:
`const arrayMove = (arr, from, to) => { const copy = [...arr]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy; };`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Sort tasks by sortOrder in hooks and initialize sortOrder on new tasks</name>
  <files>src/db/hooks.ts, src/db/database.ts</files>
  <action>
1. In `src/db/hooks.ts`, update `useTasksByDate` and `useTasksByDateRange` to sort results by `sortOrder` (ascending, nulls last) after filtering. Use `.toArray()` then sort in JS since Dexie compound indexes are not needed for this:
   - After the `.toArray()` call, chain `.then(tasks => tasks.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)))`.
   - This ensures tasks with no sortOrder (legacy data) appear at the end.

2. In `src/db/database.ts`, add `sortOrder` to the tasks index in the current schema version. Add a new Dexie version (v4) with the same stores but including `sortOrder` in the tasks index: `'++id, date, status, categoryId, parentId, depth, energyLevel, sortOrder'`. The upgrade function should assign `sortOrder` to existing tasks that have `sortOrder === undefined`: set `sortOrder = 0` for all root tasks (depth === 0) so they have a baseline. This ensures existing tasks get a sort position.

Note: New tasks created via TaskInlineCreate or the modal will get `sortOrder` undefined initially, which sorts them to the end. When the user reorders, all tasks in that day get explicit sortOrder values. This is acceptable behavior -- new tasks appear at bottom until explicitly reordered.
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Query hooks return tasks sorted by sortOrder. Database schema upgraded to v4 with sortOrder index. Existing tasks get sortOrder=0 via migration.</done>
</task>

<task type="auto">
  <name>Task 2: Add sortable drag-and-drop within each day using @dnd-kit/sortable</name>
  <files>src/components/dnd/DndProvider.tsx, src/components/dnd/DraggableTask.tsx, src/components/list/DayGroup.tsx, src/components/calendar/DayCell.tsx</files>
  <action>
**DndProvider.tsx** -- Update handleDragEnd to detect same-day reorder vs cross-day move:

1. Import `arrayMove` from `@dnd-kit/sortable` (if v10 exports it; otherwise implement inline).
2. In `handleDragEnd`, the `over` target can now be either a droppable day (string date ID like "2026-03-09") or a sortable task (string ID like "task-42"). Detect which:
   - If `over.id` starts with `task-`, this is a same-day sortable reorder.
   - Otherwise, it is a cross-day drop (existing behavior).
3. For same-day sortable reorder:
   - Get the active task from `active.data.current.task`.
   - Get the over task ID: parse the number from `over.id` (e.g., "task-42" -> 42).
   - Both tasks share the same `date`. Query `db.tasks.where('date').equals(task.date)` to get all tasks for that day, sorted by `sortOrder`.
   - Filter to only root tasks (depth === 0, no parentId) since subtasks have their own ordering.
   - Find the indices of the active and over tasks in this sorted array.
   - Use `arrayMove` to compute the new order.
   - Bulk update all tasks in the reordered array with new `sortOrder` values (index * 1000 to leave gaps for future insertions) and `updatedAt: new Date()`. Use `db.tasks.bulkPut` or a loop of `db.tasks.update(id, { sortOrder, updatedAt })`.
   - Using index * 1000 spacing (0, 1000, 2000...) leaves room for later insertions without reindexing.
4. Keep existing cross-day drop logic unchanged.
5. Add `closestCenter` collision detection strategy from `@dnd-kit/core` to the DndContext (import it). This is needed for sortable to work properly -- the default `rectIntersection` does not work well with sortable items.

**DraggableTask.tsx** -- Convert from `useDraggable` to `useSortable`:

1. Replace `useDraggable` with `useSortable` from `@dnd-kit/sortable`.
2. `useSortable` provides the same `attributes`, `listeners`, `setNodeRef`, `transform`, `isDragging` plus a `transition` property.
3. Use `CSS.Transform.toString(transform)` for the transform style (already done).
4. Add `transition` to the style object.
5. Keep the same component API (props: task, children).
6. The `id` passed to `useSortable` should be `task-${task.id}` (same as before with useDraggable).
7. The `data` prop stays `{ task }`.

**DayGroup.tsx** -- Wrap task list in SortableContext:

1. Import `SortableContext` and `verticalListSortingStrategy` from `@dnd-kit/sortable`.
2. Compute `taskIds` array: `tasks.map(t => \`task-\${t.id}\`)`.
3. Wrap the tasks rendering `<div className="px-4 py-2 space-y-2 min-h-[40px]">` contents in `<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>`.
4. The DroppableDay wrapper stays in place for cross-day drops.

**DayCell.tsx** -- Wrap task list in SortableContext:

1. Same pattern as DayGroup: import SortableContext, compute taskIds from the tasks array, wrap the task map in SortableContext.
2. The DroppableDay wrapper stays for cross-day drops.
3. Use `verticalListSortingStrategy` here too.

**Important edge cases to handle:**
- If `over` is null in handleDragEnd, return early (already done).
- If `active.id === over.id`, return early (dropped on self, no-op).
- Only reorder root tasks (filter out tasks with parentId when computing sortable items). Subtasks have their own sort within their parent.
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Tasks within a day can be reordered by dragging up/down. Cross-day drag still works. sortOrder values are persisted to Dexie (which triggers Firebase sync automatically via existing hooks). Both list view and calendar view support within-day reordering.</done>
</task>

</tasks>

<verification>
1. TypeScript compilation passes with no errors.
2. Production build succeeds.
3. In list view: drag a task up or down within a day group -- it reorders and the new order persists after page refresh.
4. In calendar month view: drag a task within a day cell to reorder -- persists after refresh.
5. Cross-day drag-and-drop still works (drag task from one day to another).
6. sortOrder field updates are visible in Firebase console (if sync is enabled).
</verification>

<success_criteria>
- Within-day task reordering works in both list and calendar views via drag-and-drop.
- Order persists in Dexie via sortOrder field.
- Firebase sync works automatically (no sync code changes needed -- sortOrder is already a Task field).
- Cross-day drag-and-drop is not broken.
- No TypeScript errors, build succeeds.
</success_criteria>

<output>
After completion, create `.planning/quick/001-reorder-tasks-within-day/001-SUMMARY.md`
</output>
