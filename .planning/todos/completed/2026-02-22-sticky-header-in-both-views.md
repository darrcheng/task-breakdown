---
created: 2026-02-22T20:14:11.052Z
title: Sticky header in both views
area: ui
files:
  - src/App.tsx
---

## Problem

The app header scrolls out of view, making the view toggle and other controls inaccessible without scrolling back to the top. User wants the header to be sticky in both calendar and list views.

## Solution

Add `sticky top-0 z-40` to the `<header>` element in App.tsx so it stays visible during scroll.
