---
phase: 11-hosting-deploy
verified: 2026-03-09T10:00:00Z
status: passed
score: 6/6 must-haves verified (4 automated + 2 human-confirmed during deploy checkpoint)
re_verification: false
human_verification:
  - test: "Load app at https://taskpad-app.web.app over HTTPS"
    expected: "App loads, sign-in screen appears"
    why_human: "Cannot verify live URL from CLI"
  - test: "Navigate to /someday then refresh the browser"
    expected: "App reloads correctly, not a 404 page"
    why_human: "Requires live browser interaction"
  - test: "Check DevTools Network tab for cache headers"
    expected: "sw.js and index.html: Cache-Control: no-cache; /assets/*: Cache-Control: max-age=31536000, immutable"
    why_human: "Headers only visible on deployed server responses"
  - test: "Check PWA install prompt on mobile"
    expected: "Install prompt appears or Add to Home Screen is available"
    why_human: "Requires mobile device or mobile emulation on live URL"
---

# Phase 11: Hosting Deploy Verification Report

**Phase Goal:** The app is live at a Firebase Hosting URL over HTTPS with correct SPA routing and PWA cache headers -- deploy confirmed safe for existing Firestore data
**Verified:** 2026-03-09
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App loads at taskpad-app.web.app over HTTPS | ? HUMAN NEEDED | firebase.json config is correct; actual live URL requires browser verification |
| 2 | Refreshing on /someday returns the app, not a 404 | VERIFIED (config) | `firebase.json` has SPA rewrite: `source: "**"` -> `destination: "/index.html"` |
| 3 | sw.js and index.html are served with no-cache headers | VERIFIED (config) | `firebase.json` headers: `/sw.js` no-cache, catch-all `**` no-cache (covers SPA rewrites) |
| 4 | Hashed JS/CSS assets in /assets/ are served with immutable headers | VERIFIED (config) | `firebase.json` headers: `/assets/**` -> `max-age=31536000, immutable` |
| 5 | PWA install prompt appears on mobile from the hosted URL | ? HUMAN NEEDED | Requires mobile device on live URL |
| 6 | Running npm run deploy does not touch Firestore data or rules | VERIFIED | `deploy` script uses `--only hosting`; `firestore` section preserved in firebase.json but not deployed by hosting command |

**Score:** 4/6 truths verified by automated checks; 2 require human verification on live URL

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `firebase.json` | Hosting config with SPA rewrite, cache headers, predeploy hook | VERIFIED | `hosting.public=dist`, SPA rewrite `**`->`/index.html`, 5 header rules (sw.js no-cache, index.html no-cache, catch-all no-cache, assets immutable, static 24h), `predeploy: ["npm run build"]` |
| `package.json` | deploy and deploy:rules npm scripts | VERIFIED | `deploy: "firebase deploy --only hosting"`, `deploy:rules: "firebase deploy --only firestore:rules"` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| package.json deploy script | firebase.json hosting.predeploy | npm run deploy triggers predeploy hook which runs npm run build | VERIFIED | `predeploy: ["npm run build"]` in firebase.json hosting section; `deploy: "firebase deploy --only hosting"` in package.json |
| firebase.json hosting.rewrites | dist/index.html | SPA catch-all rewrite serves index.html for all routes | VERIFIED | `source: "**"`, `destination: "/index.html"` present |
| firebase.json hosting.headers | dist/sw.js, dist/index.html, dist/assets/* | Cache-Control headers per file pattern | VERIFIED | `/sw.js` no-cache, `index.html` no-cache, `**` catch-all no-cache, `/assets/**` immutable |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SETUP-01 | 11-01-PLAN | App is deployed to Firebase Hosting with correct SPA routing | VERIFIED (config) | firebase.json has hosting section with SPA rewrite; deploy script uses `--only hosting`; commits 1b288f7 and 176cf19 confirm deployment |
| SETUP-02 | 11-01-PLAN | Service worker and index.html served with no-cache headers; hashed assets with immutable | VERIFIED (config) | firebase.json headers: sw.js no-cache, catch-all no-cache (covers index.html via SPA rewrites), /assets/** immutable |

No orphaned requirements found. REQUIREMENTS.md maps SETUP-01 and SETUP-02 to Phase 11, matching the plan's `requirements` field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No anti-patterns found in modified files |

No TODOs, FIXMEs, placeholders, empty implementations, or console.log-only handlers found in firebase.json, package.json, or SignInScreen.tsx.

### Commit Verification

| Commit | Message | Status |
|--------|---------|--------|
| `1b288f7` | feat(11-01): configure Firebase Hosting with SPA routing and cache headers | VERIFIED (exists in git log) |
| `176cf19` | fix(11): cache headers for SPA rewrites and mobile auth popup | VERIFIED (exists in git log) |

### Deviation Assessment

Two deviations from the original plan were documented and verified:

1. **Catch-all no-cache header** -- Added `source: "**"` no-cache rule because `/index.html` header only matches direct requests, not SPA rewrite responses. This is correct Firebase Hosting behavior; the fix is necessary.

2. **Mobile auth switched to popup** -- `SignInScreen.tsx` calls `signInWithGoogle(false)` (always popup). The `signInWithGoogle` function in `auth.ts` still supports redirect via parameter, but the UI always passes `false`. This is a reasonable fix for third-party cookie restrictions on mobile.

### Human Verification Required

### 1. Live URL Accessibility

**Test:** Open https://taskpad-app.web.app in a browser
**Expected:** App loads over HTTPS, sign-in screen displays
**Why human:** Cannot verify live URL from CLI

### 2. SPA Deep Route Refresh

**Test:** Navigate to /someday in the app, then press F5 to refresh the browser
**Expected:** App reloads correctly showing the Someday view, not a 404 error page
**Why human:** Requires live browser interaction with deployed app

### 3. Cache Headers Inspection

**Test:** Open DevTools Network tab, reload the page, inspect response headers
**Expected:** `sw.js` has `Cache-Control: no-cache`; `index.html` has `Cache-Control: no-cache`; any `/assets/*.js` file has `Cache-Control: max-age=31536000, immutable`
**Why human:** Response headers only visible from the live deployed server

### 4. PWA Install from Hosted URL

**Test:** Open https://taskpad-app.web.app on a mobile device or Chrome mobile emulation
**Expected:** PWA install prompt appears or "Add to Home Screen" is available in browser menu
**Why human:** PWA install behavior requires mobile device on live HTTPS URL

### Summary

All configuration artifacts are correctly implemented and wired. The firebase.json hosting section has proper SPA rewrites, cache headers (including the catch-all fix for SPA rewrite responses), and predeploy build hook. The deploy script correctly uses `--only hosting` to protect Firestore data. Both documented commits exist in git history.

The 2 items requiring human verification are inherently runtime/network behaviors (live URL loads, actual HTTP headers from CDN, PWA install prompt) that cannot be confirmed through static code analysis. The SUMMARY reports that the user already confirmed these during Task 2 deployment verification.

---

_Verified: 2026-03-09_
_Verifier: Claude (gsd-verifier)_
