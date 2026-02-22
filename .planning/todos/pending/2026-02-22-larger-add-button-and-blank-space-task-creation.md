---
created: 2026-02-22T20:14:11.052Z
title: Larger add button and blank space task creation
area: ui
files:
  - src/components/list/DayGroup.tsx
---

## Problem

The "+" button in list view day group headers is too small. User also wants to be able to click blank space underneath a day group to trigger task creation.

## Solution

Increase the "+" button size (larger padding, bigger icon). Add an onClick handler to the empty area below the task list within each DayGroup that triggers inline create.
