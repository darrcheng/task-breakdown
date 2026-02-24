---
phase: 03-adhd-optimized-ux
verified: 2026-02-23T01:00:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  new_plans_verified:
    - "03-08: Double-rAF celebration animation, STATUS_COLORS[displayStatus] green background, setDepartingPhase(null)-before-DB-write Dexie race fix — applied to TaskListItem and SubtaskRow"
    - "03-09: Gemma systemInstruction 400 fix (isGemmaModel() helper), TaskInlineCreate submit button + form.requestSubmit() Enter handler, TaskForm sticky bottom-0 action bar"
    - "03-10: Send-to-Someday buttons on TaskModal and TaskListItem, subtask count/progress badges on TaskCard and TaskListItem (useSubtasks liveQuery)"
human_verification:
  - test: "Celebration animation — green background appears during departure"
    expected: "Completing a task in list view shows the row background turning green immediately (STATUS_COLORS[displayStatus] = done = emerald-50 / emerald-300 border), then the emerald ring appears, then the row fades out over 1.5s. Background is NOT amber/yellow during the 1.5s window."
    why_human: "STATUS_COLORS[displayStatus] fix means the background color is driven by optimistic local state, not DB prop — requires visual confirmation that green appears immediately at click time"
  - test: "Celebration animation — double-rAF ring visibly precedes fade"
    expected: "The emerald ring glow is clearly visible for at least one paint frame before opacity-0 kicks in. Completing a subtask shows the same ring-then-fade. Re-clicking during fade reverts to todo."
    why_human: "Double-rAF timing (nested requestAnimationFrame) cannot be verified programmatically — requires eyes-on inspection to confirm ring phase is perceptible"
  - test: "Celebration animation — show-completed no flash"
    expected: "With show-completed toggled on, completing a task smoothly transitions to a green done-state row. No disappear-then-reappear flash occurs."
    why_human: "setDepartingPhase(null)-before-DB-write fix prevents Dexie liveQuery race — requires live interaction with show-completed enabled"
  - test: "Start-here ring moves reactively between subtasks"
    expected: "First incomplete subtask has a violet ring border (ring-2 ring-violet-400). No text label. Completing that subtask moves the ring to the next incomplete one after departure resolves."
    why_human: "Reactive Dexie-to-render round-trip timing and visual ring positioning require live interaction to verify"
  - test: "Energy filter applies to both calendar and list views"
    expected: "Clicking a Low/Medium/High chip in the header filters tasks in all views. Tasks with no energy level set disappear when a filter is active. Clicking the active chip again clears the filter and shows all tasks."
    why_human: "Cross-view filter behavior and empty-energy-level hide behavior require live interaction to confirm"
  - test: "AI time estimate appears on task card after creation"
    expected: "After creating a task (with AI configured), a time estimate badge (~Xm or ~Xh) appears on the task card within a few seconds without blocking the UI. Opening the task modal shows the Clock icon estimate with Pencil override. Entering an override, pressing Enter, saves it and it replaces the AI estimate on the card."
    why_human: "Requires a live AI provider configured and real network request — cannot verify background estimation timing or override persistence programmatically"
  - test: "AI breakdown works for Gemma models (no 400 error)"
    expected: "Select gemma-3-27b-it or gemma-3-12b-it in settings. Click 'Break it down' on any task. Subtask generation starts without a 400 error. System prompt is prepended to the user message instead of sent as systemInstruction."
    why_human: "Requires live Gemma API key and network request to confirm the isGemmaModel() conditional path works correctly"
  - test: "AI breakdown works immediately on page load (no race)"
    expected: "With an AI provider configured, hard refresh the page. Within 1 second, click 'Break it down' on any task. Subtask generation starts immediately. The setup modal does NOT appear."
    why_human: "The stale isConfigured race condition fix requires live page load + immediate breakdown attempt timing"
  - test: "Enter key in inline create submits task"
    expected: "Switch to list view, press Enter to open inline create. Type a task title, press Enter — the task is created and focus returns to the input for rapid entry. The 'Add' button is also visible."
    why_human: "form.requestSubmit() cross-browser behavior and rapid-entry loop require live interaction to confirm"
  - test: "Create/Save button always visible in task modal"
    expected: "Open new task modal from a calendar day click (modal has 700px maxHeight). The Create button is visible at the bottom without scrolling. Scroll the form — button stays pinned."
    why_human: "sticky bottom-0 positioning inside overflow-y-auto container requires visual confirmation that the button does not scroll away"
  - test: "Send to Someday from task modal"
    expected: "Open any saved task. An amber 'Send to Someday' button with Archive icon is visible below the TaskForm. Click it — task disappears from calendar, modal closes, task appears in Someday view."
    why_human: "isSomeday: true DB write and cross-view appearance need live DB observation"
  - test: "Send to Someday from list view hover"
    expected: "In list view, hover over a task row. An Archive icon button appears (group-hover). Click it — task disappears from list and appears in Someday view. Row click does not fire (stopPropagation)."
    why_human: "group-hover opacity transition and stopPropagation behavior require live interaction to confirm"
  - test: "Subtask progress badge on calendar cards and list items"
    expected: "A task with 3 subtasks (1 done) shows a '1/3' badge with ListTree icon on its calendar card and list item. Completing a second subtask changes it to '2/3' reactively without page reload."
    why_human: "Dexie liveQuery reactive update and badge rendering require live data with real subtasks"
  - test: "Overdue banner tone is warm and guilt-free, daily dismissal persists"
    expected: "Banner text is warm, no guilt language. Amber background. Dismissed banner stays gone after page refresh. Tomorrow it reappears."
    why_human: "UX tone quality and time-based localStorage reset cannot be tested without manipulating system time"
  - test: "Quick picker inline calendar opens immediately on click"
    expected: "Clicking the Calendar icon on an overdue task in the Quick Picker reveals an inline calendar grid immediately (no second click needed). Selecting a date reschedules and removes the task from the picker."
    why_human: "Inline rendering and immediate calendar visibility require live interaction to confirm DatePicker defaultOpen/inline props work as intended"
  - test: "AI breakdown button visible immediately after task creation"
    expected: "Creating a new task via modal keeps the modal open in edit view showing the BreakdownButton immediately. No need to re-open the task."
    why_human: "setNavigationOverride(newTask) state transition and BreakdownButton visibility need live observation"
  - test: "Modal autosave on Escape and backdrop click"
    expected: "Editing a task title then pressing Escape saves the change before closing. Clicking outside the modal saves. With empty title, modal closes without saving."
    why_human: "formRef.current?.submit() return value logic and autosave edge cases require live interaction"
  - test: "Someday view isolation and rescue"
    expected: "Tasks sent to Someday appear only in the Someday view, not in calendar or list. Clicking CalendarDays icon picks a date and sets isSomeday: false — task disappears from Someday and reappears on calendar."
    why_human: "Cross-view data isolation and rescue-then-calendar-appearance need live DB observation"
  - test: "No orphan subtasks in list view"
    expected: "Opening list view shows only root-level tasks (no subtasks appearing as standalone rows). Subtasks are only visible inside the parent task modal's SubtaskList."
    why_human: "The !t.parentId filter fix in hooks.ts needs live data with existing subtasks to confirm absence of orphan rows"
