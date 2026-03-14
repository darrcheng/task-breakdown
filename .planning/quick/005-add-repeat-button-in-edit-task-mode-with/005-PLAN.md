---
phase: quick-005
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/task/TaskForm.tsx
  - src/components/task/TaskModal.tsx
  - src/components/task/RepeatModal.tsx
autonomous: false
requirements: [REPEAT-01]
must_haves:
  truths:
    - "User sees a Repeat button in the edit task action bar"
    - "Clicking Repeat opens a sub-modal with daily/select-dates options and a count input"
    - "Submitting the repeat form creates independent duplicate tasks on the specified dates"
    - "New tasks have the same title, description, category, energy, and status as the original"
  artifacts:
    - path: "src/components/task/RepeatModal.tsx"
      provides: "Repeat configuration sub-modal"
    - path: "src/components/task/TaskForm.tsx"
      provides: "Repeat button in action bar"
    - path: "src/components/task/TaskModal.tsx"
      provides: "Repeat modal state management and task duplication logic"
  key_links:
    - from: "src/components/task/TaskForm.tsx"
      to: "src/components/task/TaskModal.tsx"
      via: "onRepeat callback prop"
      pattern: "onRepeat"
    - from: "src/components/task/TaskModal.tsx"
      to: "src/components/task/RepeatModal.tsx"
      via: "renders RepeatModal with isOpen state"
      pattern: "RepeatModal"
    - from: "src/components/task/TaskModal.tsx"
      to: "db.tasks"
      via: "bulkAdd for duplicate task creation"
      pattern: "db\\.tasks\\.(bulkAdd|add)"
---

<objective>
Add a "Repeat" button to the edit task action bar that opens a sub-modal for creating duplicate tasks on multiple dates. Supports daily repetition (N days forward from task date) or manual date selection.

Purpose: Let users quickly duplicate a task across multiple days without manually creating each one.
Output: Working repeat feature with sub-modal UI and bulk task creation.
</objective>

<execution_context>
@C:/Users/JenLab-User/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/JenLab-User/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/task/TaskForm.tsx
@src/components/task/TaskModal.tsx
@src/types/index.ts
@src/db/database.ts
@src/utils/dates.ts

<interfaces>
From src/types/index.ts:
```typescript
export interface Task {
  id?: number;
  title: string;
  description: string;
  date: string; // 'YYYY-MM-DD'
  status: TaskStatus;
  categoryId: number;
  parentId?: number;
  depth: number;
  sortOrder?: number;
  energyLevel?: EnergyLevel | null;
  timeEstimate?: number | null;
  timeEstimateOverride?: number | null;
  isSomeday?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

From src/db/database.ts:
```typescript
const db: Dexie & {
  tasks: EntityTable<Task, 'id'>;
  // ...
};
```

From src/components/task/TaskForm.tsx:
```typescript
// Actions bar (line 257-293): left side has Delete button, right side has Cancel/Create for new tasks
// onDelete prop controls delete button visibility
// isEditing prop controls whether in edit mode
```

From src/utils/dates.ts:
```typescript
export function formatDateKey(date: Date): string; // 'yyyy-MM-dd'
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RepeatModal component and wire Repeat button into TaskForm</name>
  <files>src/components/task/RepeatModal.tsx, src/components/task/TaskForm.tsx</files>
  <action>
**RepeatModal.tsx** — Create a new component that renders as a modal/overlay for configuring task repetition:

