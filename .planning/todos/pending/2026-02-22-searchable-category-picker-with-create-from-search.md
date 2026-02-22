---
created: 2026-02-22T20:14:11.052Z
title: Searchable category picker with create from search
area: ui
files:
  - src/components/task/TaskForm.tsx
  - src/components/ui/CategoryManager.tsx
---

## Problem

Category field is a plain dropdown. User wants: (1) starts blank/uncategorized by default, (2) searchable list with most recent category at top, (3) ability to create a new category inline if search returns no matches, (4) category icons shown in the picker.

## Solution

Replace the category `<select>` with a custom combobox/search input that:
- Shows "Uncategorized" by default (empty value)
- Opens a filterable list on focus
- Sorts by most recently used
- Shows category icon next to each name
- Has a "Create [search term]" option at bottom when no exact match
