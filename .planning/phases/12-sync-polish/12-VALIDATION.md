---
phase: 12
slug: sync-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/firebase/sync.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/firebase/sync.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | DATA-03 | unit | `npx vitest run src/firebase/sync.test.ts -t "sync status"` | Extend existing | ⬜ pending |
| 12-01-02 | 01 | 1 | DATA-04 | unit | `npx vitest run src/firebase/sync.test.ts -t "retry"` | Extend existing | ⬜ pending |
| 12-01-03 | 01 | 1 | DATA-03 | unit | `npx vitest run src/hooks/useSyncStatus.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | DATA-03 | manual | Visual: icon renders in header | N/A | ⬜ pending |
| 12-02-02 | 02 | 1 | DATA-04 | manual | Visual: error popover appears | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `src/firebase/sync.test.ts` — add tests for sync status state machine, retry logic, online/offline transitions
- [ ] Create `src/hooks/useSyncStatus.test.ts` — test hook subscription with mock useSyncExternalStore

*Existing `sync.test.ts` covers serialization and inbound change processing. Phase 12 extends it with status tracking tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloud icon renders correctly in header (desktop + mobile) | DATA-03 | Component rendering requires browser | Verify icon is visible in header on both desktop and mobile viewports |
| Popover opens on click/tap with correct message | DATA-03, DATA-04 | UI interaction test | Click sync icon, verify popover shows correct status message |
| Offline → syncing → synced transition | DATA-03 | Requires real network toggling | Toggle airplane mode, verify icon transitions |
| Error popover retry clears error | DATA-04 | Requires Firestore error simulation | Block Firestore, trigger write, verify error → retry → synced flow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
