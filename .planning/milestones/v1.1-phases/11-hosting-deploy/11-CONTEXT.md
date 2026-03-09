# Phase 11: Hosting Deploy - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the app to Firebase Hosting at taskpad-app.web.app over HTTPS. Configure SPA routing so deep route refreshes return the app (not 404). Set PWA-correct cache headers: no-cache for sw.js and index.html, immutable for hashed JS/CSS assets. Deploy confirmed safe for existing Firestore data — hosting deploys never touch data or rules.

</domain>

<decisions>
## Implementation Decisions

### Deploy workflow
- npm script `deploy` in package.json — one command to deploy
- `firebase deploy --only hosting` (never bare `firebase deploy`)
- Predeploy hook in firebase.json auto-runs `npm run build` before every deploy
- Build only — no lint or type-check in the deploy pipeline (user runs those manually)
- Separate `deploy:rules` script for Firestore rules (rarely needed, explicit when you do)

### Cache headers
- Configure in firebase.json `hosting.headers` section
- `sw.js` and `index.html`: `Cache-Control: no-cache` (always fresh)
- Hashed assets in `/assets/` (Vite output): `Cache-Control: max-age=31536000, immutable`
- Keep existing Workbox/PWA config as-is — autoUpdate + existing globPatterns unchanged

### Pre-deploy safety
- `--only hosting` flag ensures Firestore data and rules are never touched by hosting deploys
- Explicit `ignore` list in firebase.json hosting config (node_modules, .env*, src/, .planning/, etc.)
- npm scripts are the deploy interface — protects against accidental bare `firebase deploy`
- Firestore data lives independently from hosting — deploys only replace static files
- Rules in repo match what's deployed — even accidental full deploy is harmless

### SPA routing
- Firebase Hosting rewrites: all routes serve index.html (standard SPA config)
- App has two routes: `/` (calendar) and `/someday` (someday list)
- Refreshing on any route must return the app shell, not 404

### Post-deploy verification
- Manual browser check on first deploy (Claude's discretion on exact steps)
- Verify: app loads at taskpad-app.web.app, deep route refresh works, cache headers correct in DevTools, sign in and basic functionality works

### Claude's Discretion
- Static asset cache durations (icons, images, fonts)
- firebase.json hosting structure details
- Exact ignore list entries
- Verification checklist specifics
- Whether to include a deploy:rules npm script (user said "you decide" — decided yes for safety)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts`: PWA manifest already configured with correct app name, icons, Workbox settings
- `firebase.json`: Exists with Firestore rules section — needs hosting section added
- `.firebaserc`: Already configured with project `taskpad-app`
- `firebase-tools`: Already installed as devDependency (Phase 8)

### Established Patterns
- Vite build outputs to `dist/` with hashed filenames for JS/CSS assets
- Workbox `autoUpdate` with `globPatterns` for precaching
- Environment vars use `VITE_` prefix — all are public client keys, not secrets
- `firebase-tools` as devDependency for version-locked reproducible deploys

### Integration Points
- `firebase.json`: Add `hosting` section alongside existing `firestore` section
- `package.json`: Add `deploy` and `deploy:rules` npm scripts
- `dist/`: Vite build output directory — Firebase Hosting serves from here

</code_context>

<specifics>
## Specific Ideas

- User wants npm scripts as the primary deploy interface — never type raw firebase commands
- Hosting-only as the safe default; rules deployment is always an explicit separate action
- User values understanding what each step does — verification should be educational not just mechanical

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-hosting-deploy*
*Context gathered: 2026-03-08*
