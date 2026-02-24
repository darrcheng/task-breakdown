---
phase: 03-adhd-optimized-ux
verified: 2026-02-23T04:00:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  new_plans_verified:
    - "03-11: CSS specificity conflict fix (transition-colors conditional on !departing) + settling phase (ring|fade|settling|null) in both TaskListItem and SubtaskRow — smooth ring glow fade-out instead of abrupt disappear"
    - "03-12: CategoryCombobox Enter no longer reopens closed dropdown (only ArrowDown reopens); TaskInlineCreate handleKeyDown moved to form level with aria-expanded guard for Enter delegation"
    - "03-13: TaskForm isEditing prop hides Save/Cancel in edit mode; onSendToSomeday prop renders compact Someday button below DatePicker; Enter-to-create on title input (create mode only); TaskModal passes both props, old modal Someday button removed"
    - "03-14: handleTaskClickList in App.tsx calls setModalState (was no-op); DayGroup editingTaskId state removed, TaskInlineEdit import removed, onTaskClick delegated directly to TaskListItem.onClick"
human_verification:
  - test: "Celebration animation — smooth ring glow fade with settling phase"
    expected: "Completing a task in list view shows: emerald ring appears, opacity fades over 1.5s, then ring fades smoothly over 400ms (settling phase). No abrupt ring disappear. With show-completed on, the done row stays visible and the ring fades out cleanly."
    why_human: "settling phase transitions (transition-all duration-300 for 400ms) cannot be verified programmatically — requires visual inspection to confirm ring fades rather than snaps away"
  - test: "Subtask celebration animation — settling phase smooth"
    expected: "Completing a subtask shows the same ring-then-fade-then-smooth-ring-cleanup sequence. The violet start-here ring moves to the next incomplete subtask after departure resolves."
    why_human: "SubtaskRow settling phase requires visual confirmation; start-here ring reactive move timing requires live Dexie liveQuery observation"
  - test: "Enter after category selection submits inline create"
    expected: "In list view, press Enter to open inline create. Type a task title. Tab to category, type a search, press Enter to select a category. Press Enter again — task is created. Dropdown does NOT reopen on the second Enter."
    why_human: "aria-expanded delegation and form-level requestSubmit() cross-browser behavior require live keyboard interaction to confirm"
  - test: "Edit task modal — no Save/Cancel buttons visible"
    expected: "Open any saved task. The modal shows only the Delete button at the bottom (or nothing if no delete). No Save or Cancel buttons. Making a change then pressing Escape auto-saves and closes. Clicking the backdrop also auto-saves."
    why_human: "isEditing prop conditional rendering and auto-save edge cases require live interaction to confirm; Escape auto-save guards (empty title check) need live testing"
  - test: "New task modal — Create button and Enter-to-create"
    expected: "Open new task modal (press N or click a calendar day). Create button is visible at the bottom. Type a title and press Enter — task is created without clicking Create. Modal stays open showing the new task in edit view."
    why_human: "Enter-to-create onKeyDown on title input and setNavigationOverride post-create transition require live observation"
  - test: "Someday button near DatePicker"
    expected: "In new or edit task modal, after the date field there is a compact amber 'Someday' button (with Archive icon). Clicking it sends the task to Someday and closes the modal. The button is only shown for saved (editing) tasks."
    why_human: "onSendToSomeday optional prop rendering and isSomeday DB write + cross-view disappearance need live DB observation"
  - test: "List view task click opens TaskModal with full features"
    expected: "Switch to list view. Click any task row. A centered TaskModal opens (not inline edit). The modal shows the subtask tree, Break it Down button, time estimate, and Someday button. AI breakdown works from list view."
    why_human: "setModalState wiring and centered positioning (no clickPosition) require visual confirmation that the modal appears correctly centered; full feature availability needs live interaction"
  - test: "Celebration animation — green background appears during departure"
    expected: "Completing a task in list view shows the row background changing to emerald-50 immediately at click, while the ring glow and fade play over 1.5s. Background is NOT amber/yellow during the window."
    why_human: "STATUS_COLORS[displayStatus] optimistic state drives color — requires visual inspection to confirm green appears before DB write"
  - test: "Energy filter applies to both calendar and list views"
    expected: "Clicking a Low/Medium/High chip in the header filters tasks in all views. Tasks with no energy level disappear when a filter is active. Clicking the active chip again clears the filter."
    why_human: "Cross-view filter consistency requires live confirmation"
  - test: "AI time estimate appears on task card after creation"
    expected: "After creating a task (with AI configured), a time estimate badge appears within a few seconds. Opening the task shows Clock + Pencil override. Entering a number and pressing Enter saves it."
    why_human: "Requires live AI provider and real network request"
  - test: "AI breakdown works for Gemma models (no 400 error)"
    expected: "Select gemma-3-27b-it in settings. Click Break it down — subtask generation starts without a 400 error."
    why_human: "Requires live Gemma API key to confirm the isGemmaModel() conditional path works end-to-end"
  - test: "AI breakdown immediate on page load"
    expected: "With AI provider configured, hard refresh. Within 1 second, click Break it down — generation starts immediately, setup modal does NOT appear."
    why_human: "Stale isConfigured race condition fix requires timed live page load test"
  - test: "Overdue banner tone and daily dismissal"
    expected: "Banner text is warm with no guilt language. Dismissed banner stays gone after refresh. Tomorrow it reappears."
    why_human: "Time-based localStorage reset requires system clock manipulation; tone is subjective"
  - test: "Quick picker inline calendar opens immediately"
    expected: "Clicking Calendar icon on overdue task in Quick Picker reveals inline calendar immediately. Selecting a date reschedules."
    why_human: "defaultOpen/inline DatePicker props require live rendering verification"
  - test: "Someday view isolation and rescue"
    expected: "Tasks sent to Someday appear only in Someday view. Clicking CalendarDays icon picks a date — task disappears from Someday and reappears on calendar."
    why_human: "Cross-view data isolation and rescue-then-calendar-appearance need live DB observation"
  - test: "No orphan subtasks in list view"
    expected: "List view shows only root-level tasks. No subtasks appear as standalone rows."
    why_human: "!t.parentId filter fix needs live data with existing subtasks to confirm absence of orphan rows"
  - test: "Subtask progress badge reactive update"
    expected: "A task with 3 subtasks (1 done) shows 1/3 badge. Completing a second subtask changes it to 2/3 without page reload."
    why_human: "Dexie liveQuery reactive update requires live data with real subtasks"
  - test: "Send to Someday from list view hover"
    expected: "In list view, hover over a task row. Archive icon appears. Click it — task moves to Someday view. Row click does not fire (no modal opens)."
    why_human: "group-hover transition and stopPropagation behavior require live interaction"
