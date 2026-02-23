---
status: resolved
trigger: "After completing ProviderSetupModal, clicking 'start breaking down tasks' loops back to provider selection instead of closing modal and proceeding"
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
---

## Current Focus

hypothesis: Stale closure — two separate useAIProvider instances never sync state
test: Traced full call chain from ProviderSetupModal.handleComplete through useBreakdown.onProviderConfigured to startBreakdown
expecting: isConfigured remains false in useBreakdown's useAIProvider instance after modal saves config
next_action: Document root cause (confirmed)

## Symptoms

expected: After completing the 3-step provider setup (choose provider, enter API key, connection confirmed), clicking "Start Breaking Down Tasks" should close the modal and begin AI task breakdown.
actual: Clicking "Start Breaking Down Tasks" loops back to step 1 (provider selection). After a page refresh, the provider is correctly saved and everything works.
errors: No error messages — just visual loop back to step 1
reproduction: Open TaskModal on a saved task, click breakdown button with no provider configured, complete 3-step setup, click "Start Breaking Down Tasks"
started: Since ProviderSetupModal was introduced (feature always broken on first use)

## Eliminated

(None — first hypothesis was correct)

## Evidence

- timestamp: 2026-02-22T00:01:00Z
  checked: ProviderSetupModal.tsx — handleComplete (lines 43-49)
  found: handleComplete resets step to 'choose', clears local state, then calls onConfigured() followed by onClose(). The step reset to 'choose' happens BEFORE onConfigured/onClose, but this is local state that gets cleaned up. The real issue is downstream.
  implication: The modal correctly calls onConfigured callback before closing.

- timestamp: 2026-02-22T00:02:00Z
  checked: TaskModal.tsx — ProviderSetupModal usage (lines 225-231)
  found: ProviderSetupModal receives onConfigured={breakdown.onProviderConfigured} and onClose={breakdown.cancelBreakdown}. The modal is shown when breakdown.state.status === 'configuring'.
  implication: The wiring between TaskModal and ProviderSetupModal looks correct at the surface.

- timestamp: 2026-02-22T00:03:00Z
  checked: useBreakdown.ts — onProviderConfigured (lines 90-99)
  found: onProviderConfigured sets state to 'idle', then calls setTimeout(() => startBreakdown(task), 100). The 100ms delay was intended to let isConfigured update. BUT startBreakdown is a dependency of onProviderConfigured via useCallback.
  implication: The setTimeout delay is insufficient because isConfigured never updates in this hook instance.

- timestamp: 2026-02-22T00:04:00Z
  checked: useBreakdown.ts — startBreakdown (lines 35-88)
  found: startBreakdown checks isConfigured (line 37). If false, it sets status to 'configuring' again — this is the LOOP. isConfigured comes from useAIProvider() called on line 26 of useBreakdown.
  implication: When startBreakdown re-fires after 100ms, isConfigured is still false, so it re-enters 'configuring' status, which re-shows the ProviderSetupModal.

- timestamp: 2026-02-22T00:05:00Z
  checked: useAIProvider.ts — state loading (lines 25-38)
  found: The useEffect that reads from localStorage has an empty dependency array []. It only runs ONCE on mount. There is no mechanism to re-read from storage when another component writes to it.
  implication: The useAIProvider instance inside useBreakdown will never see the configuration saved by the ProviderSetupModal's separate useAIProvider instance.

- timestamp: 2026-02-22T00:06:00Z
  checked: useAIProvider.ts — configureProvider (lines 42-82)
  found: configureProvider correctly updates both localStorage AND the hook's own React state (line 64-69). But this state update only affects the hook INSTANCE that called configureProvider — i.e., the ProviderSetupModal's instance.
  implication: Two separate useAIProvider() calls = two separate React state objects. Writing to localStorage is shared, but the React state is not.

- timestamp: 2026-02-22T00:07:00Z
  checked: Cross-instance communication
  found: No StorageEvent listener, no shared context, no global state, no event bus between useAIProvider instances.
  implication: There is zero mechanism for the useBreakdown's useAIProvider to learn that configuration happened in the ProviderSetupModal's useAIProvider.

## Resolution

root_cause: |
  **Dual-instance state desync between two useAIProvider hooks.**

  The bug is caused by two independent instances of `useAIProvider()` that do not share React state:

  1. **Instance A**: Called inside `useBreakdown()` (line 26 of useBreakdown.ts). This instance's `isConfigured` is used by `startBreakdown` to decide whether to show the setup modal or proceed with generation.

  2. **Instance B**: Called inside `ProviderSetupModal` (line 20 of ProviderSetupModal.tsx). This instance's `configureProvider` is used to save the API key and test the connection.

  When Instance B calls `configureProvider`, it:
  - Saves to localStorage (shared, persistent)
  - Updates its own React state (Instance B only)
  - Does NOT update Instance A's React state

  When `onProviderConfigured` fires after the modal completes:
  - It calls `startBreakdown(task)` after a 100ms delay
  - `startBreakdown` reads `isConfigured` from Instance A
  - Instance A never re-read from localStorage (the useEffect has `[]` deps, runs only on mount)
  - `isConfigured` is still `false` in Instance A
  - So `startBreakdown` sets status back to `'configuring'`
  - The ProviderSetupModal re-appears at step 1

  **Additionally**, there is a secondary stale closure issue: `onProviderConfigured` has `[startBreakdown]` in its dependency array, and `startBreakdown` has `[isConfigured, getProvider]`. Even if `isConfigured` somehow updated, the `startBreakdown` captured by `onProviderConfigured` may still close over the OLD `isConfigured` value because `onProviderConfigured` was created when `startBreakdown` still had `isConfigured = false`.

  **Why it works after refresh**: On page reload, `useAIProvider`'s mount effect re-reads from localStorage, finds the saved provider and key, and correctly sets `isConfigured = true`.

fix: |
  **Recommended fix direction (multiple viable approaches):**

  **Option A (simplest): Remove useAIProvider from ProviderSetupModal, pass configureProvider down as a prop.**
  Have the ProviderSetupModal receive `configureProvider` from the parent's useAIProvider (via useBreakdown), so there is only ONE instance of useAIProvider in the chain. When configureProvider succeeds, Instance A's state updates directly.

  **Option B: Lift useAIProvider into a React Context.**
  Create an AIProviderContext so all components share one instance. This is the most architecturally clean approach and prevents the dual-instance problem globally.

  **Option C (quick fix): Skip the isConfigured check in the re-trigger path.**
  In `onProviderConfigured`, instead of calling `startBreakdown` (which re-checks `isConfigured`), directly call `getProvider()` and proceed to generation. This bypasses the stale `isConfigured` gate. However, `getProvider` reads from Instance A's `state.provider` which is also stale — so this would also need `getProvider` to re-read from localStorage.

  **Option D (quick fix): Add a localStorage re-read trigger to useAIProvider.**
  Add a `refresh()` method to useAIProvider that re-reads from localStorage on demand. Call it from `onProviderConfigured` before re-triggering `startBreakdown`.

verification: Not yet verified (diagnosis only)
files_changed: []
