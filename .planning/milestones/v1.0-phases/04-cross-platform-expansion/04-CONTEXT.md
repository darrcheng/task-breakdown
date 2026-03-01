# Phase 4: Cross-Platform Expansion - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing React/Vite/Dexie app work equally well on mobile devices via PWA. Responsive layout, touch-optimized interactions, and offline capability. Deployment and data sync are explicitly excluded — deferred to Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Mobile delivery method
- PWA only — no Capacitor wrapper in this phase
- App manifest for "Add to Home Screen" with subtle, dismissable install prompt (shown after a few visits)
- Service worker for offline caching — app loads and works offline with cached data
- AI breakdown gracefully shows "no connection" when offline (cache-only strategy, no request queueing)
- Standalone display mode (no browser chrome when launched from home screen)
- Simple load — no branded splash screen
- Testing via local network (Vite dev server network URL on same WiFi)

### Responsive layout
- Calendar view: day-focused scroll on mobile — show one day at a time, swipe left/right between days
- Horizontal date strip at top for quick date navigation (like iOS Calendar — row of date circles, tap to jump, swipe strip for more dates)
- Bottom tab bar for view switching (Calendar, List, Settings) — fixed, always accessible
- Task create/edit forms appear as bottom sheets (slide up from bottom, draggable to expand)

### Touch interactions
- Long-press to drag for rescheduling tasks (pick up task, drag to date strip or adjacent day)
- Swipe-to-reveal action buttons on task rows (swipe left for Delete/Done, like iOS Mail)
- Light haptic feedback on task completion (Vibration API)

### Claude's Discretion
- AI breakdown button placement on mobile (inline vs FAB vs other)
- App icon design and theme color (match existing UI)
- Exact breakpoint for mobile vs desktop layout
- Service worker caching strategy details
- Bottom sheet drag/snap behavior specifics

</decisions>

<specifics>
## Specific Ideas

- Day-focused view should feel like swiping through days on a mobile calendar app
- Date strip inspired by iOS Calendar's horizontal scrolling date circles
- Bottom tab bar is a standard mobile pattern — Calendar, List, Settings tabs
- Swipe actions should feel like iOS Mail (smooth, with color-coded action buttons revealed)
- Haptic feedback adds satisfying micro-interaction for ADHD reward loop

</specifics>

<deferred>
## Deferred Ideas

- **Firebase Deploy + Sync (Phase 5):** Combined deployment (Firebase Hosting) and data sync (Firestore) phase. Deploy app to the web and enable cross-device data synchronization in one phase.
- **Capacitor wrapper:** Wrap PWA in native shell for App Store/Play Store distribution. Low migration cost from PWA.
- **On-device AI:** Run Gemma or similar model locally via WebLLM/WebGPU for offline AI breakdown. Separate capability phase.
- **Push notifications:** PWA push notification support for task reminders. (Reminders currently out of scope for v1.)

</deferred>

---

*Phase: 04-cross-platform-expansion*
*Context gathered: 2026-02-26*