Props: `isOpen: boolean`, `onClose: () => void`, `onSubmit: (dates: string[]) => void`, `taskDate: string` (the original task's date, used as start for daily mode).

UI layout:
- Title: "Repeat Task"
- Two mode tabs/buttons: "Daily" (default) and "Select Dates"
- **Daily mode**: A single number input labeled "Number of days" (min 1, max 30, default 3). This creates copies on N consecutive days starting from the day AFTER the task's date. Show a preview line like "Creates 3 tasks: Mar 15, Mar 16, Mar 17".
- **Select dates mode**: Show a simple multi-date picker. Reuse the existing `DatePicker` component pattern but allow clicking multiple dates. Simplest approach: render a list of date inputs where user can add/remove dates. Start with one date input and an "Add date" button (max 10). Each date input uses `<input type="date">`.
- Bottom row: "Cancel" and "Create N tasks" buttons. The submit button should show the count and be disabled if no dates selected.
- On submit, compute the array of date strings (YYYY-MM-DD format) and call `onSubmit(dates)`.

Use `date-fns` `addDays` and `format` for daily date computation (already in project deps). Import `format` from date-fns and use `'yyyy-MM-dd'` format.

Style consistently with existing modals — white bg, rounded-lg, shadow-xl, slate color scheme, blue action buttons. Render as a fixed overlay with backdrop (same z-index pattern as ProviderSetupModal).

**TaskForm.tsx** — Add a "Repeat" button to the left of the Delete button in the actions bar:

1. Add `onRepeat?: () => void` to `TaskFormProps` interface.
2. In the actions bar (the `<div className="flex items-center justify-between ...">` at line ~258), add a Repeat button before the Delete button, inside the left-side `<div>`. Use `import { Repeat } from 'lucide-react'` for the icon.
3. Only show the Repeat button when `onRepeat` is defined (same pattern as onDelete).
4. Button styling: `text-blue-600 hover:bg-blue-50` with the Repeat icon and "Repeat" label, matching the delete button's size/padding pattern (`px-3 py-1.5 text-sm font-medium rounded-md`).
5. The left-side div should use `flex items-center gap-2` to space Repeat and Delete buttons.
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>RepeatModal component exists with daily/select-dates modes. TaskForm shows a Repeat button to the left of Delete in edit mode. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Wire repeat flow in TaskModal — state management and bulk task creation</name>
  <files>src/components/task/TaskModal.tsx</files>
  <action>
In TaskModal.tsx:

1. Import `RepeatModal` from `./RepeatModal`.
2. Add state: `const [showRepeatModal, setShowRepeatModal] = useState(false);`
3. Pass `onRepeat={() => setShowRepeatModal(true)}` to `TaskForm` (only when `isEditing` is true, same condition as onDelete).
4. Create `handleRepeatSubmit` async function that receives `dates: string[]`:
   - For each date in the array, create a new task by calling `db.tasks.add({...})` with the current task's properties:
     - Copy: `title`, `description`, `status` (reset to `'todo'`), `categoryId`, `depth`, `energyLevel`, `timeEstimate`, `timeEstimateOverride`
     - Set: `date` to the target date, `createdAt` and `updatedAt` to `new Date()`
     - Do NOT copy: `id`, `parentId`, `sortOrder`, `isSomeday` — these are fresh independent tasks
   - Use `Promise.all` with individual `db.tasks.add()` calls (or `db.tasks.bulkAdd` for efficiency).
   - After creation, close the repeat modal: `setShowRepeatModal(false)`.
   - Do NOT close the main TaskModal — user stays on the original task.
5. Render `RepeatModal` at the end of `modalContent`, conditionally:
   ```tsx
   {showRepeatModal && currentTask && (
     <RepeatModal
       isOpen={showRepeatModal}
       onClose={() => setShowRepeatModal(false)}
       onSubmit={handleRepeatSubmit}
       taskDate={currentTask.date}
     />
   )}
   ```
   Since RepeatModal renders as a fixed overlay, it will appear on top of both desktop modal and mobile BottomSheet.
6. Reset `showRepeatModal` to false in the existing `useEffect` that runs on `[isOpen, task]` (the reset block around line 54-60).
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Clicking Repeat in edit mode opens RepeatModal. Submitting creates independent duplicate tasks on chosen dates. Original task is preserved. TypeScript compiles cleanly.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Repeat button and sub-modal for creating duplicate tasks across multiple dates</what-built>
  <how-to-verify>
    1. Run `npm run dev` and open the app
    2. Click an existing task to open the edit modal
    3. Verify a "Repeat" button appears in the bottom action bar, to the left of the Delete button
    4. Click "Repeat" — a sub-modal should appear
    5. In Daily mode: set count to 3, verify preview shows 3 consecutive dates after the task's date
    6. Click "Create 3 tasks" — verify 3 new tasks appear on those calendar dates
    7. Switch to "Select Dates" mode, add 2 specific dates, submit — verify tasks created on those dates
    8. Verify duplicated tasks have same title/description/category/energy but are independent (editing one does not affect others)
    9. Test on mobile viewport — repeat button and modal should work in the bottom sheet
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `npx tsc --noEmit`
- App builds successfully: `npm run build`
- Repeat button visible only in edit mode (not new task mode)
- Daily mode creates correct number of tasks on consecutive dates
- Select dates mode creates tasks on chosen dates
- Duplicated tasks are fully independent (no parentId link, no shared state)
</verification>

<success_criteria>
Users can duplicate any existing task across multiple dates using either daily repetition or manual date selection. Created tasks are independent copies with reset status.
</success_criteria>

<output>
After completion, create `.planning/quick/005-add-repeat-button-in-edit-task-mode-with/005-SUMMARY.md`
</output>
