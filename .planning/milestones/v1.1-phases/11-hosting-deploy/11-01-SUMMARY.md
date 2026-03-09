---
phase: 11-hosting-deploy
plan: 01
subsystem: infra
tags: [firebase-hosting, deploy, pwa, cache-headers, spa]

requires:
  - phase: 10-pwa-offline
    provides: Service worker, PWA manifest, Workbox config
provides:
  - Firebase Hosting deployment at taskpad-app.web.app
  - SPA rewrite routing for deep links
  - PWA-correct cache headers (no-cache for dynamic, immutable for hashed)
  - npm deploy scripts for safe hosting-only deploys
affects: []

tech-stack:
  added: []
  patterns: [firebase-hosting-config, npm-deploy-scripts]

key-files:
  created: []
  modified:
    - firebase.json
    - package.json
    - src/components/auth/SignInScreen.tsx

key-decisions:
  - "Catch-all ** header rule for no-cache to cover SPA rewrite responses"
  - "Switched mobile auth from redirect to popup flow — redirect breaks on mobile due to third-party cookie restrictions"

patterns-established:
  - "Deploy via npm run deploy only — never bare firebase deploy"
  - "firebase deploy --only hosting to protect Firestore data"

requirements-completed: [SETUP-01, SETUP-02]

duration: 15min
completed: 2026-03-09
---

# Phase 11: Hosting Deploy Summary

**Firebase Hosting live at taskpad-app.web.app with SPA routing, PWA cache headers, and hosting-only deploy scripts**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- App deployed and accessible at https://taskpad-app.web.app over HTTPS
- SPA rewrite rule serves index.html for all routes — /someday refresh works
- Cache headers: no-cache for index.html/sw.js, immutable for hashed assets
- npm scripts: `deploy` (hosting-only) and `deploy:rules` (firestore rules only)
- Fixed mobile auth by switching from redirect to popup flow

## Task Commits

1. **Task 1: Configure Firebase Hosting and deploy scripts** - `1b288f7` (feat)
2. **Task 2: Deploy and verify live site** - `176cf19` (fix — cache headers + mobile auth)

## Files Created/Modified
- `firebase.json` - Added hosting section with SPA rewrite, cache headers, predeploy hook, ignore list
- `package.json` - Added deploy and deploy:rules npm scripts
- `src/components/auth/SignInScreen.tsx` - Switched mobile auth to popup flow

## Decisions Made
- Added catch-all `**` no-cache header rule because Firebase's `/index.html` source match doesn't apply to SPA rewrite responses (they arrive as `/` or `/someday`, not `/index.html`)
- Switched mobile sign-in from `signInWithRedirect` to `signInWithPopup` — redirect flow fails on mobile browsers due to third-party cookie blocking

## Deviations from Plan

### Auto-fixed Issues

**1. Cache headers not applying to SPA rewrite responses**
- **Found during:** Task 2 (deploy verification)
- **Issue:** `source: "/index.html"` header rule only matches direct `/index.html` requests, not SPA rewrite responses served as `/` or `/someday`
- **Fix:** Added catch-all `source: "**"` no-cache rule before assets rule; assets `source: "/assets/**"` overrides with immutable (last match wins)
- **Files modified:** firebase.json
- **Verification:** User confirmed no-cache on taskpad-app.web.app in DevTools
- **Committed in:** 176cf19

**2. Mobile sign-in redirect failing**
- **Found during:** Task 2 (deploy verification)
- **Issue:** `signInWithRedirect` redirects to Google then returns to sign-in page without completing auth — third-party cookie blocking breaks the redirect result flow
- **Fix:** Always use `signInWithPopup` regardless of device
- **Files modified:** src/components/auth/SignInScreen.tsx
- **Verification:** User confirmed sign-in works on phone
- **Committed in:** 176cf19

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for success criteria. No scope creep.

## Issues Encountered
- Firebase CLI credentials expired mid-session — required `firebase login --reauth`

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App is live and fully functional at taskpad-app.web.app
- Deploy pipeline established for future updates

---
*Phase: 11-hosting-deploy*
*Completed: 2026-03-09*
