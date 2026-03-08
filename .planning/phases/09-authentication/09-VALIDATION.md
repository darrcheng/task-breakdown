---
phase: 9
slug: authentication
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-07
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None -- no test framework configured |
| **Config file** | none |
| **Quick run command** | Manual smoke test |
| **Full suite command** | Manual walkthrough of all 7 requirements |
| **Estimated runtime** | ~5 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Manual smoke test -- sign in, verify app loads, sign out
- **After every plan wave:** Full manual walkthrough of all 7 requirements
- **Before `/gsd:verify-work`:** All requirements verified manually; Firestore rules verified via Firebase Console Rules Playground
- **Max feedback latency:** N/A (manual verification)

---

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Verification Method | Status |
|-------------|----------|-----------|---------------------|--------|
| AUTH-01 | Google sign-in works | manual-only | Click sign-in on desktop + mobile | ⬜ pending |
| AUTH-02 | Session persists across refresh | manual-only | Sign in, refresh, verify still signed in | ⬜ pending |
| AUTH-03 | User can sign out | manual-only | Click sign-out, verify redirected to sign-in | ⬜ pending |
| AUTH-04 | App gated behind auth | manual-only | Open app without session, verify sign-in screen | ⬜ pending |
| AUTH-05 | Popup on desktop, redirect on mobile | manual-only | Test on desktop browser + mobile browser | ⬜ pending |
| AUTH-06 | iOS Safari PWA standalone | manual-only | Test on real iOS device with PWA installed | ⬜ pending |
| DATA-01 | Per-user Firestore rules | manual-only | Deploy rules + Firebase Console Rules Playground | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None -- no automated test infrastructure to set up. All validation is manual for this phase. If the project later adds vitest, auth context can be unit-tested with mocked `onAuthStateChanged`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google sign-in | AUTH-01 | Real browser OAuth flow requires Google account | Click "Sign in with Google", complete OAuth, verify app loads |
| Session persistence | AUTH-02 | Requires real browser session state | Sign in, refresh browser, verify no re-login prompt |
| Sign-out | AUTH-03 | Requires active auth session | Click sign-out in Settings, verify sign-in screen appears |
| Auth gate | AUTH-04 | Requires no active session | Open app in incognito/fresh browser, verify sign-in screen |
| Popup vs redirect | AUTH-05 | Requires testing on both desktop and mobile | Test sign-in on desktop (popup) and mobile (redirect) |
| iOS PWA standalone | AUTH-06 | Requires real iOS device with PWA installed | Install PWA on iOS, test sign-in in standalone mode |
| Firestore rules | DATA-01 | Requires Firebase Console access | Deploy rules, test in Rules Playground with different UIDs |

---

## Validation Sign-Off

- [x] All tasks have manual verification or Wave 0 dependencies
- [x] Manual-only justified: all requirements involve real OAuth flows
- [x] No automated test infrastructure needed for this phase
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
