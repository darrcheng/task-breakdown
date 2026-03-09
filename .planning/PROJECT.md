# TaskBreaker

## What This Is

An ADHD-friendly to-do list app with AI-powered task breakdown. Write a vague or overwhelming task, tap "Break it down," and get actionable subtasks you can start right now. Features a calendar-based daily view, energy-level tagging, celebration animations, gentle reschedule prompts, and full web/mobile parity as a PWA.

## Core Value

Turn vague, paralyzing tasks into small, concrete steps you can start right now. The app does the executive function work of breaking things down so you don't have to.

## Requirements

### Validated

- ✓ Calendar-based daily view showing tasks for each day — v1.0
- ✓ Create, edit, and delete tasks — v1.0
- ✓ Drag tasks between calendar days to reschedule — v1.0
- ✓ Mark tasks as done (clears from calendar view) — v1.0
- ✓ Data persists across browser sessions via IndexedDB — v1.0
- ✓ AI-powered subtask generation — tap a button, get subtasks instantly — v1.0
- ✓ Edit, reorder, delete, and regenerate AI-generated subtasks — v1.0
- ✓ Recursive breakdown — subtasks can be broken down further (3 levels) — v1.0
- ✓ Swappable AI provider (Gemini/Claude/OpenAI with model selection) — v1.0
- ✓ Works on both web and mobile (PWA with responsive layout) — v1.0
- ✓ Energy level tagging (low/medium/high) with filtering — v1.0
- ✓ AI-suggested time estimates for tasks — v1.0
- ✓ Celebration animation on task completion (checkbox and swipe) — v1.0
- ✓ Gentle reschedule prompts for overdue tasks — v1.0
- ✓ Start-here highlighting on first subtask — v1.0
- ✓ Swipe-complete triggers identical celebration and haptic as checkbox — v1.0
- ✓ Mobile Someday navigation via bottom tab bar — v1.0
- ✓ Firebase project on Spark plan with Firestore security rules — v1.1
- ✓ Google sign-in with session persistence, auth gate, popup/redirect — v1.1
- ✓ Real-time Firestore sync with offline-first IndexedDB (Dexie) — v1.1
- ✓ Deployed to Firebase Hosting with SPA routing and PWA cache headers — v1.1
- ✓ Data migration on first sign-in, deploys don't touch Firestore data — v1.1
- ✓ Sync status indicator with error recovery UX — v1.1

### Active

(None — planning next milestone)

### Out of Scope

- Team/collaboration features — personal tool first
- Notifications/reminders — ADHD users find intrusive notifications harmful
- Recurring tasks — adds complexity, defer to later
- Time tracking — not core to the breakdown value, risks productivity-shame spiral
- Productivity analytics — comparing to "ideal" worsens ADHD shame
- Social comparison — worsens inadequacy feelings
- Rigid deadline enforcement — creates anxiety for ADHD users

## Context

Shipped v1.1 Deploy & Sync with 8,463 LOC TypeScript.
Tech stack: React + Vite 5 + Tailwind CSS 4 + Dexie.js + Firebase (Auth, Firestore, Hosting) + dnd-kit + vite-plugin-pwa.
Live at taskpad-app.web.app. Cross-device sync working between phone and PC.
Built v1.0 in 24 days (234 commits, 9 phases). Built v1.1 in 3 days (23 commits, 5 phases).
Firebase on Spark plan (permanent free tier) — sufficient for single-user usage.

## Constraints

- **AI Provider**: Provider-agnostic with swappable backends — Gemini (5 models including Gemma), Claude, OpenAI
- **Platform**: PWA with responsive layout — web and mobile with equal priority
- **Cost**: Minimize ongoing costs for personal use (Gemini free tier default)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Swappable AI provider | User wants to start free, upgrade later | ✓ Good — Gemini/Claude/OpenAI all working |
| Calendar-day based organization | Mirrors user's existing Notion workflow | ✓ Good — validated in Phase 1 |
| Personal-first, shareable later | Reduces initial complexity (no auth, teams) | ✓ Good — validated in Phase 1 |
| React + Vite + Tailwind CSS | Fast dev cycle, modern stack, excellent DX | ✓ Good — Phase 1 |
| Dexie.js for IndexedDB | Reactive queries via useLiveQuery, simple API | ✓ Good — Phase 1 |
| @dnd-kit for drag-and-drop | Composable, accessible, works with React 19 | ✓ Good — Phase 1 |
| Div-based overlay for modals | Replaced native dialog for positioning control | ✓ Good — Phase 01.1 |
| Per-cell reactive queries | Each DayCell queries own tasks, Dexie handles reactivity | ✓ Good — Phase 1 |
| PWA over React Native | Responsive web app with service worker, single codebase | ✓ Good — Phase 4 |
| BottomSheet for mobile modals | CSS transform drag-to-dismiss, replaces popover on mobile | ✓ Good — Phase 4 |
| Double-rAF animation pattern | Guarantees browser composites ring state before opacity-0 | ✓ Good — Phase 3 |
| Departing state machine | 4-phase departure animation with deferred DB write | ✓ Good — Phase 3 |
| Settling phase removed | Caused flash-back; direct fade + DB write is cleaner | ✓ Good — Phase 5 |
| onRegisterComplete callback | Parent stores child triggerComplete in refs Map by task.id | ✓ Good — Phase 5 |
| Firebase on Spark plan | Permanent free tier, not GCP trial credits | ✓ Good — Phase 8 |
| Dexie as sole UI read source | Firestore is sync transport only, not competing cache | ✓ Good — Phase 10 |
| signInWithPopup everywhere | Popup works on all browsers including iOS Safari standalone | ✓ Good — Phase 9 |
| per-table clear() on sign-out | Preserves Dexie connection (db.delete() destroyed it) | ✓ Good — Phase 10 |
| useSyncExternalStore for sync status | Tear-safe, concurrent-mode ready subscription | ✓ Good — Phase 12 |
| Silent retry with exponential backoff | 2s, 4s delays before surfacing error to user | ✓ Good — Phase 12 |

---
*Last updated: 2026-03-09 after v1.1 milestone*