---

# Phase 3: ADHD-Optimized UX Verification Report

**Phase Goal:** App supports ADHD-specific needs with energy tracking and positive feedback
**Verified:** 2026-02-23T04:00:00Z
**Status:** human_needed
**Re-verification:** Yes — fourth pass, after gap closure plans 03-11, 03-12, 03-13, and 03-14

---

## Re-verification Summary

This is the fourth verification pass for Phase 3:

- **Initial verification:** `human_needed`, 5/5 truths verified, no automated gaps.
- **Second verification:** `human_needed`, 5/5 truths verified — covered plans 03-06 (CSS animation race fix, subtask data leak, AI breakdown race, Enter key inline create) and 03-07 (DatePicker inline mode, OverdueQuickPicker, TaskForm forwardRef autosave, TaskModal post-create edit view).
- **Third verification:** `human_needed`, 5/5 truths verified — covered plans 03-08 (double-rAF, STATUS_COLORS green bg, Dexie race), 03-09 (Gemma 400 fix, inline create submit button, sticky action bar), 03-10 (Send-to-Someday buttons, subtask progress badges).
- **This verification (fourth pass):** Four additional gap closure plans executed after the third pass based on second UAT retest:

| Plan | Commits | What Fixed |
|------|---------|------------|
| 03-11 | `59d5540`, `a484643` | CSS specificity conflict (transition-colors overrides transition-all in Tailwind v4) + settling phase (ring fades smoothly instead of disappearing abruptly) — both TaskListItem and SubtaskRow |
| 03-12 | `04ffb75` | CategoryCombobox Enter no longer reopens closed dropdown; TaskInlineCreate handleKeyDown moved to form level with aria-expanded guard |
| 03-13 | `8d2161f` | TaskForm hides Save/Cancel in edit mode via isEditing prop; Someday button moved into TaskForm below DatePicker; Enter-to-create on title input |
| 03-14 | `45c0c43` | handleTaskClickList calls setModalState (was no-op); DayGroup delegates to onTaskClick; full TaskModal parity from list view |

