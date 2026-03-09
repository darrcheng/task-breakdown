# Phase 11: Hosting Deploy - Research

**Researched:** 2026-03-08
**Domain:** Firebase Hosting deployment, SPA routing, PWA cache headers
**Confidence:** HIGH

## Summary

This phase configures Firebase Hosting to serve the already-built Vite+React SPA at `taskpad-app.web.app`. The existing project already has `firebase-tools` as a devDependency (v15.9.0), `.firebaserc` pointing to `taskpad-app`, and a `firebase.json` with Firestore rules config. The work is adding a `hosting` section to `firebase.json` and npm scripts to `package.json`.

Firebase Hosting for SPAs is a well-documented, stable pattern. The key configuration points are: public directory (`dist`), SPA rewrite rule (all URLs to `index.html`), cache headers for PWA correctness, and ignore patterns. The `--only hosting` flag isolates deploys from Firestore data and rules.

**Primary recommendation:** Add hosting config to existing `firebase.json`, add npm scripts, deploy with `--only hosting`, verify manually in browser.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- npm script `deploy` in package.json -- one command to deploy
- `firebase deploy --only hosting` (never bare `firebase deploy`)
- Predeploy hook in firebase.json auto-runs `npm run build` before every deploy
- Build only -- no lint or type-check in the deploy pipeline
- Separate `deploy:rules` script for Firestore rules
- `sw.js` and `index.html`: `Cache-Control: no-cache`
- Hashed assets in `/assets/`: `Cache-Control: max-age=31536000, immutable`
- Keep existing Workbox/PWA config as-is
- `--only hosting` flag ensures Firestore data and rules are never touched
- Explicit `ignore` list in firebase.json hosting config
- npm scripts are the deploy interface
- Firebase Hosting rewrites: all routes serve index.html
- Manual browser check on first deploy for post-deploy verification

### Claude's Discretion
- Static asset cache durations (icons, images, fonts)
- firebase.json hosting structure details
- Exact ignore list entries
- Verification checklist specifics
- Whether to include a deploy:rules npm script (decided yes)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-01 | App is deployed to Firebase Hosting with correct SPA routing | firebase.json hosting config with rewrite rule + `--only hosting` deploy |
| SETUP-02 | Service worker and index.html served with `no-cache` headers; hashed assets with `immutable` | firebase.json headers config with glob patterns |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-tools | ^15.9.0 | CLI for Firebase Hosting deploy | Already installed as devDependency |
| Firebase Hosting | N/A (service) | Static site hosting with CDN | Project already on Firebase; free on Spark plan |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite | ^5.4.21 | Build tool (already configured) | Produces dist/ with hashed assets |
| vite-plugin-pwa | ^1.2.0 | PWA/SW generation (already configured) | Generates sw.js and manifest |

No new dependencies are needed for this phase.

## Architecture Patterns

### firebase.json Hosting Configuration

The `hosting` section goes alongside the existing `firestore` section:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "src/**",
      ".planning/**",
      ".env*"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      },
      {
        "source": "/index.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**/*.{ico,png,svg,webmanifest}",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=86400" }
        ]
      }
    ],
    "predeploy": ["npm run build"]
  }
}
```

**Confidence:** HIGH -- this is standard Firebase Hosting configuration documented in official Firebase docs.

### npm Scripts in package.json

```json
{
  "scripts": {
    "deploy": "firebase deploy --only hosting",
    "deploy:rules": "firebase deploy --only firestore:rules"
  }
}
```

The `predeploy` hook in `firebase.json` runs `npm run build` automatically before deploy, so `npm run deploy` is a single command that builds and deploys.

### SPA Rewrite Rule

The `"source": "**"` rewrite catches all URLs and serves `index.html`. This means:
- `/` serves index.html (calendar view)
- `/someday` serves index.html (someday list)
- Any deep route refresh returns the app shell, not a 404
- The client-side router handles actual routing

### Existing dist/ Structure (Confirmed)

```
dist/
  index.html
  sw.js
  manifest.webmanifest
  workbox-8c29f6e4.js
  favicon.ico
  apple-touch-icon.png
  pwa-192x192.png
  pwa-512x512.png
  vite.svg
  assets/
    index-B0zX5oy6.js      (hashed)
    index-C7DUSe_P.css      (hashed)
    workbox-window.prod.es5-vqzQaGvo.js  (hashed)