---

# Phase 3: ADHD-Optimized UX Verification Report

**Phase Goal:** App supports ADHD-specific needs with energy tracking and positive feedback
**Verified:** 2026-02-23T01:00:00Z
**Status:** human_needed
**Re-verification:** Yes — third pass, after gap closure plans 03-08, 03-09, and 03-10

---

## Re-verification Summary

This is the third verification pass for Phase 3:

- **Initial verification (2026-02-23T22:30:00Z):** `human_needed`, 5/5 truths verified, no automated gaps.
- **Second verification (2026-02-23T23:45:00Z):** `human_needed`, 5/5 truths verified — covered gap closure plans 03-06 (CSS animation race fix, subtask data leak, AI breakdown race, Enter key inline create) and 03-07 (DatePicker inline mode, OverdueQuickPicker, TaskForm forwardRef autosave, TaskModal post-create edit view).
- **This verification (2026-02-24):** Three additional gap closure plans executed after the second pass based on second UAT retest:

| Plan | Commits | What Fixed |
|------|---------|------------|
| 03-08 | `2a1026f`, `b96a6e7` | Double-rAF animation, STATUS_COLORS[displayStatus] green background, setDepartingPhase(null)-before-DB-write Dexie race — both TaskListItem and SubtaskRow |
| 03-09 | `0c04c8d`, `78fa52d` | Gemma systemInstruction 400 error, TaskInlineCreate submit button + Enter handler, TaskForm sticky action buttons |
| 03-10 | `0e82c43`, `d963ffa` | Send-to-Someday on TaskModal and TaskListItem, subtask count/progress badges on TaskCard and TaskListItem |

