# Roadmap: TaskBreaker

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-01)
- 🚧 **v1.1 Deploy & Sync** — Phases 8-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) — SHIPPED 2026-03-01</summary>

- [x] Phase 1: Local-First Foundation (6/6 plans) — completed 2026-02-22
- [x] Phase 01.1: UI Polish (11/11 plans) — completed 2026-02-22
- [x] Phase 2: AI Task Breakdown (7/7 plans) — completed 2026-02-23
- [x] Phase 02.1: Gemini Model Selector (1/1 plans) — completed 2026-02-23
- [x] Phase 3: ADHD-Optimized UX (17/17 plans) — completed 2026-02-24
- [x] Phase 4: Cross-Platform Expansion (6/6 plans) — completed 2026-02-26
- [x] Phase 5: Swipe-Complete Celebration (2/2 plans) — completed 2026-03-01
- [x] Phase 6: Mobile Someday Navigation (1/1 plans) — completed 2026-03-01
- [x] Phase 7: Secondary Path Polish (1/1 plans) — completed 2026-03-01

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Deploy & Sync (In Progress)

**Milestone Goal:** Deploy TaskBreaker to Firebase Hosting and add real-time cross-device sync so tasks stay in sync between phone and PC.

- [x] **Phase 8: Firebase Project Setup** - Configure Firebase project, SDK, and billing plan — unblocks all subsequent phases (completed 2026-03-08)
- [ ] **Phase 9: Authentication** - Google sign-in with session persistence, sign-out, auth gate, and popup/redirect platform handling
- [ ] **Phase 10: Sync Engine** - Bidirectional Dexie-Firestore sync with offline-first, conflict resolution, echo guard, and data migration
- [ ] **Phase 11: Hosting Deploy** - Ship app to Firebase Hosting with correct SPA routing and PWA cache headers
- [ ] **Phase 12: Sync Polish** - Sync status indicator and error UX so users always know what the app is doing

## Phase Details

### Phase 8: Firebase Project Setup
**Goal**: Firebase project is configured and ready for code — SDK installed, credentials in environment, billing locked to Spark plan, and security rules deployed (not left open)
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: SETUP-03
**Success Criteria** (what must be TRUE):
  1. Firebase project exists on Spark plan (permanent free tier, not GCP trial credits)
  2. `npm install firebase` completes and `src/firebase/config.ts` initializes without error
  3. Firestore security rules are deployed and reject unauthenticated reads/writes
  4. `.env.local` with all `VITE_FIREBASE_*` vars is present and the app starts without Firebase errors in console
**Plans**: 2 plans
Plans:
- [ ] 08-01-PLAN.md -- Install Firebase SDK, create config files, rename app to taskpad
- [ ] 08-02-PLAN.md -- Create Firebase project, deploy rules, verify setup

### Phase 9: Authentication
**Goal**: Users can sign in with Google, stay signed in across sessions, and sign out — on all platforms including iOS Safari PWA standalone mode
**Depends on**: Phase 8
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, DATA-01
**Success Criteria** (what must be TRUE):
  1. User can sign in with their Google account on desktop (popup) and mobile (redirect)
  2. Auth session survives browser refresh — no re-login prompt for already-authenticated users
  3. User can sign out from any page; tasks become inaccessible after sign-out
  4. Unauthenticated users see the sign-in screen, not the task UI
  5. Sign-in works in iOS Safari with the PWA installed in standalone mode (hardware-verified)
  6. Firestore security rules enforce per-user data isolation (confirmed via Firebase console)
**Plans**: 3 plans
Plans:
- [ ] 09-01-PLAN.md — Auth infrastructure, sign-in screen, and auth gate
- [ ] 09-02-PLAN.md — Sign-out in SettingsModal and Firestore security rules
- [ ] 09-03-PLAN.md — Full manual verification across all platforms

### Phase 10: Sync Engine
**Goal**: Tasks created, edited, or deleted on one device appear on all other devices in real-time, the app works offline, and existing local tasks are preserved on first sign-in
**Depends on**: Phase 9
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, DATA-02
**Success Criteria** (what must be TRUE):
  1. Task created on desktop appears on mobile within ~1 second when both are online
  2. Tasks created offline are saved locally and sync automatically when connection returns
  3. Existing `useLiveQuery` hooks drive the UI unchanged — no component imports Firebase directly
  4. On first sign-in, existing local IndexedDB tasks are migrated to Firestore without data loss
  5. Rapid edits from the same device do not trigger redundant Firestore re-writes (echo guard active)
  6. Last edit wins when the same task is modified on two devices while one is offline (updatedAt LWW)
**Plans**: TBD

### Phase 11: Hosting Deploy
**Goal**: The app is live at a Firebase Hosting URL over HTTPS with correct SPA routing and PWA cache headers — deploy confirmed safe for existing Firestore data
**Depends on**: Phase 10
**Requirements**: SETUP-01, SETUP-02
**Success Criteria** (what must be TRUE):
  1. App is accessible at `[project-id].web.app` over HTTPS
  2. Refreshing on any deep route (e.g., `/someday`) returns the app, not a 404
  3. `sw.js` and `index.html` are served with `no-cache` headers; hashed JS/CSS assets with `immutable`
  4. PWA install prompt appears on mobile and app installs from the Firebase Hosting URL
  5. Running `npm run deploy` does not touch or alter any Firestore data
**Plans**: TBD

### Phase 12: Sync Polish
**Goal**: Users can see the sync state at a glance and recover from sync errors without confusion — no silent failures
**Depends on**: Phase 11
**Requirements**: DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Sync status indicator shows "synced", "syncing", or "offline" based on actual Firestore metadata
  2. When a sync error occurs, the user sees a message with recovery guidance — not a silent blank state
  3. Offline/online transitions are reflected in the UI within a few seconds
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Local-First Foundation | v1.0 | 6/6 | Complete | 2026-02-22 |
| 01.1. UI Polish | v1.0 | 11/11 | Complete | 2026-02-22 |
| 2. AI Task Breakdown | v1.0 | 7/7 | Complete | 2026-02-23 |
| 02.1. Gemini Model Selector | v1.0 | 1/1 | Complete | 2026-02-23 |
| 3. ADHD-Optimized UX | v1.0 | 17/17 | Complete | 2026-02-24 |
| 4. Cross-Platform Expansion | v1.0 | 6/6 | Complete | 2026-02-26 |
| 5. Swipe-Complete Celebration | v1.0 | 2/2 | Complete | 2026-03-01 |
| 6. Mobile Someday Navigation | v1.0 | 1/1 | Complete | 2026-03-01 |
| 7. Secondary Path Polish | v1.0 | 1/1 | Complete | 2026-03-01 |
| 8. Firebase Project Setup | v1.1 | Complete    | 2026-03-08 | - |
| 9. Authentication | 2/3 | In Progress|  | - |
| 10. Sync Engine | v1.1 | 0/TBD | Not started | - |
| 11. Hosting Deploy | v1.1 | 0/TBD | Not started | - |
| 12. Sync Polish | v1.1 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-05*
*Last updated: 2026-03-07 -- Phase 9 plans created (3 plans)*
