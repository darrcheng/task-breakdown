# Requirements: TaskBreaker

**Defined:** 2026-03-01
**Core Value:** Turn vague, paralyzing tasks into small, concrete steps you can start right now

## v1.1 Requirements

Requirements for Deploy & Sync milestone. Each maps to roadmap phases.

### Firebase Setup

- [ ] **SETUP-01**: App is deployed to Firebase Hosting with correct SPA routing
- [ ] **SETUP-02**: Service worker and index.html served with `no-cache` headers; hashed assets with `immutable`
- [x] **SETUP-03**: Firebase project configured on Spark plan (permanent free tier, not just trial credits)

### Authentication

- [x] **AUTH-01**: User can sign in with their Google account
- [x] **AUTH-02**: Auth session persists across browser refresh (no re-login needed)
- [x] **AUTH-03**: User can sign out
- [x] **AUTH-04**: App is gated behind auth — must sign in to access tasks
- [x] **AUTH-05**: Sign-in uses popup on desktop and redirect on mobile/PWA
- [x] **AUTH-06**: Sign-in works in iOS Safari standalone PWA mode

### Sync

- [x] **SYNC-01**: Tasks created/edited/deleted on one device appear on other devices in real-time
- [x] **SYNC-02**: App works offline — tasks are saved locally and sync when connection returns
- [x] **SYNC-03**: Dexie.js remains the UI data source — existing `useLiveQuery` hooks unchanged
- [x] **SYNC-04**: Conflict resolution uses last-write-wins with `updatedAt` timestamp
- [x] **SYNC-05**: Sync engine prevents echo loops (own writes don't trigger re-writes via `hasPendingWrites`)

### Data Safety

- [x] **DATA-01**: Firestore security rules restrict each user to only their own data
- [x] **DATA-02**: On first sign-in, existing local tasks are migrated to Firestore
- [x] **DATA-03**: Sync status indicator shows synced/syncing/offline state
- [x] **DATA-04**: Sync errors surface to user with recovery guidance (not silent failures)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### UI Polish

- **UI-01**: Status cycling accidental click safety (debounce/confirmation)
- **UI-02**: Category filter with multiple selection
- **UI-03**: Today view for PC (mobile done)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / team features | Personal tool first; auth is single-user ready but no sharing UX |
| CI/CD pipeline | Manual deploy sufficient for single developer |
| Custom domain | Firebase default domain sufficient for now |
| Analytics | Not needed for personal use |
| Firebase Cloud Messaging (push notifications) | ADHD users find intrusive notifications harmful |
| reactfire library | Experimental, last released June 2023, React 19 unverified |
| Firestore built-in IndexedDB persistence | Conflicts with Dexie as source of truth — use memoryLocalCache |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 11 | Pending |
| SETUP-02 | Phase 11 | Pending |
| SETUP-03 | Phase 8 | Complete |
| AUTH-01 | Phase 9 | Complete |
| AUTH-02 | Phase 9 | Complete |
| AUTH-03 | Phase 9 | Complete |
| AUTH-04 | Phase 9 | Complete |
| AUTH-05 | Phase 9 | Complete |
| AUTH-06 | Phase 9 | Complete |
| SYNC-01 | Phase 10 | Complete |
| SYNC-02 | Phase 10 | Complete |
| SYNC-03 | Phase 10 | Complete |
| SYNC-04 | Phase 10 | Complete |
| SYNC-05 | Phase 10 | Complete |
| DATA-01 | Phase 9 | Complete |
| DATA-02 | Phase 10 | Complete |
| DATA-03 | Phase 12 | Complete |
| DATA-04 | Phase 12 | Complete |

**Coverage:**
- v1.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 — traceability filled after roadmap creation*
