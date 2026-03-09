---
phase: 8
slug: firebase-project-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) or manual verification |
| **Config file** | none — Phase 8 is infrastructure setup |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | SETUP-03 | manual | Firebase console check | N/A | ⬜ pending |
| 08-02-01 | 02 | 1 | SETUP-03 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 1 | SETUP-03 | manual | `firebase deploy --only firestore:rules` | ❌ W0 | ⬜ pending |
| 08-04-01 | 04 | 1 | SETUP-03 | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework needed — Phase 8 is infrastructure setup
- [ ] Verification is via `npm run build` (TypeScript compilation) and Firebase console checks

*Existing infrastructure covers all phase requirements via build verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Firebase project on Spark plan | SETUP-03 | Requires Firebase console access | Check billing page shows "Spark" plan |
| Firestore rules reject unauth | SETUP-03 | Requires Firebase console or curl | Attempt read via REST API without auth token |
| App starts without Firebase errors | SETUP-03 | Requires browser dev tools | Run `npm run dev`, check console for errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
