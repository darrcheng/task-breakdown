---
phase: 10
slug: sync-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (to be installed in Wave 0) |
| **Config file** | vitest.config.ts (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | SYNC-03 | unit | `npx vitest run src/db/hooks.test.ts` | No -- Wave 0 | ⬜ pending |
| 10-01-02 | 01 | 0 | SYNC-04, SYNC-05 | unit | `npx vitest run src/firebase/sync.test.ts` | No -- Wave 0 | ⬜ pending |
| 10-01-03 | 01 | 0 | DATA-02 | unit | `npx vitest run src/firebase/sync.test.ts` | No -- Wave 0 | ⬜ pending |
| 10-XX-XX | XX | X | SYNC-01 | manual | Manual: two browser tabs, create/edit/delete task | N/A | ⬜ pending |
| 10-XX-XX | XX | X | SYNC-02 | manual | Manual: DevTools offline toggle, create tasks, reconnect | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` -- install as devDependency: `npm install -D vitest`
- [ ] `vitest.config.ts` -- configure for src/ directory
- [ ] `src/firebase/sync.test.ts` -- covers SYNC-04 (LWW), SYNC-05 (echo guard), DATA-02 (migration) with mocked Firestore
- [ ] `src/db/hooks.test.ts` -- covers SYNC-03 (verify useLiveQuery hooks unchanged)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time cross-device sync | SYNC-01 | Requires real Firestore + two browser tabs | Open desktop + mobile, create task on one, verify appears on other within ~1s |
| Offline-first with reconnect | SYNC-02 | Requires network control (DevTools) | Toggle offline in DevTools, create tasks, go online, verify sync |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