All new artifacts from plans 03-08 through 03-10 are verified in the codebase. No regressions found in previously verified artifacts. Status remains `human_needed` because no human UAT has been performed since these implementations.

---

## Goal Achievement

### Observable Truths (Original 5 Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can tag tasks by energy level and filter by current capacity | VERIFIED | `TaskForm.tsx` forwardRef wraps 3-chip ENERGY_OPTIONS selector (lines 29-51); `App.tsx` energyFilter state and header chips; `hooks.ts` both query hooks filter `(!energyFilter || t.energyLevel === energyFilter)` |
| 2 | User sees AI-suggested time estimates for tasks and subtasks | VERIFIED | `AIProvider.estimateTime` in both providers; `useTimeEstimate` hook fires background estimation; `TaskCard` shows badge; `TaskModal` shows Clock+Pencil override UI with `formRef` wired |
| 3 | User experiences satisfying celebration when completing tasks | VERIFIED | Double-rAF departure animation: `TaskListItem.tsx` lines 27, 33-48 `innerRafRef` + nested `requestAnimationFrame`; line 52 `STATUS_COLORS[displayStatus]`; line 106 `setDepartingPhase(null)` before `db.tasks.update`; same in `SubtaskList.tsx` lines 100, 106-121 |
| 4 | User sees gentle reschedule prompts for overdue tasks without guilt language | VERIFIED | `OverdueBanner` amber warm copy; `OverdueQuickPicker` with inline DatePicker (`defaultOpen={true} inline={true}`); `SomedayView`; Send-to-Someday now on TaskModal and TaskListItem |
| 5 | User can identify the first subtask to start with visual highlighting | VERIFIED | `SubtaskList.tsx` line 30 `firstIncompleteIndex`, line 56 `isStartHere={index === firstIncompleteIndex}`, line 199 `ring-2 ring-violet-400` when `isStartHere && !departing` |

**Score:** 5/5 truths verified (automated evidence)

### Additional Gap Closure Truths (Plans 03-06 and 03-07)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Celebration animation uses two-frame rAF to avoid CSS race | VERIFIED | Previous verification — pattern upgraded further by 03-08 |
| 7 | Subtasks do not leak into flat list view as orphan rows | VERIFIED | `hooks.ts` all 4 filter predicates include `!t.parentId` |
| 8 | AI break-it-down button works immediately after page load | VERIFIED | `useBreakdown.ts` line 37: `const provider = await getProvider()` |
| 9 | Enter key in list view creates inline task on today's DayGroup | VERIFIED | `App.tsx` dispatches `taskbreaker:inline-create`; `DayGroup.tsx` listens |
| 10 | Quick picker reschedule opens calendar inline without extra clicks | VERIFIED | `OverdueQuickPicker.tsx` passes `defaultOpen={true} inline={true}` |
| 11 | AI breakdown button visible immediately after creating a new task | VERIFIED | `TaskModal.tsx` lines 122-128: `setNavigationOverride(newTask)` stays in modal in edit view |
| 12 | Task modals autosave form data on Escape or clicking outside | VERIFIED | `TaskForm.tsx` `useImperativeHandle` exposes `submit(): boolean`; `TaskModal.tsx` `formRef.current?.submit()` on Escape and backdrop click |

