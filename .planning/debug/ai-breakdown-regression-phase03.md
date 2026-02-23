---
status: diagnosed
trigger: "AI break it down (subtask generation) no longer works after Phase 03 changes. Also: AI breakdown button not visible until modal closed/reopened; modals should autosave on esc/outside click."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - three separate root causes identified
test: all key files read, git diff of Phase 03 commit analysed
expecting: fix directions provided to caller
next_action: return diagnosis

## Symptoms

expected: AI breakdown button works, is immediately visible, modals autosave on esc/outside click
actual: (1) AI breakdown does not work at all, (2) AI breakdown button not visible until modal closed/reopened, (3) no autosave on esc/outside click
errors: none reported (silent failure)
reproduction: open task modal, attempt AI breakdown
started: after Phase 03 changes (commit 858dd34)

## Eliminated

- hypothesis: estimateTime() in providers overwrote or broke generateSubtasks()
  evidence: both methods are separate on AnthropicProvider and GeminiProvider; AIProvider interface defines both; they do not share code paths
  timestamp: 2026-02-23

- hypothesis: useTimeEstimate hook fires and aborts the AI provider state used by useBreakdown
  evidence: useTimeEstimate and useBreakdown each call useAIProvider independently; useTimeEstimate is fire-and-forget and uses its own AbortController ref; it cannot cancel useBreakdown's operations
  timestamp: 2026-02-23

- hypothesis: Phase 03 broke the provider-factory or AIProvider interface contract
  evidence: provider-factory.ts and types.ts are clean; generateSubtasks and estimateTime both present and correct signatures
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: TaskModal.tsx handleSubmit (lines 86-114)
  found: for NEW tasks, handleSubmit calls db.tasks.add(), then triggerEstimate(), then onClose(). onClose() fires immediately and synchronously after the add — there is no await issue since triggerEstimate is void/fire-and-forget. The task IS saved before close.
  implication: New task creation path is not the cause of breakdown breakage per se, but onClose() immediately after create means the modal showing the breakdown button never appears for a brand-new task

- timestamp: 2026-02-23
  checked: TaskModal.tsx isEditing definition (line 153) and BreakdownButton rendering (lines 293-301)
  found: isEditing = !!currentTask?.id. currentTask = liveTask ?? viewingTask. viewingTask = navigationOverride ?? task (the PROP). For a brand-new task being created, task prop is undefined, so viewingTask is undefined until the parent re-renders with the newly created task. However, after create the modal closes (onClose() called at line 113), so this branch is not reached for new tasks.
  implication: For EXISTING tasks opened for editing, isEditing is true immediately (task prop has an id). The BreakdownButton should be visible. The "not visible until close/reopen" symptom must have a different cause.

- timestamp: 2026-02-23
  checked: TaskForm.tsx key prop in TaskModal (line 217): key={currentTask?.id ?? 'new'}
  found: When the modal opens for an EXISTING task, key is the task id (stable). When the task prop arrives, TaskForm mounts once. There is no structural issue here that would hide the button.
  implication: The breakdown button visibility problem is NOT caused by key prop churn on edit.

- timestamp: 2026-02-23
  checked: git diff of commit 858dd34 — the Phase 03 commit that added useTimeEstimate to TaskModal
  found: The commit introduces triggerEstimate() into handleSubmit. For new task creation, it calls triggerEstimate(newId, ...) — which is CORRECT (fire-and-forget). No structural change was made to the breakdown section or to isEditing logic. The commit is additive.
  implication: The Phase 03 commit itself did not directly break breakdown. The regression is most likely caused by an interaction between useTimeEstimate's useAIProvider instance and useBreakdown's useAIProvider instance, OR by the handleSubmit now calling onClose() immediately (same as before Phase 03 — no change there).

- timestamp: 2026-02-23
  checked: useAIProvider.ts — isLoading initial state (line 39-45) and the useEffect that loads config (lines 48-63)
  found: Initial state is { provider: null, hasKey: false, isLoading: true }. isConfigured = state.provider !== null && state.hasKey. On mount, isLoading is TRUE and isConfigured is FALSE until the useEffect fires and reads localStorage. This is an async initialisation gap.
  implication: If useBreakdown's useAIProvider has not yet finished loading (isLoading still true, isConfigured still false), startBreakdown() will reach the !isConfigured branch (line 37 of useBreakdown) and push to status: 'configuring', showing the ProviderSetupModal — even when the user has already configured a provider. This is the ROOT CAUSE of breakdown appearing broken.

- timestamp: 2026-02-23
  checked: useBreakdown.ts startBreakdown (lines 35-88) — specifically line 37: if (!isConfigured)
  found: isConfigured comes from useAIProvider's state, which starts as false (isLoading:true, provider:null). The check happens synchronously at the top of startBreakdown. If the user clicks "Break it down" before the useEffect in useAIProvider has resolved (very likely on first render since effects run after paint), isConfigured is false and the provider setup modal appears instead of generation.
  implication: CONFIRMED ROOT CAUSE 1. The breakdown fires the "configuring" flow incorrectly because isConfigured is stale (false) at the moment the button is clicked if the component is fresh.

