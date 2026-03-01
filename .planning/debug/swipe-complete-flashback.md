---
status: diagnosed
trigger: "Phase 05 UAT: clicking checkbox does nothing on mobile/swipe view, animation flash-back (task disappears then comes back briefly then disappears again)"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:00:00Z
---

## Current Focus

hypothesis: Two root causes identified -- see Evidence section
test: Code tracing through triggerComplete, getNextStatus, and useCallback dependency chain
expecting: Both confirmed via static analysis
next_action: Document findings and confirm

## Symptoms

expected: |
  1. Clicking the checkbox on a task in mobile/swipe view should cycle the status (todo -> in-progress -> done)
  2. When transitioning to done, the celebration animation should play: ring glow, fade, settle, then DB write
  3. No flash-back -- task should not disappear, reappear, then disappear again
actual: |
  1. Clicking the checkbox does nothing (on mobile/swipe view)
  2. Animation is broken -- task disappears, then comes back briefly, then disappears again (flash-back)
errors: No JS errors -- visual/behavioral regressions
reproduction: Use mobile/swipe view, click status circle on a task
started: After Phase 05 changes (extracting triggerComplete, wiring onRegisterComplete)

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-01T00:01:00Z
  checked: Phase 05 commit 5343c04 -- extraction of triggerComplete from handleStatusClick
  found: |
    The extraction created a `triggerComplete` useCallback with this guard:

    ```
    const triggerComplete = useCallback(() => {
      if (!task.id || departing) return;
      const nextStatus = getNextStatus(task.status);
      if (nextStatus === 'done') {
        // ... start animation
      }
    }, [task.id, task.status, departing]);
    ```

    And handleStatusClick now delegates:
    ```
    const nextStatus = getNextStatus(task.status);
    if (nextStatus === 'done') {
      triggerComplete();
    } else {
      // ... direct DB update for non-done transitions
    }
    ```

    CRITICAL BUG: triggerComplete checks `getNextStatus(task.status)` internally,
    but handleStatusClick ALSO checks `getNextStatus(task.status)` before calling it.
    This is redundant but not the bug itself. The bug is subtler.
  implication: Setup for understanding the real issue.

- timestamp: 2026-03-01T00:02:00Z
  checked: getNextStatus logic in categories.ts
  found: |
    ```
    export function getNextStatus(current: TaskStatus): TaskStatus {
      const cycle: TaskStatus[] = ['todo', 'in-progress', 'done'];
      const idx = cycle.indexOf(current);
      return cycle[(idx + 1) % cycle.length];
    }
    ```
    Cycle: todo -> in-progress -> done -> todo (wraps around)

    For a task with status 'todo': getNextStatus returns 'in-progress' (NOT 'done')
    For a task with status 'in-progress': getNextStatus returns 'done'
    For a task with status 'done': getNextStatus returns 'todo'
  implication: Only in-progress tasks will trigger the celebration animation via triggerComplete.