All new artifacts from plans 03-11 through 03-14 are verified in the codebase. No regressions found in previously verified artifacts. Status remains `human_needed` because no human UAT has been performed since these implementations.

---

## Goal Achievement

### Observable Truths (Original 5 Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can tag tasks by energy level and filter by current capacity | VERIFIED | `TaskForm.tsx` lines 31-53: 3-chip ENERGY_OPTIONS selector; `App.tsx` line 40: `energyFilter` state, lines 163-183: header energy chips; `hooks.ts` both query hooks filter `(!energyFilter \|\| t.energyLevel === energyFilter)` |
| 2 | User sees AI-suggested time estimates for tasks and subtasks | VERIFIED | `AIProvider.estimateTime` on both providers; `useTimeEstimate` hook fires background estimation; `TaskCard` shows badge; `TaskModal` lines 262-325: Clock+Pencil override UI with Enter-to-save |
| 3 | User experiences satisfying celebration when completing tasks | VERIFIED | Four-phase state machine in `TaskListItem.tsx` line 24 and `SubtaskList.tsx` line 97: `'ring' \| 'fade' \| 'settling' \| null`; `!departing && 'transition-colors'` conditional (line 137 / line 209); settling timeout 400ms (lines 113-121 / lines 186-194) |
| 4 | User sees gentle reschedule prompts for overdue tasks without guilt language | VERIFIED | `OverdueBanner` amber warm copy; `OverdueQuickPicker` inline DatePicker; `SomedayView`; Someday button in `TaskForm.tsx` lines 161-170 (below DatePicker); hover Someday in `TaskListItem.tsx` lines 179-193 |
| 5 | User can identify the first subtask to start with visual highlighting | VERIFIED | `SubtaskList.tsx` line 30: `firstIncompleteIndex`; line 56: `isStartHere={index === firstIncompleteIndex}`; line 213: `ring-2 ring-violet-400` when `isStartHere && !departing` |

**Score:** 5/5 truths verified (automated evidence)

### Additional Gap Closure Truths (Plans 03-06 and 03-07)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Celebration animation uses double-rAF to avoid CSS paint race | VERIFIED | `TaskListItem.tsx` lines 35-48: nested requestAnimationFrame with `innerRafRef` cleanup |
| 7 | Subtasks do not leak into flat list view as orphan rows | VERIFIED | `hooks.ts` all flat-list predicates include `!t.parentId` |
| 8 | AI break-it-down button works immediately after page load | VERIFIED | `useBreakdown.ts`: `const provider = await getProvider()` — async, no stale closure |
| 9 | Enter key in list view creates inline task on today's DayGroup | VERIFIED | `App.tsx` lines 108-114: dispatches `taskbreaker:inline-create`; `DayGroup.tsx` lines 27-37: listens |
| 10 | Quick picker reschedule opens calendar inline without extra clicks | VERIFIED | `OverdueQuickPicker.tsx` passes `defaultOpen={true} inline={true}` |
| 11 | AI breakdown button visible immediately after creating a new task | VERIFIED | `TaskModal.tsx` lines 121-128: `setNavigationOverride(newTask)` stays in modal in edit view |
| 12 | Task modals autosave on Escape or clicking outside | VERIFIED | `TaskForm.tsx` lines 91-97: `useImperativeHandle` exposes `submit(): boolean`; `TaskModal.tsx` lines 82-86 and 212-215: `formRef.current?.submit()` on Escape and backdrop click |