### New Gap Closure Truths (Plans 03-08, 03-09, 03-10)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | Celebration animation background turns green immediately at click | VERIFIED | `TaskListItem.tsx` line 52: `const colors = STATUS_COLORS[displayStatus]` — `displayStatus` set to `'done'` at click time (line 100), so `colors.bg` = `bg-emerald-50`, `colors.border` = `border-emerald-300` during 1500ms window before DB write |
| 14 | Double-rAF guarantees ring state paints before opacity-0 | VERIFIED | `TaskListItem.tsx` lines 35-47: nested `requestAnimationFrame(() => requestAnimationFrame(() => setDepartingPhase('fade')))` with `innerRafRef` for cleanup; same in `SubtaskList.tsx` lines 108-120 |
| 15 | show-completed no disappear-reappear flash | VERIFIED | `TaskListItem.tsx` lines 106-110: `setDepartingPhase(null)` on line 106, `await db.tasks.update` on line 107 — state resets BEFORE DB write preventing Dexie liveQuery race; same in `SubtaskList.tsx` lines 178-183 |
| 16 | AI breakdown works for Gemma models | VERIFIED | `gemini.ts` lines 43-45: `isGemmaModel()` returns `this.model.startsWith('gemma-')`; lines 58-68: Gemma gets system prompt prepended to user message, not `systemInstruction` config; `testConnection()` lines 141-153: Gemma branch skips `systemInstruction` |
| 17 | Enter key in inline create submits the task | VERIFIED | `TaskInlineCreate.tsx` lines 41-53: `handleKeyDown` catches `'Enter'`, calls `form.requestSubmit()`; lines 70-75: `<button type="submit">Add</button>` enables implicit submission |
| 18 | Create/Save button always visible in task modal | VERIFIED | `TaskForm.tsx` line 235: `sticky bottom-0 bg-white border-t border-slate-100 -mx-6 px-6 mt-2` on Actions div |
| 19 | Users can send any task to Someday from the task modal | VERIFIED | `TaskModal.tsx` lines 131-139: `handleSendToSomeday` sets `isSomeday: true` then calls `onClose()`; lines 260-268: amber Archive button rendered for `isEditing` tasks |
| 20 | Users can send any task to Someday from list view | VERIFIED | `TaskListItem.tsx` lines 166-180: Archive button with `opacity-0 group-hover:opacity-100`; `stopPropagation` prevents row click; `isSomeday: true` DB update; root div has `group` class (line 125) |
| 21 | Subtask count/progress visible on calendar task cards | VERIFIED | `TaskCard.tsx` lines 32-34: `useSubtasks(task.id ?? 0)`, `subtaskCount`, `subtaskDoneCount`; lines 63-68: `{subtaskDoneCount}/{subtaskCount}` badge with `ListTree` icon when `subtaskCount > 0` |
| 22 | Subtask count/progress visible on list view task items | VERIFIED | `TaskListItem.tsx` lines 59-61: same `useSubtasks` pattern; lines 160-165: badge with `ListTree` rendered between energy badge and Someday button |

---

## Required Artifacts

### Plans 03-08 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/components/list/TaskListItem.tsx` | Triple animation fix: green bg, double-rAF, no flash | VERIFIED | `STATUS_COLORS[displayStatus]` (line 52); `innerRafRef` + nested rAF (lines 27, 35-47); `setDepartingPhase(null)` before `db.tasks.update` (lines 106-107) |
| `src/components/task/SubtaskList.tsx` | SubtaskRow double-rAF + Dexie race fix | VERIFIED | `innerRafRef` (line 100); nested rAF (lines 108-120); `setDepartingPhase(null)` before `db.tasks.update` (lines 178-179) |

