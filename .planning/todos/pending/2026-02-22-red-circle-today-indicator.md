---
created: 2026-02-22T20:14:11.052Z
title: Red circle today indicator
area: ui
files:
  - src/components/calendar/DayCell.tsx
  - src/components/calendar/CalendarGrid.tsx
---

## Problem

Today's date is highlighted with a box around it. User wants a red circle behind the date number with white text instead, similar to Google Calendar's today indicator.

## Solution

Replace the current box/border styling on today's date with a red circle background (`bg-red-500 text-white rounded-full`) on the day number element.