### New Gap Closure Truths (Plans 03-08, 03-09, 03-10)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | Celebration background turns green immediately at click | VERIFIED | `TaskListItem.tsx` line 53: `const colors = STATUS_COLORS[displayStatus]`; `displayStatus` set to `'done'` at click (line 108), before DB write (inside settling timeout) |
| 14 | Double-rAF guarantees ring state paints before opacity-0 | VERIFIED | `TaskListItem.tsx` lines 35-48: nested `requestAnimationFrame(() => requestAnimationFrame(() => setDepartingPhase('fade')))` with `innerRafRef` cleanup |
| 15 | AI breakdown works for Gemma models | VERIFIED | `gemini.ts` `isGemmaModel()` conditional prepends system prompt to user message instead of using `systemInstruction` |
| 16 | Enter key in inline create submits the task | VERIFIED | `TaskInlineCreate.tsx` line 59: `onKeyDown={handleKeyDown}` on `<form>`; line 54: `requestSubmit()`; line 72-77: `<button type="submit">Add</button>` |
| 17 | Create/Save button always visible in task modal | VERIFIED | `TaskForm.tsx` line 258: `sticky bottom-0 bg-white border-t border-slate-100 -mx-6 px-6 mt-2` |
| 18 | Users can send any task to Someday from the task modal | VERIFIED | `TaskModal.tsx` line 258: `onSendToSomeday={isEditing ? handleSendToSomeday : undefined}` passes handler to `TaskForm`; `TaskForm.tsx` lines 161-170: renders amber Someday button below DatePicker when prop provided |
| 19 | Users can send any task to Someday from list view | VERIFIED | `TaskListItem.tsx` lines 179-193: Archive button `opacity-0 group-hover:opacity-100`; `stopPropagation`; `isSomeday: true` DB update |
| 20 | Subtask count/progress visible on calendar task cards | VERIFIED | `TaskCard.tsx`: `useSubtasks` query; badge rendered when `subtaskCount > 0` |
| 21 | Subtask count/progress visible on list view task items | VERIFIED | `TaskListItem.tsx` lines 60-62 + 173-178: `useSubtasks` + conditional badge |

### New Gap Closure Truths (Plans 03-11, 03-12, 03-13, 03-14)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 22 | Celebration animation ring fades smoothly (no abrupt disappear) | VERIFIED | `TaskListItem.tsx` line 24: state type includes `'settling'`; lines 113-121: after 1500ms fade → `setDepartingPhase('settling')` → 400ms → `setDepartingPhase(null)` + DB write; line 144: `departingPhase === 'settling' && 'transition-all duration-300'` |
| 23 | CSS specificity conflict resolved — transition-colors conditional | VERIFIED | `TaskListItem.tsx` line 137: `!departing && 'transition-colors'` — base class no longer always has `transition-colors`; `SubtaskList.tsx` line 209: same pattern |
| 24 | SubtaskRow has settling phase matching TaskListItem | VERIFIED | `SubtaskList.tsx` lines 97-212: identical state machine — `'ring' \| 'fade' \| 'settling' \| null`, settling timeout, `!departing && 'transition-colors'` |
| 25 | Enter after category selection submits inline create form | VERIFIED | `CategoryCombobox.tsx` line 113: `!isOpen` branch only opens on `'ArrowDown'` — Enter not in condition, propagates to form; `TaskInlineCreate.tsx` line 41: `handleKeyDown` typed as `React.KeyboardEvent<HTMLFormElement>`; line 59: `onKeyDown={handleKeyDown}` on `<form>`; line 49: `aria-expanded === 'true'` guard skips form submission when dropdown open |
| 26 | Edit mode shows no Save/Cancel buttons | VERIFIED | `TaskForm.tsx` line 257: `{(!isEditing \|\| onDelete) &&` — entire actions bar hidden in edit mode unless Delete handler present; line 275: `{!isEditing && (` — Cancel/Submit div only renders in create mode |
| 27 | Someday button co-located with DatePicker in task form | VERIFIED | `TaskForm.tsx` lines 161-170: amber Archive button with `Someday` label rendered after `<DatePicker>`, conditional on `onSendToSomeday` prop; `TaskModal.tsx` line 258: passes `onSendToSomeday={isEditing ? handleSendToSomeday : undefined}` |
| 28 | Clicking task in list view opens full TaskModal | VERIFIED | `App.tsx` lines 140-142: `handleTaskClickList` calls `setModalState({ isOpen: true, date: task.date, task })` (no clickPosition → centered positioning); `DayGroup.tsx` lines 82-88: `onClick={onTaskClick}` on `TaskListItem`; no `editingTaskId` state, no `TaskInlineEdit` import |

---

## Required Artifacts

### Plans 03-11 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/components/list/TaskListItem.tsx` | CSS specificity fix + settling phase for smooth ring fade | VERIFIED | Line 24: `'ring' \| 'fade' \| 'settling' \| null`; line 137: `!departing && 'transition-colors'`; lines 113-121: settling → null with 400ms delay + DB write |
| `src/components/task/SubtaskList.tsx` | Same CSS + settling fix for SubtaskRow | VERIFIED | Line 97: `'ring' \| 'fade' \| 'settling' \| null`; line 209: `!departing && 'transition-colors'`; lines 186-194: settling → null |