- timestamp: 2026-03-01T00:03:00Z
  checked: BUG 1 -- Why checkbox click does nothing for 'todo' tasks
  found: |
    When task.status is 'todo' and user clicks the checkbox in handleStatusClick:
    1. handleStatusClick calculates nextStatus = getNextStatus('todo') = 'in-progress'
    2. Since nextStatus !== 'done', it enters the else branch
    3. The else branch does: setDisplayStatus(nextStatus) and db.tasks.update(...)
    4. This works correctly -- it transitions todo -> in-progress

    When task.status is 'in-progress' and user clicks:
    1. handleStatusClick calculates nextStatus = getNextStatus('in-progress') = 'done'
    2. Since nextStatus === 'done', it calls triggerComplete()
    3. triggerComplete recalculates nextStatus = getNextStatus(task.status)
    4. task.status is still 'in-progress' at this point, so nextStatus = 'done'
    5. Since nextStatus === 'done', it starts the animation. This works.

    SO: The checkbox click path DOES work for the standard flow. But the user says
    "clicking the checkbox does nothing." This suggests the task might be in 'todo'
    status and the user expects one click to complete it, OR there's a different issue.

    WAIT -- re-reading the SwipeableTaskRow: The swipe-to-reveal "Done" button calls
    onComplete, which invokes completeRefs.current.get(task.id)?.(), which is triggerComplete.

    For a 'todo' task: triggerComplete checks getNextStatus('todo') = 'in-progress'.
    Since 'in-progress' !== 'done', the entire if-block is skipped. triggerComplete DOES NOTHING.

    The swipe "Done" button literally does nothing for todo tasks. This is BUG 1.

    But the user also said "clicking the checkbox does nothing." On mobile, the checkbox
    (handleStatusClick) IS inside a SwipeableTaskRow. The SwipeableTaskRow handlers have
    `eventData.event.stopPropagation()` on swiping. But clicking should still work since
    click is not swipe.

    ACTUALLY -- re-reading more carefully: The user complaint about "checkbox does nothing"
    could be about the SWIPE DONE BUTTON, not the checkbox circle. The swipe Done button
    invokes triggerComplete which does nothing for todo tasks because getNextStatus('todo')
    !== 'done'. And if the user is in list view with swipe (DayGroup mobile branch),
    the same issue applies.

    CONFIRMED: The swipe "Done" button does nothing for tasks that aren't 'in-progress'.
    Most tasks start as 'todo', so swipe-to-complete fails for the most common case.
  implication: |
    ROOT CAUSE 1: triggerComplete gates on `getNextStatus(task.status) === 'done'` which
    only passes for 'in-progress' tasks. For 'todo' tasks (the majority), the swipe Done
    button and triggerComplete do absolutely nothing. The fix should either:
    a) Make triggerComplete force-complete regardless of current status (skip to done), or
    b) Make triggerComplete transition through intermediate statuses first

