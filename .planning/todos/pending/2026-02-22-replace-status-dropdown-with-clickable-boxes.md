---
created: 2026-02-22T20:14:11.052Z
title: Replace status dropdown with clickable boxes
area: ui
files:
  - src/components/task/TaskForm.tsx
---

## Problem

Status field in TaskForm uses a dropdown with separate status color boxes underneath. User wants just 3 clickable status boxes (todo/in-progress/done) since there are only 3 options — no dropdown needed.

## Solution

Remove the `<select>` dropdown for status. Replace with 3 clickable status indicator boxes using the existing STATUS_COLORS, with the selected one visually highlighted (e.g., ring or scale).
