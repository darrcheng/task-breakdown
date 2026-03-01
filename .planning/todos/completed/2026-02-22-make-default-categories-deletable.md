---
created: 2026-02-22T20:14:11.052Z
title: Make default categories deletable
area: ui
files:
  - src/components/ui/CategoryManager.tsx
  - src/utils/categories.ts
---

## Problem

Default categories (Work, Personal, Health, Learning, Errands) cannot be deleted — only edited. User considers them suggestions and wants the ability to delete them too.

## Solution

Remove the `isDefault` guard on the delete button in CategoryManager. All categories should have the same delete behavior (click-again-to-confirm). Tasks with a deleted category should fall back to uncategorized.