- timestamp: 2026-03-01T00:04:00Z
  checked: BUG 2 -- Why animation flash-back occurs (task disappears, reappears, disappears)
  found: |
    The triggerComplete useCallback has these dependencies:
    ```
    [task.id, task.status, departing]
    ```

    And the registration effect:
    ```
    useEffect(() => {
      onRegisterComplete?.(triggerComplete);
    }, [onRegisterComplete, triggerComplete]);
    ```

    The animation timeline with the flash-back:

    1. User triggers completion (swipe or click) on an 'in-progress' task
    2. triggerComplete fires: setDepartingPhase('ring'), setDisplayStatus('done')
    3. Ring animation shows (ring glow appears)
    4. Double-rAF fires: setDepartingPhase('fade') -- opacity-0 applied, task fades out
    5. 1500ms timeout fires: setDepartingPhase('settling')
    6. 400ms timeout fires: setDepartingPhase(null) + db.tasks.update(status: 'done')

    NOW THE FLASH-BACK:
    7. db.tasks.update triggers Dexie liveQuery re-render
    8. Component re-renders with new task.status = 'done' (from DB)
    9. displayStatus is local state = 'done' (set in step 2) -- OK so far
    10. BUT: `departing` is now false (departingPhase was set to null in step 6)

    When showCompleted = false (the default):
    - The Dexie liveQuery filter removes done tasks from the list
    - Component unmounts -- task disappears (normal, expected)

    When showCompleted = true:
    - Task stays in the list after DB update
    - departingPhase is null, so no departure styling
    - Task reappears at full opacity briefly until... it just stays.

    BUT WAIT -- the user describes THREE states: "goes away, then comes back, then disappears again"

    Let me re-trace with showCompleted = false (the default):

    1. triggerComplete fires: animation starts
    2. Ring -> fade (opacity-0): task VISUALLY disappears (still in DOM)
    3. 1500ms: settling phase (opacity restored, transition-all duration-300)
    4. 400ms: setDepartingPhase(null) -- task at full opacity briefly (FLASH-BACK)
    5. db.tasks.update writes status='done'
    6. Dexie liveQuery fires, task excluded from results, component unmounts -- gone

    The flash-back is between steps 3-4 and step 6:
    - Step 3 (settling): removes opacity-0 class but adds transition-all duration-300
    - The element transitions BACK to full opacity over 300ms
    - Step 4: departingPhase = null, all departure classes removed
    - Step 5-6: DB write removes task from list

    So the user sees:
    a) Task fades to invisible (opacity-0 during fade phase) -- "goes away"
    b) Settling phase removes opacity-0, task transitions back to visible -- "comes back"
    c) DB write triggers liveQuery, task removed from DOM -- "disappears again"

    THIS IS THE FLASH-BACK. The settling phase was designed for show-completed=true
    (to smoothly remove the ring glow without abruptness). But it also restores opacity,
    which makes the task reappear briefly before the DB write removes it.

    The prior fix in Phase 03 (celebration-anim-still-broken.md) addressed a similar issue
    by reordering setDepartingPhase(null) before the DB write. But Phase 05 extracted
    triggerComplete and the current code has:
    ```
    setDepartingPhase(null);
    await db.tasks.update(task.id!, { status: 'done', ... });
    ```

    The problem is that setDepartingPhase(null) and the DB write are in the SAME
    synchronous callback. setDepartingPhase(null) triggers a React state update,
    but React batches state updates. The state doesn't apply until React re-renders.
    Meanwhile, the await db.tasks.update fires and Dexie liveQuery can trigger
    BEFORE React processes the phase-null render.

    Actually, let me re-read more carefully. The settling timeout:
    ```
    settlingTimeout.current = setTimeout(async () => {
      settlingTimeout.current = null;
      setDepartingPhase(null);       // React state update (batched)
      await db.tasks.update(...)      // DB write
    }, 400);
    ```

    With React 18 automatic batching, setDepartingPhase(null) and the subsequent
    state from the Dexie liveQuery re-render might be batched into one render.
    But the settling phase ITSELF (before this timeout) is the problem.

    The settling phase runs for 400ms with these classes:
    - departingPhase === 'settling': `transition-all duration-300`
    - No opacity-0, no ring-2

    So during settling:
    - opacity goes from 0 back to 1 (over 300ms transition)
    - ring classes removed

    This 400ms window where the task is transitioning back to visible IS the flash-back.
  implication: |
    ROOT CAUSE 2: The settling phase (designed for show-completed=true ring fade-out)
    causes a visible flash-back when show-completed=false. During settling, opacity-0 is
    removed and transition-all duration-300 is applied, causing the task to fade BACK IN
    over 300ms. Then 400ms later, the DB write removes it from the list.

    The user sees: fade out (opacity-0) -> fade back in (settling) -> gone (DB write unmount).

    This is the EXACT same class of bug that was fixed in Phase 03 (celebration-anim-still-broken.md)
    and (ring-glow-abrupt-disappear.md). The settling phase was added to solve the ring-glow
    abrupt disappear, but it introduced the flash-back for the show-completed=false case.

- timestamp: 2026-03-01T00:05:00Z
  checked: Prior debug sessions for this exact issue
  found: |
    1. celebration-anim-still-broken.md: Diagnosed THREE root causes including
       "disappear-then-reappear with show-completed on" caused by Dexie liveQuery
       re-render timing. FIX: set departingPhase to null BEFORE DB write.

    2. ring-glow-abrupt-disappear.md: Diagnosed ring classes being yanked instantly
       when departingPhase goes to null. FIX: add settling phase with transition-all.

    3. These two fixes are in TENSION:
       - Fix 1 says "reset phase before DB write" (prevents reappear with show-completed=true)
       - Fix 2 says "add settling phase" (prevents abrupt ring disappear)
       - Together, settling phase restores opacity THEN DB write removes element = flash-back

    The user said "Didn't we have this issue on desktop? Why is it reappearing?" -- YES,
    this is the same fundamental issue. The settling phase fix from ring-glow-abrupt-disappear
    re-introduced the flash-back that celebration-anim-still-broken fixed.
  implication: |
    The two prior fixes are fundamentally in conflict. The settling phase needs to NOT
    restore opacity when show-completed=false. OR the DB write needs to happen before/during
    the settling phase to prevent the flash-back.

