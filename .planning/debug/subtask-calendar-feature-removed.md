---
status: resolved
trigger: "User reports AI-generated subtasks used to appear as independent tasks on calendar/list view. This was an INTENTIONAL FEATURE. A previous Claude session classified it as 'subtask data leak' and removed it in commit 6cf4e30."
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Claude misinterpreted user feedback and removed a desired feature
test: Full audit of UAT transcripts, diagnosis files, commit diffs, and planning docs
expecting: Evidence of misinterpretation chain
next_action: Return structured diagnosis

## Symptoms

expected: Subtasks appear as independent tasks on calendar and list views (the original behavior)
actual: Subtasks are filtered out of both views by !t.parentId filter added in commit 6cf4e30
errors: none
reproduction: Create a task, use AI to break it down into subtasks. Subtasks do not appear on calendar or list view.
started: Commit 6cf4e30 (2026-02-23)

## Evidence Chain

### 1. The Original User Report (03-UAT.md, first UAT, commit 2adfb3a)

Test 2 - User said:
> "Subtasks only visible in calendar view, not list view. No emerald ring border on subtask completion - task just disappears then reappears. Also, completing a task when 'showing done' causes it to straight up disappear."

KEY: The user said subtasks are "only visible in calendar view, not list view." This was a COMPLAINT that subtasks were MISSING from list view -- NOT a complaint that subtasks were visible on the calendar. The user wanted subtasks visible in BOTH views. The user never asked for subtasks to be removed from any view.

### 2. How Claude Misinterpreted (diagnosis at commit e9cbda5)

The debug agent's analysis in .planning/debug/subtask-celebration-animation.md reasoned:
> "In list view, DayGroup has NO parentId filter and TaskListItem has NO SubtaskList. The fix is: useTasksByDateRange and useTasksByDate should filter out subtasks (!t.parentId)... The cleanest fix is to filter out subtasks at the hook level (root tasks only for date views) since SubtaskList already queries them separately via useSubtasks."

The agent labeled it "Bug 1: subtasks missing from list view" but then concluded the fix was to REMOVE subtasks from queries rather than DISPLAY them properly. The reasoning was that since TaskListItem had no SubtaskList component to render them nested, they appeared as "flat orphaned rows" -- and the agent decided filtering them out was "the cleanest fix."

### 3. What the Plan Called It (03-06-PLAN.md)

The plan codified this as:
- Truth: "Subtasks do not leak into flat list view as orphan rows"
- Artifact: 'src/db/hooks.ts provides "parentId filter on useTasksByDate and useTasksByDateRange"'

The plan used the phrase "subtask data leak" -- a characterization that Claude invented. The user never used the word "leak."

### 4. The Actual Code Change (commit 6cf4e30, src/db/hooks.ts)

Added `!t.parentId` to ALL 4 filter predicates in useTasksByDate and useTasksByDateRange. This removed subtasks from both calendar AND list views globally.

### 5. User Immediately Noticed and Complained (03-retest-UAT.md, test 2)

In the very next UAT after the fix, user said:
> "No animation, it just disappears. Perhaps this is to do with the filter that all done tasks are not shown? Also my subtasks are no longer displayed on the calendar. Subtasks are still not displayed in list view"

The user explicitly complained that subtasks are "no longer displayed on the calendar" -- confirming that subtasks appearing on the calendar was a feature they noticed and valued, and they were unhappy it was removed.

### 6. User Doubled Down (03-UAT.md second round, test 13)

Test 13 note:
> "User wants subtasks visible as separate cards on calendar and as rows in list view"

Test 14 reported:
> "I see the number, but I don't see the actual subtask tree when I look at the info in list view. There also isn't AI breakdown in list view. List view should have all the same features as calendar view."

The user explicitly wanted subtasks as separate cards/rows, NOT just nested under parent tasks.

## Eliminated

- hypothesis: The user wanted subtasks removed from calendar/list views
  evidence: User explicitly complained when they were removed ("my subtasks are no longer displayed on the calendar") and explicitly requested them visible ("User wants subtasks visible as separate cards on calendar and as rows in list view")
  timestamp: 2026-02-23

- hypothesis: The "data leak" characterization came from user feedback
  evidence: The user never used the word "leak" or "orphan" in any UAT report. These terms were invented by the Claude diagnosis agent.
  timestamp: 2026-02-23

## Resolution

root_cause: |
  Claude misinterpreted user feedback and removed an intentional feature.

  The user's original complaint was: "Subtasks only visible in calendar view, not list view."
  This meant: "I want subtasks visible in BOTH views, but they only show on calendar."

  Claude interpreted this as: "Subtasks appearing in these views is a data leak bug."
  Claude's fix: Add !t.parentId filter to remove subtasks from ALL date-based queries.

  This had the OPPOSITE effect of what the user wanted:
  - BEFORE fix: Subtasks visible on calendar (user liked this), missing from list view (user wanted this fixed)
  - AFTER fix: Subtasks visible in NEITHER view (user immediately complained)

  The misinterpretation chain:
  1. User said subtasks missing from list view (wanted them added)
  2. Debug agent noticed subtasks appeared as "flat orphaned rows" in calendar
  3. Agent decided flat display = bug, instead of recognizing it as a feature
  4. Agent labeled it "subtask data leak" (user never used this term)
  5. Plan codified "Subtasks do not leak into flat list view as orphan rows" as a truth
  6. Fix removed subtasks from both hooks globally
  7. User immediately complained in next UAT

fix: Remove !t.parentId from useTasksByDate and useTasksByDateRange filters
verification: N/A (research only, no code changes made)
files_changed: []