### Plans 03-12 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/components/task/CategoryCombobox.tsx` | Enter no longer reopens closed dropdown | VERIFIED | Lines 112-118: `!isOpen` branch only calls `setIsOpen(true)` on `'ArrowDown'` — `'Enter'` not present |
| `src/components/task/TaskInlineCreate.tsx` | Form-level handleKeyDown with aria-expanded guard | VERIFIED | Line 41: `React.KeyboardEvent<HTMLFormElement>`; line 59: `<form onKeyDown={handleKeyDown}>`; line 49: aria-expanded guard |

### Plans 03-13 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/components/task/TaskForm.tsx` | isEditing hides Save/Cancel; onSendToSomeday renders Someday button; Enter-to-create | VERIFIED | Lines 27-28: new props; line 142: `!isEditing` Enter guard; lines 161-170: Someday button after DatePicker; line 257: `!isEditing \|\| onDelete` condition |
| `src/components/task/TaskModal.tsx` | Passes isEditing and onSendToSomeday to TaskForm; old modal Someday button removed | VERIFIED | Line 257: `isEditing={isEditing}`; line 258: `onSendToSomeday={isEditing ? handleSendToSomeday : undefined}`; no separate Someday button block in modal body; Archive not imported |

### Plans 03-14 Artifacts

| Artifact | Provides | Status | Key Evidence |
|----------|---------|--------|-------------|
| `src/App.tsx` | handleTaskClickList opens TaskModal (not a no-op) | VERIFIED | Lines 140-142: `setModalState({ isOpen: true, date: task.date, task })` |
| `src/components/list/DayGroup.tsx` | Delegates onTaskClick to TaskListItem; no inline edit | VERIFIED | Line 23: `onTaskClick` destructured; lines 82-88: `onClick={onTaskClick}` in task map; no `editingTaskId`, no `TaskInlineEdit` import |

### Previously Verified Artifacts (Regression Check)

| Artifact | Regression Status |
|----------|------------------|
| `src/types/index.ts` | NO REGRESSION |
| `src/db/database.ts` | NO REGRESSION |
| `src/db/hooks.ts` | NO REGRESSION — `!t.parentId` predicates confirmed |
| `src/App.tsx` | NO REGRESSION — energyFilter, OverdueBanner, SomedayView, Enter key handler, handleTaskClickList wired |
| `src/components/calendar/OverdueBanner.tsx` | NO REGRESSION |
| `src/components/overdue/OverdueQuickPicker.tsx` | NO REGRESSION |
| `src/components/overdue/SomedayView.tsx` | NO REGRESSION |
| `src/components/ui/ViewToggle.tsx` | NO REGRESSION |
| `src/ai/providers/gemini.ts` | NO REGRESSION |
| `src/hooks/useTimeEstimate.ts` | NO REGRESSION |
| `src/hooks/useBreakdown.ts` | NO REGRESSION |
| `src/utils/estimateCalibration.ts` | NO REGRESSION |
| `src/components/task/TaskCard.tsx` | NO REGRESSION |

---

## Key Link Verification

### Plans 03-11 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `TaskListItem.tsx` CSS animation | `transition-all` (not overridden) | `!departing && 'transition-colors'` — conditional removes specificity conflict | WIRED | Line 137 confirmed. When departing, `transition-colors` not present; only `transition-all duration-[1500ms]` applies for ring/fade phases. |
| `TaskListItem.tsx` departure | Smooth ring cleanup | `settling` phase: `setDepartingPhase('settling')` after 1500ms, `setDepartingPhase(null)` after 400ms more | WIRED | Lines 113-121: settling timeout runs after fade, DB write moves into settling timeout (line 117). |
| `SubtaskList.tsx` SubtaskRow CSS | `transition-all` (not overridden) | Same pattern as TaskListItem | WIRED | Line 209: `!departing && 'transition-colors'`; settling at line 212. |

### Plans 03-12 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `CategoryCombobox` Enter key (closed state) | Form `handleKeyDown` | Not intercepted when `!isOpen` — propagates to form | WIRED | Line 113: only `'ArrowDown'` triggers `setIsOpen(true)` in `!isOpen` branch. `'Enter'` falls through `return` on line 117, reaching form handler. |
| `TaskInlineCreate` form-level Enter | `requestSubmit()` | `handleKeyDown` on `<form>` catches Enter from any child input | WIRED | Line 54: `(e.currentTarget as HTMLFormElement).requestSubmit()` called when `title.trim()` is non-empty and dropdown is closed. |