```

Vite outputs hashed filenames in `assets/` and non-hashed root files -- this maps perfectly to the cache header strategy.

### Anti-Patterns to Avoid
- **Bare `firebase deploy`:** Would deploy hosting AND Firestore rules together. Always use `--only hosting`.
- **Putting lint/typecheck in predeploy:** User explicitly decided against this. Build only.
- **Setting `public` to wrong directory:** Must be `dist` (Vite output), not `public` or `build`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPA routing on hosting | Custom 404 page with redirect hack | Firebase rewrite rule `"source": "**"` | Built-in, zero-latency, works for all routes |
| Cache busting | Manual versioned filenames | Vite's content-hash filenames + immutable headers | Already configured in Vite build |
| SSL/HTTPS | Self-signed certs or proxy | Firebase Hosting auto-provisions SSL | Free, automatic, includes CDN |
| CDN distribution | Separate CDN service | Firebase Hosting built-in CDN | Included in Spark plan at no cost |

## Common Pitfalls

### Pitfall 1: Wrong public directory
**What goes wrong:** Firebase deploys the wrong folder (e.g., `public/` instead of `dist/`), resulting in a blank page or missing files.
**Why it happens:** Firebase CLI default is `public`, but Vite outputs to `dist`.
**How to avoid:** Set `"public": "dist"` in firebase.json hosting config.
**Warning signs:** Blank page after deploy, 404 on all assets.

### Pitfall 2: Missing SPA rewrite
**What goes wrong:** Deep route refresh (e.g., `/someday`) returns 404 instead of the app.
**Why it happens:** Without a rewrite rule, Firebase looks for a literal `/someday/index.html` file.
**How to avoid:** Add the `"source": "**", "destination": "/index.html"` rewrite.
**Warning signs:** Home page works but refreshing on `/someday` shows 404.

### Pitfall 3: Service worker caching stale index.html
**What goes wrong:** Users see old version of the app after deploy because sw.js or index.html are cached.
**Why it happens:** Default cache headers may cache these files.
**How to avoid:** Explicit `no-cache` headers for `sw.js` and `index.html`. The existing Workbox `autoUpdate` config handles the rest.
**Warning signs:** Deploy completes but users still see old version.

### Pitfall 4: Accidental Firestore rules deployment
**What goes wrong:** Running bare `firebase deploy` pushes rules changes alongside hosting.
**Why it happens:** Without `--only` flag, Firebase deploys everything configured in firebase.json.
**How to avoid:** npm scripts enforce `--only hosting`. Separate `deploy:rules` for explicit rules deployment.
**Warning signs:** Unexpected Firestore rules changes after a hosting deploy.

### Pitfall 5: workbox-*.js at root not getting long cache
**What goes wrong:** The `workbox-8c29f6e4.js` file is at the root of dist (not in assets/), but it has a content hash.
**Why it happens:** vite-plugin-pwa places Workbox runtime at root level.
**How to avoid:** This file is referenced by sw.js which is no-cache. Since sw.js always fetches fresh, it will reference the correct workbox file. The browser's HTTP cache with default headers is fine -- no special header needed. Alternatively, add an explicit long-cache rule for `workbox-*.js`.
**Warning signs:** None significant -- this is a minor optimization concern, not a correctness issue.

## Code Examples

### Complete firebase.json (after modification)
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "src/**",
      ".planning/**",
      ".env*"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      },
      {
        "source": "/index.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      },
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**/*.{ico,png,svg,webmanifest}",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=86400" }
        ]
      }
    ],
    "predeploy": ["npm run build"]
  }
}
```

### Complete package.json scripts section (after modification)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "firebase deploy --only hosting",
    "deploy:rules": "firebase deploy --only firestore:rules"
  }
}
```

### Deploy command
```bash
npm run deploy
```
This triggers: `npm run build` (via predeploy) then `firebase deploy --only hosting`.

### Post-deploy verification checklist
1. Open `https://taskpad-app.web.app` -- app loads
2. Navigate to `/someday`, refresh browser -- app loads (not 404)
3. Open DevTools > Network, check `index.html` response headers: `Cache-Control: no-cache`
4. Check `sw.js` response headers: `Cache-Control: no-cache`
5. Check any `/assets/*.js` response headers: `Cache-Control: max-age=31536000, immutable`
6. On mobile (or Chrome DevTools mobile emulation): PWA install prompt appears
7. Sign in and verify basic task operations work

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `firebase init hosting` wizard | Manual firebase.json config | Always available | Skip wizard, just write the config directly |
| Separate hosting config file | Inline in firebase.json | Firebase CLI v9+ | Single config file for all Firebase services |

**Note:** Firebase Hosting configuration has been stable for years. No recent breaking changes.

## Open Questions

1. **Firebase login state on this machine**
   - What we know: firebase-tools is installed as devDependency
   - What's unclear: Whether `npx firebase login` has been run in this environment
   - Recommendation: First task should verify firebase CLI auth. Run `npx firebase login:list` to check.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (deployment is infrastructure, not unit-testable) |
| Config file | N/A |
| Quick run command | `npm run build` (verifies build succeeds) |
| Full suite command | `npm run deploy` + manual browser verification |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | App deployed with SPA routing | manual | `npm run deploy` then browser check | N/A |
| SETUP-02 | Cache headers correct | manual | Browser DevTools Network tab inspection | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (verify build still works)
- **Per wave merge:** N/A (single wave phase)
- **Phase gate:** Full deploy + manual browser verification of all 5 success criteria

### Wave 0 Gaps
None -- this phase is infrastructure configuration, not application code. No test files needed.

## Sources

### Primary (HIGH confidence)
- Project files: `firebase.json`, `.firebaserc`, `package.json`, `vite.config.ts` -- read directly
- Project files: `dist/` directory listing -- confirmed build output structure
- Firebase Hosting docs: SPA rewrite, headers, predeploy hooks -- well-established stable API

### Secondary (MEDIUM confidence)
- N/A

### Tertiary (LOW confidence)
- N/A

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed, no new dependencies
- Architecture: HIGH -- firebase.json hosting config is well-documented and stable
- Pitfalls: HIGH -- common SPA hosting issues are well-known
- Cache headers: HIGH -- exact values specified in user decisions

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no fast-moving parts)