- timestamp: 2026-03-01T00:06:00Z
  checked: triggerComplete useCallback dependency on `departing`
  found: |
    triggerComplete depends on [task.id, task.status, departing].

    `departing` is derived: `const departing = departingPhase !== null;`

    When triggerComplete starts the animation, it sets departingPhase to 'ring',
    which makes departing = true. This causes triggerComplete to be recreated
    (new function reference due to changed `departing` dep).

    The useEffect re-registers this new triggerComplete with the parent:
    ```
    useEffect(() => {
      onRegisterComplete?.(triggerComplete);
    }, [onRegisterComplete, triggerComplete]);
    ```

    The parent stores this in completeRefs. Since completeRefs is a Map in a useRef,
    updating the Map doesn't cause re-renders. The stored function reference is updated.

    This is actually fine -- the guard `if (!task.id || departing) return;` at the top
    of triggerComplete prevents double-triggering during animation. The dependency chain
    is correct but it does cause extra re-registrations.
  implication: Not a bug, but unnecessary re-registrations. Minor.

## Resolution

root_cause: |
  TWO ROOT CAUSES:

  BUG 1 - Checkbox/swipe "Done" does nothing for todo tasks:
    triggerComplete (TaskListItem.tsx line 86-107) gates on:
    `const nextStatus = getNextStatus(task.status); if (nextStatus === 'done')`

    getNextStatus('todo') returns 'in-progress', NOT 'done'. So for any task in 'todo'
    status (the most common state), triggerComplete returns without doing anything.
    The swipe "Done" button invokes triggerComplete directly (via completeRefs), so it
    silently does nothing for todo tasks.

    handleStatusClick also delegates to triggerComplete for the done case, but it correctly
    handles non-done transitions in its else branch. So the checkbox DOES work for
    todo -> in-progress. But the swipe Done button bypasses handleStatusClick entirely.

    FILES: TaskListItem.tsx line 86-89 (triggerComplete guard)
    FIX: triggerComplete should force-complete to 'done' regardless of current status,
    not rely on getNextStatus. Remove the getNextStatus check. If the intent is
    "complete this task," just go straight to done.

  BUG 2 - Flash-back animation (disappear, reappear, disappear):
    The settling phase (TaskListItem.tsx line 97-105) removes opacity-0 and applies
    transition-all duration-300, causing the task to fade BACK to full opacity over 300ms.
    Then 400ms later, setDepartingPhase(null) + db.tasks.update removes the task from
    the list (via Dexie liveQuery filter when showCompleted=false).

    Timeline the user sees:
    1. Fade phase: task fades to invisible (opacity-0) -- "goes away"
    2. Settling phase: opacity-0 removed, task fades back in -- "comes back"
    3. DB write: Dexie removes task from list -- "disappears again"

    This is the SAME bug class from Phase 03 debug sessions (celebration-anim-still-broken.md
    and ring-glow-abrupt-disappear.md). The settling phase was added to fix abrupt ring
    disappear but it re-introduced the flash-back.

    FILES: TaskListItem.tsx lines 93-105 (settling timeout logic)
    FIX DIRECTION: The DB write should happen BEFORE the settling phase begins, or
    concurrently. When showCompleted=false, the component unmounts on DB write so the
    settling phase never visually matters. When showCompleted=true, the settling phase
    smoothly removes the ring (as intended). Alternative: keep the task at opacity-0
    during settling by not removing the opacity-0 class, and only restore opacity after
    the DB write completes.

fix: Not yet applied
verification: Not yet done
files_changed: []
