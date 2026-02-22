---
created: 2026-02-22T20:14:11.052Z
title: Status cycling accidental click safety
area: ui
files:
  - src/components/list/TaskListItem.tsx
---

## Problem

Status cycling (todo → in-progress → done → todo) can cause accidental state changes, especially cycling back from done. User wants protection against accidental clicks.

## Solution

Options: (1) Add a brief delay/confirmation when cycling from done back to todo, (2) use a click-and-hold or double-click for the "reset" transition, or (3) show a brief undo toast after cycling to done. Pick the least disruptive option.
