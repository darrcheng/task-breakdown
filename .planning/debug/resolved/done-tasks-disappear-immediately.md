---
status: resolved
trigger: "Done tasks disappear immediately when marked as done. User wants a delay before disappearing. The current pulsing amber ring for two-click reopen is not wanted."
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: confirmed - two independent issues found
test: code tracing complete
expecting: n/a
next_action: return structured findings

## Symptoms

expected: Done tasks should linger visibly for a few seconds before disappearing, giving the user a chance to undo
actual: Done tasks vanish instantly when showCompleted is false (default). The two-click reopen confirmation shows a pulsing amber ring which is not wanted.
errors: none (UX issue, not a crash)
reproduction: 1) Have showCompleted=false (default), 2) Click status circle on a task to cycle it to "done", 3) Task vanishes instantly from the list
started: always been this way since showCompleted filter was implemented

## Eliminated

(none needed - root cause was clear from first code read)

## Evidence

- timestamp: 2026-02-22T00:00:00Z
  checked: src/App.tsx line 30
  found: showCompleted defaults to false
  implication: by default, done tasks are filtered out

- timestamp: 2026-02-22T00:00:00Z
  checked: src/db/hooks.ts lines 13-14 and 36-37
  found: useTasksByDate and useTasksByDateRange both filter with `t.status !== 'done'` when showCompleted is false
  implication: the instant a task's status is written to IndexedDB as 'done', Dexie's live query re-fires and excludes it from results - the task vanishes from the UI with zero delay

- timestamp: 2026-02-22T00:00:00Z
  checked: src/components/list/TaskListItem.tsx lines 28-42
  found: handleStatusClick writes the new status to DB immediately via db.tasks.update()
  implication: no delay mechanism exists between status change and DB write

- timestamp: 2026-02-22T00:00:00Z
  checked: src/components/list/TaskListItem.tsx lines 31-35, 59-60
  found: two-click confirm reopen logic with confirmReopen state, pulsing amber ring classes 'ring-2 ring-offset-1 ring-amber-400 animate-pulse'
  implication: this is the unwanted UX - user does not want a confirmation step to reopen done tasks

- timestamp: 2026-02-22T00:00:00Z
  checked: src/components/list/TaskListItem.tsx line 60
  found: exact CSS classes for the pulsing amber ring: 'bg-emerald-500 border-emerald-500 ring-2 ring-offset-1 ring-amber-400 animate-pulse'
  implication: this entire conditional branch needs removal

## Resolution

root_cause: Two interrelated issues - (1) Dexie live queries instantly exclude done tasks when showCompleted=false, with no grace period, (2) TaskListItem has an unwanted two-click confirm-to-reopen pattern with a pulsing amber ring
fix: not yet applied (diagnosis only)
verification: n/a
files_changed: []
