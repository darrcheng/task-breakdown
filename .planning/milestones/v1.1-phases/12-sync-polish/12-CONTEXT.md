# Phase 12: Sync Polish - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Sync status indicator and error UX so users always know what the app is doing. Users can see sync state at a glance and recover from sync errors without confusion — no silent failures. Covers requirements DATA-03 (sync status indicator) and DATA-04 (sync error recovery UX).

</domain>

<decisions>
## Implementation Decisions

### Status indicator placement
- Cloud icon in the header bar, top-right area (near Settings button)
- Desktop: icon sits in the header alongside existing controls
- Mobile: icon in the top status area, above content (mirrors desktop placement)
- Replace the existing `OfflineIndicator` banner entirely — the sync icon is the single source of truth for connectivity and sync state

### Icon states
- Cloud-check (green, static) = synced — all writes confirmed
- Cloud-upload with spinner (blue, spinning) = syncing — 1+ writes pending
- Cloud-off (amber, static) = offline — no internet connection
- Cloud-alert (red, static) = error — sync failed after retries
- Use lucide-react cloud icons to match existing icon library

### Visibility
- Synced state (cloud-check) is always visible in the header — provides constant reassurance
- No fade-out or hide-when-synced behavior

### Popover behavior
- Tapping/clicking the sync icon shows a small popover on ALL states
- Synced: "All changes synced"
- Syncing: "Syncing changes..."
- Offline: "Offline — changes saved locally"
- Error: "Sync failed — check your connection and try again" with [Retry] and [Dismiss] buttons
- Simple user-friendly messages only — no technical details, no error codes, no expandable sections

### Error handling
- Auto-retry failed writes 2 times silently (2s delay, then 4s delay) before showing error to user
- After 3rd failure, icon turns red (cloud-alert) and error popover is available
- Retry button clears the error state and lets the Firestore SDK retry buffered writes
- If retry succeeds, icon returns to synced; if fails again, icon stays red

### Offline/online transitions
- Icon changes immediately when `navigator.onLine` fires — no debounce
- On reconnect: icon transitions cloud-off → cloud-syncing (brief) → cloud-check
- No "back online" banner or toast — the icon transition IS the confirmation

### Sync state granularity
- App-level only — one global sync indicator, no per-task sync badges or dots
- No last-synced timestamp shown anywhere
- ADHD-friendly: minimal information to process

### Claude's Discretion
- Exact cloud icon variants from lucide-react (CloudCheck, CloudUpload, CloudOff, CloudAlert or similar)
- Popover component implementation (custom or reuse existing pattern)
- How to track pending writes count in sync module (callback, event emitter, or React state)
- Spinner animation approach for syncing state
- Mobile popover positioning

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/mobile/OfflineIndicator.tsx`: Will be REPLACED — uses `navigator.onLine` events, same pattern reusable in new sync hook
- `src/firebase/sync.ts`: Has `isSyncEnabled()`, `isMigrating()`, `handleSyncError()` — needs expansion to track sync states and expose them to React
- `src/contexts/AuthContext.tsx`: Manages `syncing` state during migration — sync status hook/context may integrate here or be separate
- `lucide-react`: Already used throughout for icons (Cloud*, WifiOff, etc.)

### Established Patterns
- Dexie remains sole UI data source — sync status comes from sync module, NOT from Firestore reads
- `handleSyncError()` in sync.ts currently only does `console.error` — needs to be expanded with retry logic and error state
- Auth context pattern: `createContext` + `useAuth()` hook — sync status could follow same pattern
- Existing header layout has icon buttons with `gap-3` spacing

### Integration Points
- `src/App.tsx`: Header bar (desktop) and MobileLayout (mobile) — add sync icon component here
- `src/firebase/sync.ts`: Expand `handleSyncError()` with retry logic, add sync state tracking
- `src/components/mobile/OfflineIndicator.tsx`: Remove after sync icon replaces it
- `src/App.tsx` line 200: Remove `<OfflineIndicator />` from mobile layout

</code_context>

<specifics>
## Specific Ideas

- The icon should feel like Google Docs' sync indicator — always there, unobtrusive, cloud metaphor
- Error messages should be ADHD-friendly: clear, short, actionable, not overwhelming
- "All changes synced" wording (not "Up to date" or "Synced") for the synced popover

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-sync-polish*
*Context gathered: 2026-03-09*