- timestamp: 2026-02-23
  checked: useTimeEstimate.ts — it also calls useAIProvider() (line 14), creating a SECOND independent useAIProvider instance in the same TaskModal component
  found: useTimeEstimate creates its own useAIProvider instance. useBreakdown creates another. Both use the same localStorage data but have separate React state. Both go through the isLoading:true initial state independently. This doubles the async init load but does NOT make breakdown fail — each resolves independently.
  implication: Not a direct cause of breakdown failure, but confirms there are two separate provider init sequences happening. Does not change the root cause conclusion.

- timestamp: 2026-02-23
  checked: TaskModal.tsx Escape key handler (lines 68-82) and backdrop onClick (line 190-192)
  found: Escape key calls onClose() directly (no save). Backdrop onClick calls onClose() directly (no save). TaskForm has its own internal state (title, description, etc) that is NOT synced back to the parent — it is only submitted via the form's handleSubmit. So pressing Escape or clicking outside closes the modal and discards unsaved changes.
  implication: ROOT CAUSE 3 (autosave). The modal has no mechanism to trigger handleSubmit when closing via Escape or backdrop click. The form state lives inside TaskForm and is inaccessible to the modal's close handlers without a ref or callback.

- timestamp: 2026-02-23
  checked: TaskModal.tsx BreakdownButton conditional (lines 293-301): {isEditing && currentTask && ...}
  found: isEditing = !!currentTask?.id. For an EXISTING task opened from calendar/board: task prop is defined with an id, viewingTask is set immediately (no useEffect), currentTask = liveTask ?? viewingTask. useLiveQuery has an async resolution — on first render liveTask is undefined (Dexie hook hasn't resolved yet), so currentTask = viewingTask (the prop). isEditing is true. The BreakdownButton SHOULD render on first render. However — the TaskForm has key={currentTask?.id ?? 'new'}. On first render currentTask is viewingTask (prop), so key is the id. No remount occurs. The button should be visible immediately.
  implication: The "not visible until close/reopen" symptom needs more context. It may be that the user is creating a NEW task and then expecting to see the button — but for new tasks handleSubmit calls onClose() immediately, so the button never appears in that session. The user must reopen the saved task to see the breakdown button. This is a UX flow issue, not a rendering bug for existing tasks.

## Resolution

root_cause: |
  THREE separate root causes:

  ROOT CAUSE 1 (AI breakdown broken — major):
  File: src/hooks/useBreakdown.ts, line 37
  useBreakdown.startBreakdown() checks `if (!isConfigured)` synchronously. `isConfigured` comes from useAIProvider, which initialises with provider:null / hasKey:false (isLoading:true) on every mount. The localStorage config is loaded in a useEffect (fires after first paint). If the user clicks "Break it down" before that effect resolves — which is likely, especially on first open — isConfigured is false and the function branches into the "configuring" flow, showing the ProviderSetupModal as if no provider is configured, even when one is. The user sees a setup modal (or nothing if they dismiss it), and no generation happens. Phase 03 did not introduce this bug directly — but adding useTimeEstimate created a second useAIProvider instance that also triggers an async init, which may worsen timing. The real issue is the synchronous isConfigured gate with no guard for the loading state.

  ROOT CAUSE 2 (breakdown button not visible for new tasks — UX):
  File: src/components/task/TaskModal.tsx, line 113
  When creating a NEW task, handleSubmit calls db.tasks.add() then immediately calls onClose(). The modal closes before the user ever sees the saved task's edit view (which is where the BreakdownButton is rendered). The BreakdownButton is conditionally rendered only for isEditing (existing tasks with an id). New tasks never have isEditing=true during their creation session, so the button is never shown. The user must close and reopen the task to see it. This is a UX flow issue — not a rendering bug.

  ROOT CAUSE 3 (no autosave on Escape/outside click):
  File: src/components/task/TaskModal.tsx, lines 76 and 191
  The Escape key handler (line 76) and backdrop onClick (line 191) both call onClose() directly, bypassing the form's handleSubmit. TaskForm holds its own internal state (title, description, status, categoryId, date, energyLevel) that is never synced back to TaskModal — it is only exposed via the onSubmit callback on form submit. There is no imperative handle (useImperativeHandle/forwardRef) or shared state that would allow the modal's close handlers to programmatically trigger a save. Changes are silently discarded on Escape/backdrop.

fix:
  ROOT CAUSE 1 fix direction: In useBreakdown.startBreakdown(), add a guard for the loading state. Either: (a) read isLoading from useAIProvider and short-circuit or wait when isLoading is true, or (b) skip the isConfigured check and instead always call getProvider() (which reads live localStorage), and treat a null return as the "not configured" case — this avoids the stale state race entirely.

  ROOT CAUSE 2 fix direction: After creating a new task (db.tasks.add), instead of calling onClose(), navigate INTO the newly created task's edit view within the same modal session. Set navigationOverride to the newly created task object (with the new id). This lets the user immediately see the BreakdownButton without reopening.

  ROOT CAUSE 3 fix direction: Use a React ref (useRef + useImperativeHandle) to expose a submit() method from TaskForm to TaskModal. Then in the Escape handler and backdrop onClick, call formRef.current?.submit() instead of onClose() directly — and only call onClose() after the submit resolves (or if the form has no changes / is invalid).

verification:
files_changed: []
