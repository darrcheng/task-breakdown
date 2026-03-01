---
status: diagnosed
phase: 05-swipe-complete-celebration-pipeline
source: 05-01-SUMMARY.md
started: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Swipe-Complete Triggers Celebration Animation
expected: On mobile, swiping a task to complete triggers the same 4-phase departure animation (ring fill → fade → settling → removal) as tapping the checkbox.
result: issue
reported: "Fail, clicking the check box does nothing. Also, the animation is weird. The task goes away, then comes back for a quick second before then disappearing again. Didn't we have this issue on desktop? Why is it reappearing?"
severity: blocker

### 2. Haptic Feedback on Swipe-Complete
expected: When swiping a task to complete on mobile, haptic feedback fires — same as checkbox completion.
result: skipped
reason: can't test haptic on desktop

### 3. Cancel Completion via Re-click After Swipe
expected: After swiping to complete (during the animation), tapping the checkbox cancels the completion and restores the task — same undo behavior as checkbox-initiated completion.
result: pass

### 4. Checkbox Completion Still Works Normally
expected: Tapping the checkbox to complete a task still triggers the full celebration animation and haptic feedback — swipe wiring did not break existing behavior.
result: pass

## Summary

total: 4
passed: 2
issues: 1
pending: 0
skipped: 1

## Gaps

- truth: "Swipe-complete triggers same 4-phase departure animation as checkbox"
  status: failed
  reason: "User reported: Fail, clicking the check box does nothing. Also, the animation is weird. The task goes away, then comes back for a quick second before then disappearing again. Didn't we have this issue on desktop? Why is it reappearing?"
  severity: blocker
  test: 1
  root_cause: "Two bugs: (1) triggerComplete gates on getNextStatus===done but todo->in-progress, so swipe/checkbox does nothing for todo tasks. (2) Settling phase removes opacity-0, causing task to fade back to visible before DB write removes it from DOM — same bug class as Phase 03."
  artifacts:
    - path: "src/components/list/TaskListItem.tsx"
      issue: "triggerComplete getNextStatus guard blocks todo tasks; settling phase removes opacity-0 causing flash-back"
  missing:
    - "Remove getNextStatus check — triggerComplete should force-complete to done regardless of current status"
    - "Move DB write before settling phase so component unmounts before flash-back when showCompleted=false"
  debug_session: ".planning/debug/swipe-complete-flashback.md"