### Plans 03-09 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/ai/providers/gemini.ts` | Gemma-conditional systemInstruction handling | VERIFIED | `isGemmaModel()` (lines 43-45); conditional `contents`/`config` build (lines 58-68); `testConnection()` Gemma branch (lines 141-153) |
| `src/components/task/TaskInlineCreate.tsx` | Submit button + Enter handler | VERIFIED | `<button type="submit">Add</button>` (lines 70-75); `form.requestSubmit()` in `handleKeyDown` (line 50) |
| `src/components/task/TaskForm.tsx` | Sticky action buttons at modal bottom | VERIFIED | `sticky bottom-0 bg-white border-t border-slate-100 -mx-6 px-6 mt-2` (line 235) |

### Plans 03-10 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/components/task/TaskModal.tsx` | Send-to-Someday button for saved tasks | VERIFIED | `handleSendToSomeday` (lines 131-139): `isSomeday: true`; amber Archive button (lines 260-268): guarded by `isEditing` |
| `src/components/list/TaskListItem.tsx` | Someday hover button + subtask progress badge | VERIFIED | Archive button with `group-hover` (lines 166-180); `isSomeday: true` DB update; `useSubtasks` badge (lines 59-61, 160-165) |
| `src/components/task/TaskCard.tsx` | Subtask count badge on calendar cards | VERIFIED | `useSubtasks` import (line 7); query (lines 32-34); badge render (lines 63-68) |

### Previously Verified Artifacts (Regression Check — No Regressions Found)

| Artifact | Status |
|----------|--------|
| `src/types/index.ts` | VERIFIED |
| `src/db/database.ts` | VERIFIED |
| `src/db/hooks.ts` | VERIFIED — `!t.parentId` in all flat-list predicates confirmed |
| `src/App.tsx` | VERIFIED — energyFilter, OverdueBanner, SomedayView, Enter key handler confirmed |
| `src/components/calendar/OverdueBanner.tsx` | VERIFIED |
| `src/components/overdue/OverdueQuickPicker.tsx` | VERIFIED |
| `src/components/overdue/SomedayView.tsx` | VERIFIED |
| `src/components/ui/ViewToggle.tsx` | VERIFIED |
| `src/ai/providers/types.ts` | VERIFIED |
| `src/ai/providers/anthropic.ts` | VERIFIED |
| `src/hooks/useTimeEstimate.ts` | VERIFIED |
| `src/hooks/useBreakdown.ts` | VERIFIED |
| `src/utils/estimateCalibration.ts` | VERIFIED |

---

## Key Link Verification

### Plans 03-08 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `TaskListItem.tsx` animation | `STATUS_COLORS` lookup | `STATUS_COLORS[displayStatus]` — local optimistic state, not stale `task.status` | WIRED | Line 52: `const colors = STATUS_COLORS[displayStatus]` confirmed. `displayStatus` set to `'done'` at click (line 100), before DB write (line 107). |
| `TaskListItem.tsx` departure | Dexie liveQuery | `setDepartingPhase(null)` BEFORE `db.tasks.update` to prevent race | WIRED | Lines 106-107: state reset first, then `await db.tasks.update`. Same pattern in `SubtaskList.tsx` lines 178-179. |

### Plans 03-09 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `gemini.ts generateSubtasks` | Gemini API | Conditional — Gemma: system prompt prepended to user message; Gemini: `systemInstruction` config | WIRED | Lines 58-68: `isGemma` flag controls both `contents` construction and `config` object. `isGemmaModel()` confirmed at line 43. |
| `TaskInlineCreate form` | `handleSubmit` | `<button type="submit">` enables implicit submission; `form.requestSubmit()` for explicit Enter handling | WIRED | Line 71: `type="submit"`. Line 50: `form.requestSubmit()` in Enter branch of `handleKeyDown`. |

