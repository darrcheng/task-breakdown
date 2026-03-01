---
created: 2026-02-22T20:14:11.052Z
title: Add category field to inline task creation
area: ui
files:
  - src/components/task/TaskInlineCreate.tsx
---

## Problem

Inline task creation in list view only has a title field. User wants a category field as well, defaulting to uncategorized.

## Solution

Add a category selector (matching the searchable picker from the category todo) next to the title input in TaskInlineCreate. Default to uncategorized (no category selected).
