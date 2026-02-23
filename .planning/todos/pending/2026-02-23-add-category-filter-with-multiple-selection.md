---
created: 2026-02-23T22:49:11.239Z
title: Add category filter with multiple selection
area: ui
files: []
---

## Problem

Users cannot filter tasks by category. When many tasks exist across different categories, there's no way to narrow down the view to specific categories of interest. Users need the ability to filter by one or more categories simultaneously.

## Solution

- Add a category filter UI element (e.g., filter bar or dropdown)
- Support multiple category selection (checkboxes or multi-select chips)
- Filter tasks in both calendar and list views based on selected categories
- Show all categories when no filter is active
- Persist filter selection during the session