### Plans 03-10 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `TaskModal.tsx` Someday button | `db.tasks.update` | `handleSendToSomeday` sets `isSomeday: true` | WIRED | Lines 131-139: `db.tasks.update(currentTask.id, { isSomeday: true, updatedAt: new Date() })` then `onClose()`. |
| `TaskListItem.tsx` Someday button | `db.tasks.update` | Arrow function in onClick with `stopPropagation` | WIRED | Lines 167-174: `e.stopPropagation()` then `db.tasks.update(task.id, { isSomeday: true, updatedAt: new Date() })`. |
| `TaskCard.tsx` subtask badge | `useSubtasks` hook | `useSubtasks(task.id ?? 0)` reactive query | WIRED | Line 7: `import { useSubtasks }`. Line 32: `const subtasks = useSubtasks(task.id ?? 0)`. Line 63: badge rendered conditionally. |
| `TaskListItem.tsx` subtask badge | `useSubtasks` hook | `useSubtasks(task.id ?? 0)` reactive query | WIRED | Line 8: `import { useSubtasks }`. Line 59: `const subtasks = useSubtasks(task.id ?? 0)`. Line 160: badge rendered conditionally. |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| TASK-07 | 03-01, 03-06, 03-08, 03-09 | Task completion shows satisfying visual/audio feedback | SATISFIED | Double-rAF + green background + Dexie race fix (03-08); inline create submit button (03-09) |
| TASK-08 | 03-04, 03-07, 03-10 | Uncompleted tasks can be easily rescheduled with no guilt language | SATISFIED | OverdueBanner warm copy; inline DatePicker (03-07); Send-to-Someday on all task surfaces (03-10) |
| ADHD-01 | 03-02, 03-09 | User can tag tasks by energy level (low/medium/high) | SATISFIED | 3-chip selector in TaskForm; energy badges on TaskCard and TaskListItem; filter chips; sticky action bar visible (03-09) |
| ADHD-02 | 03-03 | User can see AI-suggested time estimates for tasks | SATISFIED | `estimateTime` on both providers; background `useTimeEstimate` hook; badge on TaskCard; Clock+Pencil override in TaskModal |
| ADHD-03 | 03-01, 03-06, 03-08 | Completing tasks shows positive celebration animation | SATISFIED | Triple-bug fix (03-08): green bg via `STATUS_COLORS[displayStatus]`, double-rAF ring-to-fade, no show-completed flash |
| ADHD-04 | 03-04, 03-07, 03-10 | Overdue tasks show gentle reschedule prompts (not guilt) | SATISFIED | OverdueBanner warm amber tone; inline DatePicker (03-07); Send-to-Someday on TaskModal/TaskListItem (03-10) |
| ADHD-05 | 03-01, 03-10 | First subtask is visually highlighted as "start here" | SATISFIED | `ring-2 ring-violet-400` on first incomplete subtask; subtask progress badges give at-a-glance status (03-10) |
| AI-01 | 03-06, 03-07, 03-09 | User can tap a button to generate subtasks for any task | SATISFIED (re-verified) | AI breakdown race fix (03-06); post-create modal edit view (03-07); Gemma 400 error fixed — breakdown now works for all 5 AI models (03-09) |
| TASK-04 | 03-07 | User can edit task title and details inline | SATISFIED (re-verified) | TaskModal autosave on Escape/backdrop; sticky Save button always visible (03-09) |

**Orphaned requirements check:** REQUIREMENTS.md maps TASK-07, TASK-08, ADHD-01 through ADHD-05 to Phase 3 — all 7 claimed and satisfied. All 9 claimed requirement IDs have implementation evidence. No orphaned Phase 3 requirements.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

Anti-pattern scan across all new files from plans 03-08 through 03-10 confirmed:

