---
created: 2026-02-22T20:14:11.052Z
title: Position modal near clicked date
area: ui
files:
  - src/components/task/TaskModal.tsx
  - src/components/calendar/DayCell.tsx
  - src/App.tsx
---

## Problem

Task create/edit modal opens at top-left corner. User wants it positioned near the clicked date cell, similar to Google Calendar's popover behavior.

## Solution

Capture click coordinates (or target element rect) from DayCell click, pass to TaskModal, and position it as a popover near the source element. Consider using CSS `position: fixed` with calculated top/left, or switch from `<dialog>` to a positioned popover.
