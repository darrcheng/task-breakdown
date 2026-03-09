---
phase: 11
slug: hosting-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (deployment is infrastructure, not unit-testable) |
| **Config file** | N/A |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run deploy` + manual browser verification |
| **Estimated runtime** | ~30 seconds (build) + deploy time |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (verify build succeeds)
- **After every plan wave:** N/A (single wave phase)
- **Before `/gsd:verify-work`:** Full deploy + manual browser verification of all 5 success criteria
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SETUP-01 | manual | `npm run build` | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | SETUP-01 | manual | `npm run build` | N/A | ⬜ pending |
| 11-01-03 | 01 | 1 | SETUP-02 | manual | `npm run build` | N/A | ⬜ pending |
| 11-01-04 | 01 | 1 | SETUP-01, SETUP-02 | manual | `npm run deploy` + browser check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase is infrastructure configuration, not application code — no test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App accessible at [project-id].web.app over HTTPS | SETUP-01 | Requires live deployment | Deploy, open URL in browser, verify HTTPS |
| Deep route refresh returns app | SETUP-01 | Requires live deployment | Navigate to /someday, refresh, verify app loads |
| sw.js and index.html served with no-cache | SETUP-02 | Requires DevTools inspection | Open DevTools Network tab, check Cache-Control headers |
| Hashed assets served with immutable | SETUP-02 | Requires DevTools inspection | Check assets/ files Cache-Control in DevTools |
| PWA install prompt on mobile | SETUP-01 | Requires mobile device/emulation | Open on mobile, verify install prompt |
| Deploy does not touch Firestore data | SETUP-01 | Requires data verification | Check Firestore data before/after deploy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
