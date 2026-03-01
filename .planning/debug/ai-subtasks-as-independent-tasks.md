---
status: resolved
trigger: "User says AI-generated subtasks used to also create full tasks that showed up on calendar/list view, but this feature was removed."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: Feature never existed as designed — it was a bug that was later fixed
test: Traced full git history of useBreakdown.ts and hooks.ts
expecting: Either a removed feature or an unintentional behavior change
next_action: Return research findings

## Symptoms

expected: AI-generated subtasks also appear as independent tasks on calendar/list view
actual: Subtasks only appear nested inside parent task modal (SubtaskList), not on calendar or list
errors: N/A (feature request / regression report)
reproduction: Run AI breakdown on any task, accept subtasks — they only appear in SubtaskList inside the parent
started: User reports it "used to work"

## Eliminated

- hypothesis: A feature to create independent tasks alongside subtasks was explicitly built and then removed
  evidence: Exhaustive git log search (--grep for "independent", "promote", "dual", "calendar subtask", git -p -S searches on useBreakdown.ts) found zero evidence of any code that created tasks without parentId in the breakdown flow. The acceptSubtasks function has ALWAYS set parentId on every subtask from the very first commit (4ef17d7).
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: Original useBreakdown.ts at commit 4ef17d7 (first ever version)
  found: acceptSubtasks has always created subtasks with parentId set — line `parentId: parentTask.id!`. No code path ever created root-level (parentId-less) tasks from AI breakdown.
  implication: The "independent tasks on calendar" feature was never explicitly coded.

- timestamp: 2026-02-23
  checked: hooks.ts history — specifically the !t.parentId filter addition
  found: Before commit 6cf4e30 (fix(03-06)), useTasksByDate and useTasksByDateRange did NOT filter out tasks with parentId. This means subtasks WERE returned in calendar and list view queries alongside root tasks. They appeared as flat, orphan TaskListItem/TaskCard rows mixed in with regular tasks.
  implication: The user's observation was correct — subtasks DID appear on calendar/list view, but this was an unintentional data leak, not a designed feature.

- timestamp: 2026-02-23
  checked: Commit 6cf4e30 message and diff
  found: The commit explicitly describes adding "!t.parentId filter to all 4 filter predicates in useTasksByDate and useTasksByDateRange" as a fix for a "subtask data leak." The fix was applied to both showCompleted=true and showCompleted=false branches.
  implication: The behavior the user remembers was classified as a bug ("data leak") and was intentionally fixed. Subtasks showing on calendar/list was never a feature — it was the absence of proper filtering.

- timestamp: 2026-02-23
  checked: Planning docs (03-06-SUMMARY.md, debug/subtask-celebration-animation.md)
  found: The debug session that led to this fix (subtask-celebration-animation.md) identified the root cause as "hooks return subtasks to list view, but list view has no mechanism to render them nested" and recommended adding !t.parentId filter. The SUMMARY calls it a "subtask data leak fix."
  implication: The fix was correct for the bug it addressed. Subtasks were showing as flat orphan rows without parent context — not as properly integrated independent tasks.

## Resolution

root_cause: |
  The feature the user remembers was NEVER a designed feature — it was an unintentional data leak.

  TIMELINE:
  1. Commit 621124f (02-01): Added parentId/depth fields to Task model. useSubtasks hook created to query subtasks by parentId. But useTasksByDate and useTasksByDateRange were NOT updated to filter out subtasks.
  2. Commit 4ef17d7 (02-03): acceptSubtasks always creates tasks with parentId set. Subtasks appeared in date-based queries because those queries had no parentId exclusion.
  3. Between 02-03 and 03-06: Subtasks appeared as flat orphan rows on both calendar and list views (the behavior the user remembers).
  4. Commit 6cf4e30 (03-06): Added !t.parentId to all 4 filter predicates, correctly fixing the data leak. Subtasks now only appear via SubtaskList inside parent task modals.

  The user is misremembering a bug as a feature.

fix: N/A (research only)
verification: N/A
files_changed: []