- No TODO/FIXME/HACK/PLACEHOLDER/XXX comments in any modified file
- All `return null` usages are legitimate conditional early-returns (SubtaskList when no subtasks, TaskModal when not open)
- No empty handler stubs — all onClick/handleSubmit functions have real implementations
- No static returns masking missing DB queries
- Input `placeholder` attributes are HTML UI labels, not code stubs

---

## Commit Verification

All commits from plans 03-08 through 03-10 confirmed present in git log:

| Commit | Description | Plan |
|--------|-------------|------|
| `2a1026f` | fix(03-08): fix TaskListItem celebration animation triple-bug | 03-08 |
| `b96a6e7` | fix(03-08): fix SubtaskRow celebration animation with double-rAF | 03-08 |
| `0c04c8d` | fix(03-09): fix Gemma model systemInstruction 400 error | 03-09 |
| `78fa52d` | fix(03-09): fix inline create submission and sticky action buttons | 03-09 |
| `0e82c43` | feat(03-10): add Send to Someday buttons to TaskModal and TaskListItem | 03-10 |
| `d963ffa` | feat(03-10): add subtask count/progress indicators to TaskCard and TaskListItem | 03-10 |

---

## Human Verification Required

The following 18 items require a human tester to confirm. All automated code checks pass. Plans 03-08, 03-09, and 03-10 have not been manually tested.

### 1. Green Background Appears at Click Time

**Test:** In list view, click the status circle on a todo task to complete it.
**Expected:** The row background changes to green (emerald-50 / emerald-300 border) IMMEDIATELY at click, while the ring glow and fade animation play over 1.5 seconds. Background is NOT amber/yellow during this window.
**Why human:** `STATUS_COLORS[displayStatus]` drives color from optimistic local state — requires visual inspection to confirm green appears before the DB write.

### 2. Double-rAF Ring Visibly Precedes Fade

**Test:** Complete a task in list view. Watch closely at the start of the animation.
**Expected:** The emerald ring glow is clearly visible for a perceptible moment (at least one frame) before the row begins fading to opacity-0. The fade-out takes ~1.5 seconds.
**Why human:** Nested requestAnimationFrame timing — ring phase visibility before opacity-0 requires eyes-on inspection.

### 3. Show-Completed No Flash

**Test:** Enable "show completed" toggle. Complete a task.
**Expected:** The row transitions smoothly to a green done-state. No disappear-then-reappear flash.
**Why human:** setDepartingPhase(null)-before-DB-write Dexie race fix requires live interaction with show-completed enabled.

### 4. Subtask Celebration Animation

**Test:** Open a task with subtasks. Complete a subtask.
**Expected:** Same ring-then-fade animation as task rows. Re-clicking during fade reverts to todo.
**Why human:** SubtaskRow double-rAF requires visual confirmation.

### 5. Start-Here Ring Moves Reactively

**Test:** Open a task with 3+ incomplete subtasks. Note the violet ring. Complete the first subtask.
**Expected:** Violet ring moves to the next incomplete subtask after the departure animation resolves. No text label.
**Why human:** Reactive Dexie-to-render round-trip timing requires live observation.

### 6. Energy Filter Cross-View Behavior

**Test:** Tag a task as High energy. Click the High filter chip. Check calendar and list views.
**Expected:** Only High-energy tasks appear. Untagged tasks are hidden. Click High again — all tasks return.
**Why human:** Cross-view filter consistency requires live confirmation.

### 7. AI Time Estimate Background Generation

**Test:** Configure an AI provider. Create a new task with a descriptive title. Watch the task card.
**Expected:** A time estimate badge (~Xm or ~Xh) appears within a few seconds without page reload. Open the task — Clock + Pencil override. Enter a number, press Enter — badge updates.
**Why human:** Requires live AI provider and real network request.

### 8. AI Breakdown Works for Gemma Models

**Test:** Select gemma-3-27b-it in settings. Click "Break it down" on any task.
**Expected:** Subtask generation starts without a 400 error. Subtasks appear in the review panel.
**Why human:** Requires live Gemma API key to confirm the isGemmaModel() path works end-to-end.

