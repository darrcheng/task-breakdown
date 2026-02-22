---
created: 2026-02-22T20:14:11.052Z
title: Add settings modal
area: ui
files:
  - src/App.tsx
---

## Problem

No settings UI exists. User wants a settings modal with at minimum: start-of-week preference (Sunday/Monday) and keyboard shortcut bindings configuration.

## Solution

Create a SettingsModal component with:
- Start of week toggle (Sunday/Monday) — persisted to IndexedDB or localStorage
- Keyboard shortcut bindings display/edit
- Wire start-of-week into calendar grid rendering (affects getCalendarDays, DAY_NAMES order).
