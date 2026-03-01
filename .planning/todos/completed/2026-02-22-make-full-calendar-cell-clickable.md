---
created: 2026-02-22T20:14:11.052Z
title: Make full calendar cell clickable
area: ui
files:
  - src/components/calendar/DayCell.tsx
---

## Problem

Only the date number in calendar cells is clickable to create tasks. User wants the entire blank space in the cell to be clickable for task creation.

## Solution

Move the onClick handler from the date number to the cell container div, excluding clicks on existing task cards (use event target check or stopPropagation on TaskCard clicks).