### 9. AI Breakdown Immediate on Page Load

**Test:** With an AI provider configured, hard refresh. Within 1 second, click "Break it down."
**Expected:** Generation starts immediately. Setup modal does NOT appear.
**Why human:** Stale isConfigured race condition fix requires timed live page load test.

### 10. Enter Key in Inline Create Submits Task

**Test:** Switch to list view, press Enter. Type a task title. Press Enter.
**Expected:** Task is created. Input clears and focus returns (rapid entry mode). Visible "Add" button also works.
**Why human:** form.requestSubmit() behavior and rapid-entry loop require live interaction.

### 11. Create/Save Button Always Visible

**Test:** Open new task modal from a calendar day click. Do not scroll.
**Expected:** The Create button is visible at the bottom without scrolling. Scroll the form — button stays pinned.
**Why human:** sticky bottom-0 inside overflow-y-auto requires visual layout confirmation.

### 12. Send to Someday from Task Modal

**Test:** Open any saved task. Look for an amber "Send to Someday" button below the form.
**Expected:** Button is visible. Click it — task disappears from calendar, modal closes, task appears in Someday view.
**Why human:** isSomeday: true DB write and cross-view appearance need live DB observation.

### 13. Send to Someday from List View

**Test:** In list view, hover over a task row.
**Expected:** Archive icon appears on hover. Click it — task moves to Someday view. Row click does not fire (no modal opens).
**Why human:** group-hover opacity transition and stopPropagation behavior require live interaction.

### 14. Subtask Progress Badge — Calendar Cards

**Test:** View a task with 3 subtasks (1 done) on the calendar.
**Expected:** A "1/3" badge with ListTree icon is visible on the card. Complete a second subtask — badge updates to "2/3" reactively.
**Why human:** Dexie liveQuery reactive update requires live data with real subtasks.

### 15. Subtask Progress Badge — List View

**Test:** Switch to list view. View a task with subtasks.
**Expected:** Same "done/total" badge visible on the list item. Updates reactively.
**Why human:** Same as above — requires live subtask data.

### 16. Overdue Banner Tone and Daily Dismissal

**Test:** Create a task dated yesterday. Navigate to today. Note the banner text. Dismiss it. Refresh.
**Expected:** Banner stays dismissed after refresh. Tone is warm with no guilt language.
**Why human:** Time-based reset (tomorrow recurrence) requires system clock manipulation; tone is subjective.

### 17. Quick Picker Inline Calendar

**Test:** Create a task dated yesterday. Navigate to today. Click "Review" on the OverdueBanner. Click the Calendar icon.
**Expected:** Calendar grid appears inline immediately — no second click. Selecting a date reschedules.
**Why human:** defaultOpen={true} inline={true} props require live rendering verification.

### 18. Post-Create Edit View with BreakdownButton

**Test:** Press N to open new task modal. Enter a title and date. Click Create.
**Expected:** Modal stays open and transitions to edit view showing the "Break it down" button.
**Why human:** setNavigationOverride(newTask) state transition requires live observation.

---

## Gaps Summary

No automated gaps. All 5 original success criteria are code-verified, and all 17 additional gap closure truths from plans 03-06 through 03-10 are code-verified. The `human_needed` status reflects:

1. Plans 03-08, 03-09, and 03-10 were executed after the second verification and have not been manually tested by a human.
2. Visual animation quality (green background timing, double-rAF ring visibility, show-completed no-flash) inherently requires a human to confirm.
3. Live AI provider behavior (Gemma 400 fix, time estimates, breakdown race condition) cannot be tested programmatically.
4. Cross-view UX flows (Someday data isolation, subtask badge reactivity, filter behavior) require live DB observation.

If a human tester runs through the 18 verification items above and confirms them, this phase can be upgraded to `passed`.

---

_Verified: 2026-02-23T01:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — third pass, after gap closure plans 03-08, 03-09, and 03-10_
