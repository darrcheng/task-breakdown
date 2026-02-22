---
created: 2026-02-22T20:14:11.052Z
title: Add keyboard shortcuts Google Calendar style
area: ui
files:
  - src/App.tsx
  - src/components/calendar/MonthNavigation.tsx
---

## Problem

No keyboard shortcuts exist. User wants Google Calendar-style keyboard navigation (e.g., J/K for prev/next period, T for today, M/W for month/week view, C for create).

## Solution

Add a global keyboard event listener in App.tsx that maps Google Calendar shortcuts to existing navigation and action handlers.