### Plans 03-13 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `TaskForm.tsx` actions bar | Hidden in edit mode | `{(!isEditing \|\| onDelete) && (` — wraps entire actions div | WIRED | Line 257 confirmed. In edit mode with `isEditing=true` and no `onDelete`, actions div does not render. |
| `TaskForm.tsx` Someday button | `onSendToSomeday` callback | Rendered after DatePicker when prop provided | WIRED | Lines 161-170: `{onSendToSomeday && (<button onClick={onSendToSomeday}>Someday</button>)}` |
| `TaskModal.tsx` | `TaskForm.tsx` Someday prop | `onSendToSomeday={isEditing ? handleSendToSomeday : undefined}` | WIRED | Line 258: correct conditional — only editing tasks show Someday option. |

### Plans 03-14 Key Links

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `DayGroup.tsx` task click | `App.tsx handleTaskClickList` | `onTaskClick` prop destructured and passed to `TaskListItem.onClick` | WIRED | `DayGroup.tsx` line 86: `onClick={onTaskClick}`; `App.tsx` line 274: `onTaskClick={handleTaskClickList}` (ListView passes to DayGroup). |
| `App.tsx handleTaskClickList` | `TaskModal` | `setModalState({ isOpen: true, date: task.date, task })` without `clickPosition` | WIRED | Lines 140-142 confirmed. TaskModal receives `task` and opens in centered mode (no clickPosition → `left: '50%', top: '50%'` at line 197-203). |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| TASK-07 | 03-01, 03-06, 03-08, 03-09, 03-11, 03-12, 03-14 | Task completion shows satisfying visual/audio feedback | SATISFIED | Four-phase animation (ring/fade/settling/null) — CSS conflict resolved (03-11); full TaskModal from list view (03-14); Enter-in-inline-create fixed (03-12) |
| TASK-08 | 03-04, 03-07, 03-10, 03-13 | Uncompleted tasks can be easily rescheduled with no guilt language | SATISFIED | OverdueBanner warm copy; inline DatePicker (03-07); Someday on all surfaces (03-10, 03-13 moves button near DatePicker) |
| ADHD-01 | 03-02, 03-09, 03-13, 03-14 | User can tag tasks by energy level (low/medium/high) | SATISFIED | 3-chip energy selector in TaskForm; energy badges; filter chips; sticky action bar visible (03-09); list view now shows full modal with energy tagging (03-14) |
| ADHD-02 | 03-03 | User can see AI-suggested time estimates for tasks | SATISFIED | `estimateTime` on both providers; background `useTimeEstimate` hook; badge on TaskCard; Clock+Pencil override in TaskModal |
| ADHD-03 | 03-01, 03-06, 03-08, 03-11 | Completing tasks shows positive celebration animation | SATISFIED | CSS specificity conflict resolved (03-11): `!departing && 'transition-colors'`; settling phase prevents abrupt ring disappear; double-rAF ring-to-fade from 03-08 |
| ADHD-04 | 03-04, 03-07, 03-10, 03-13 | Overdue tasks show gentle reschedule prompts (not guilt) | SATISFIED | OverdueBanner warm amber tone; inline DatePicker (03-07); Someday button co-located with DatePicker (03-13) |
| ADHD-05 | 03-01, 03-10 | First subtask is visually highlighted as "start here" | SATISFIED | `ring-2 ring-violet-400` on first incomplete subtask in `SubtaskList.tsx`; subtask progress badges give at-a-glance status (03-10) |

**Orphaned requirements check:** REQUIREMENTS.md maps TASK-07, TASK-08, ADHD-01 through ADHD-05 to Phase 3 — all 7 claimed and marked satisfied (`[x]`). All 7 have implementation evidence. No orphaned Phase 3 requirements.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

Anti-pattern scan across all files from plans 03-11 through 03-14 confirmed:

- No TODO/FIXME/HACK/PLACEHOLDER/XXX comments in any modified file (grep returned 0 matches across all `.tsx` files in `src/`)
- No `return null` stubs — all `return null` usages are legitimate (e.g. `SubtaskList` when no subtasks, `TaskModal` when not open, optional JSX elements)
- No empty handler stubs — all click/submit handlers have real implementations
- No static returns masking DB queries
- `input placeholder` attributes are HTML UI labels, not code stubs
- `TaskInlineEdit.tsx` left as dead code per plan (03-14 explicitly deferred cleanup) — flagged as informational only

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/components/list/TaskInlineEdit.tsx` | Dead code — no longer imported anywhere | INFO | No functional impact; can be deleted in a cleanup task |

---

## Commit Verification

All commits from plans 03-11 through 03-14 confirmed present in git log:

| Commit | Description | Plan |
|--------|-------------|------|
| `59d5540` | fix(03-11): fix CSS specificity conflict and add settling phase in TaskListItem | 03-11 |
| `a484643` | fix(03-11): fix CSS specificity conflict and add settling phase in SubtaskRow | 03-11 |
| `04ffb75` | fix(03-12): fix Enter key in inline create — category selection now submits form | 03-12 |
| `8d2161f` | feat(03-13): hide Save/Cancel in edit mode, add Enter-to-create, move Someday button | 03-13 |
| `45c0c43` | feat(03-14): wire list view task click to open TaskModal | 03-14 |

---

## Human Verification Required

The following 18 items require a human tester to confirm. All automated code checks pass. Plans 03-11 through 03-14 have not been manually tested.

### 1. Celebration Animation — Smooth Ring Glow Fade (Settling Phase)

**Test:** In list view, enable show-completed. Complete a task. Watch the ring after the 1.5s fade.
**Expected:** The emerald ring glow fades out smoothly over ~400ms after the row finishes fading. The ring does NOT disappear abruptly/snap away. With show-completed on, the done row stays visible and the ring cleanup is smooth.
**Why human:** `settling` phase CSS (`transition-all duration-300`) cannot be verified programmatically — requires visual inspection to confirm ring fades rather than snaps away.

### 2. Subtask Celebration Animation — Settling Phase

**Test:** Open a task with 3+ incomplete subtasks. Complete a subtask.
**Expected:** Emerald ring appears, row fades over 1.5s, ring fades smoothly. Violet start-here ring moves to next incomplete subtask after departure fully resolves.
**Why human:** SubtaskRow settling phase requires visual confirmation; reactive ring move timing requires live Dexie observation.

### 3. Enter After Category Selection Submits Inline Create

**Test:** Switch to list view, press Enter. Type a task title. Tab to category, type a search term, press Enter to select a category. Press Enter again.
**Expected:** Task is created immediately — the form submits. Dropdown does NOT reopen. Input clears for rapid entry.
**Why human:** aria-expanded delegation and cross-browser `requestSubmit()` behavior require live keyboard interaction to confirm. Edge case: Enter while dropdown is open should select, not submit.

### 4. Edit Task Modal — No Save/Cancel Buttons Visible

**Test:** Open any saved task. Inspect the bottom of the modal.
**Expected:** Only the Delete button is visible (left side). No Save or Cancel buttons. Making a change then pressing Escape auto-saves and closes. Clicking the backdrop also auto-saves. Empty title prevents save (modal stays open).
**Why human:** `isEditing` conditional rendering and auto-save edge cases require live interaction; the empty-title guard needs testing.

### 5. New Task Modal — Create Button and Enter-to-Create

**Test:** Press N to open new task modal. Note the Create button is visible at the bottom without scrolling. Type a title and press Enter.
**Expected:** Task is created (Enter fires before clicking Create button). Modal stays open and transitions to edit view showing the Break it Down button.
**Why human:** Enter-to-create `onKeyDown` on title input and `setNavigationOverride` post-create transition require live observation.

### 6. Someday Button Near DatePicker

**Test:** Open any saved task. Look below the Date field.
**Expected:** A compact amber "Someday" button with Archive icon appears immediately below the DatePicker. Button is only visible for saved (editing) tasks. Clicking it sends the task to Someday, closes the modal, and the task appears in Someday view.
**Why human:** `onSendToSomeday` prop conditional rendering and isSomeday DB write + cross-view appearance need live DB observation.

### 7. List View Task Click Opens Full TaskModal

**Test:** Switch to list view. Click any task row (not the status circle, not the Someday hover button — the row itself).
**Expected:** A centered TaskModal opens. The modal title shows "Edit Task". The subtask tree is visible (if any subtasks). The Break it Down button is present. Time estimate badge shown (if available). The Someday button is near the DatePicker.
**Why human:** `setModalState` wiring and centered positioning (no clickPosition) require visual confirmation that modal appears correctly centered; full feature availability needs live interaction.

### 8. Green Background at Click Time

**Test:** In list view, click the status circle on a todo task.
**Expected:** Row background changes to emerald-50 immediately at click while the ring/fade animation plays. Background is NOT amber/yellow during the 1.5s window.
**Why human:** `STATUS_COLORS[displayStatus]` drives color from optimistic local state — requires visual inspection.

### 9. Energy Filter Cross-View Behavior

**Test:** Tag a task as High energy. Click the High chip in the header. Check calendar and list views.
**Expected:** Only High-energy tasks appear. Untagged tasks hidden. Click High again — all tasks return.
**Why human:** Cross-view filter consistency requires live confirmation.

### 10. AI Time Estimate Background Generation

**Test:** Configure an AI provider. Create a new task with a descriptive title.
**Expected:** Time estimate badge appears within a few seconds. Open the task — Clock + Pencil override. Enter a number, press Enter — badge updates.
**Why human:** Requires live AI provider and real network request.

### 11. AI Breakdown Works for Gemma Models

**Test:** Select gemma-3-27b-it in settings. Click Break it down on any task.
**Expected:** Subtask generation starts without a 400 error.
**Why human:** Requires live Gemma API key to confirm `isGemmaModel()` path.

### 12. AI Breakdown Immediate on Page Load

**Test:** With AI provider configured, hard refresh. Within 1 second, click Break it down.
**Expected:** Generation starts immediately. Setup modal does NOT appear.
**Why human:** Stale `isConfigured` race condition fix requires timed live test.

### 13. Overdue Banner Tone and Daily Dismissal

**Test:** Create a task dated yesterday. Note the banner text. Dismiss it. Refresh.
**Expected:** Banner stays dismissed after refresh. Tone is warm with no guilt language.
**Why human:** Time-based localStorage reset requires clock manipulation; tone is subjective.

### 14. Quick Picker Inline Calendar

**Test:** Create a task dated yesterday. Click "Review" on the OverdueBanner. Click the Calendar icon next to the overdue task.
**Expected:** Calendar grid appears inline immediately — no second click required. Selecting a date reschedules the task.
**Why human:** `defaultOpen={true} inline={true}` props require live rendering verification.

### 15. Post-Create Edit View with BreakdownButton

**Test:** Press N to open new task modal. Enter a title and date. Click Create (or press Enter in title).
**Expected:** Modal stays open in edit view showing the Break it Down button.
**Why human:** `setNavigationOverride(newTask)` state transition requires live observation.

### 16. Someday View Isolation and Rescue

**Test:** Send a task to Someday. Check calendar and list views. Switch to Someday view. Click the CalendarDays icon on the task.
**Expected:** Task is absent from calendar/list. Appears in Someday. After rescue-to-date, task disappears from Someday and appears on calendar.
**Why human:** Cross-view data isolation requires live DB observation.

### 17. No Orphan Subtasks in List View

**Test:** Open list view. If any tasks have subtasks, verify subtask rows are not visible as standalone items.
**Expected:** Only root-level tasks appear as rows. Subtasks are only visible inside the parent task's SubtaskList (via modal).
**Why human:** `!t.parentId` filter needs live data with existing subtasks to confirm absence of orphan rows.

### 18. Subtask Progress Badge Reactive Update

**Test:** View a task with 3 subtasks (1 done) in calendar and list views.
**Expected:** Badge shows "1/3". Completing a second subtask changes it to "2/3" without page reload.
**Why human:** Dexie liveQuery reactive update requires live data with real subtasks.

---

## Gaps Summary

No automated gaps. All 5 original success criteria are code-verified, and all 23 additional gap closure truths from plans 03-06 through 03-14 are code-verified. The `human_needed` status reflects:

1. Plans 03-11 through 03-14 were executed after the third verification and have not been manually tested by a human.
2. The settling phase (plan 03-11) fixes ring-glow abrupt disappear — the CSS transition behavior (400ms ring fade) is inherently visual and cannot be verified without eyes-on inspection.
3. Enter-key form submission (plans 03-09, 03-12) involves cross-browser `requestSubmit()` and aria-expanded delegation — correct behavior needs live keyboard testing.
4. TaskModal from list view (plan 03-14) and Someday button UX (plan 03-13) require live DB observation and visual layout confirmation.

If a human tester runs through the 18 verification items above and confirms them, this phase can be upgraded to `passed`.

---

_Verified: 2026-02-23T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — fourth pass, after gap closure plans 03-11, 03-12, 03-13, and 03-14_
