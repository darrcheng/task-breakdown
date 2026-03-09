# Phase 9: Authentication - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can sign in with Google, stay signed in across sessions, and sign out -- on all platforms including iOS Safari PWA standalone mode. Auth gates the entire app. Firestore security rules enforce per-user data isolation. No sync, no data migration -- those are Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Sign-in screen
- Minimal centered card: "taskpad" text + Google sign-in button on plain white background
- No tagline or subtitle -- ultra-minimal
- Google-branded sign-in button (official white button with G logo, not custom styled)
- Sign-in errors shown inline below the button (red text, e.g., "Sign-in failed. Please try again.")
- Popup-blocked errors should have a specific helpful message

### User profile & sign-out
- Account section added to existing SettingsModal -- at the top, above existing settings
- Shows user avatar, display name, and email
- Sign-out button in the account section
- Immediate sign-out on click -- no confirmation dialog
- Same layout on both desktop and mobile (SettingsModal already works on both)

### Auth loading state
- Centered "taskpad" text on white background while auth state resolves
- If auth takes >2 seconds, a small spinner fades in below the text
- Instant swap (no animation) when auth resolves to sign-in screen or app

### Auth gate pattern
- AuthProvider React context wrapping `<App />` in main.tsx
- `useAuth()` hook exposes `{ user, loading }` to any component
- App.tsx conditionally renders: loading screen, sign-in screen, or task UI
- Clear IndexedDB data on sign-out (clean slate)

### Platform-specific auth (carried from Phase 8)
- `signInWithPopup` on desktop
- `signInWithRedirect` on mobile/PWA (iOS Safari requirement)
- iOS Safari standalone PWA auth is a hardware gate -- must test on real device

### Firestore security rules
- Update deny-all rules from Phase 8 to allow authenticated per-user access
- Each user can only read/write their own documents

### Claude's Discretion
- Auth provider implementation details (onAuthStateChanged listener setup)
- Firestore security rule structure (collection paths, rule conditions)
- How to detect mobile vs desktop for popup/redirect decision
- Sign-in button loading state while auth is in progress
- Error message wording for specific failure scenarios

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/firebase/config.ts`: Firebase `app` export ready for `getAuth(app)`
- `src/components/ui/SettingsModal.tsx`: Existing settings modal -- add Account section at top
- `src/hooks/useMediaQuery.ts` (`useIsMobile`): Can drive popup vs redirect decision

### Established Patterns
- React context providers (none yet, but standard React pattern fits the codebase)
- Hooks pattern: `useSettings`, `useIsMobile` -- `useAuth` follows same convention
- Modal pattern: SettingsModal uses isOpen/onClose props with overlay
- Tailwind CSS for all styling -- sign-in screen and account section follow same approach

### Integration Points
- `src/main.tsx`: Wrap `<App />` with `<AuthProvider>`
- `src/App.tsx`: Add auth gate at top of component (loading/sign-in/app conditional)
- `src/components/ui/SettingsModal.tsx`: Add Account section at top
- `firestore.rules`: Update deny-all to per-user authenticated rules
- `src/db/database.ts`: Clear IndexedDB on sign-out (Dexie `db.delete()` or `db.tables.forEach(t => t.clear())`)

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 09-authentication*
*Context gathered: 2026-03-07*
