# Phase 4: Cross-Platform Expansion - Research

**Researched:** 2026-02-26
**Domain:** PWA, Responsive Mobile Layout, Touch Interactions
**Confidence:** HIGH

## Summary

Phase 4 transforms the existing React/Vite/Dexie desktop-first app into a PWA that works equally well on mobile devices. The approach is straightforward: add vite-plugin-pwa for service worker and manifest generation, build responsive layouts with Tailwind CSS breakpoints, implement touch gestures with react-swipeable, and add haptic feedback via the Vibration API.

The existing stack (React 19 + Vite 5 + Tailwind 4 + Dexie.js) is already well-suited for PWA conversion. Dexie provides offline-first data storage by default (IndexedDB), so the main work is caching app shell assets via service worker, making the UI responsive, and adding mobile-specific interaction patterns.

**Primary recommendation:** Use vite-plugin-pwa with generateSW strategy for zero-config service worker, build all responsive layouts with Tailwind's mobile-first breakpoints (no new CSS framework), use react-swipeable for swipe gestures, and hand-build the bottom sheet/tab bar with Tailwind to avoid heavy dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- PWA only — no Capacitor wrapper in this phase
- App manifest for "Add to Home Screen" with subtle, dismissable install prompt (shown after a few visits)
- Service worker for offline caching — app loads and works offline with cached data
- AI breakdown gracefully shows "no connection" when offline (cache-only strategy, no request queueing)
- Standalone display mode (no browser chrome when launched from home screen)
- Simple load — no branded splash screen
- Testing via local network (Vite dev server network URL on same WiFi)
- Calendar view: day-focused scroll on mobile — show one day at a time, swipe left/right between days
- Horizontal date strip at top for quick date navigation (like iOS Calendar — row of date circles, tap to jump, swipe strip for more dates)
- Bottom tab bar for view switching (Calendar, List, Settings) — fixed, always accessible
- Task create/edit forms appear as bottom sheets (slide up from bottom, draggable to expand)
- Long-press to drag for rescheduling tasks (pick up task, drag to date strip or adjacent day)
- Swipe-to-reveal action buttons on task rows (swipe left for Delete/Done, like iOS Mail)
- Light haptic feedback on task completion (Vibration API)

### Claude's Discretion
- AI breakdown button placement on mobile (inline vs FAB vs other)
- App icon design and theme color (match existing UI)
- Exact breakpoint for mobile vs desktop layout
- Service worker caching strategy details
- Bottom sheet drag/snap behavior specifics

### Deferred Ideas (OUT OF SCOPE)
- Firebase Deploy + Sync (Phase 5)
- Capacitor wrapper for native app stores
- On-device AI (WebLLM/WebGPU)
- Push notifications
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAT-01 | App works on web browsers | vite-plugin-pwa generates manifest + service worker; app already runs in browser via Vite; PWA adds installability and offline caching |
| PLAT-02 | App works on mobile (iOS and Android) | Responsive Tailwind layout with mobile breakpoints; bottom tab bar; day-focused calendar with swipe navigation; bottom sheets for forms; touch interactions (swipe-to-reveal, long-press drag, haptic feedback) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^0.21 | PWA manifest + service worker generation | Zero-config PWA for Vite; uses Workbox internally; generateSW auto-precaches all static assets |
| react-swipeable | ^7.0 | Touch swipe gesture detection | Lightweight hook-based swipe handler; no heavy animation deps; works with React 19 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.2 (existing) | Responsive layout breakpoints | Mobile-first responsive design — already in project |
| @dnd-kit/core | ^6.3 (existing) | Drag-and-drop for task rescheduling | Long-press + drag on mobile — touch sensor already supports this |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-swipeable | raw touch events | react-swipeable handles edge cases (scroll vs swipe, velocity thresholds); raw events need manual delta tracking |
| Hand-built bottom sheet | react-modal-sheet | react-modal-sheet requires motion (framer-motion) as peer dep — adds ~30KB; Tailwind + CSS transitions are sufficient for simple bottom sheet |
| Hand-built tab bar | @mui/material BottomNavigation | MUI adds massive bundle; Tailwind flexbox is trivial for 3-tab bar |

**Installation:**
```bash
npm install vite-plugin-pwa react-swipeable
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── mobile/           # Mobile-specific components
│   │   ├── MobileLayout.tsx      # Responsive wrapper with bottom tabs
│   │   ├── BottomTabBar.tsx      # Fixed bottom navigation (Calendar/List/Settings)
│   │   ├── BottomSheet.tsx       # Draggable sheet for task create/edit
│   │   ├── DaySwipeView.tsx      # Single-day view with swipe between days
│   │   ├── DateStrip.tsx         # Horizontal scrolling date navigation
│   │   └── SwipeableTaskRow.tsx  # Swipe-to-reveal actions (delete/done)
│   ├── calendar/         # Existing (desktop calendar grid)
│   ├── list/             # Existing (desktop list view)
│   └── task/             # Existing (task forms, modals)
├── hooks/
│   ├── useMediaQuery.ts          # Responsive breakpoint detection
│   ├── useInstallPrompt.ts       # PWA install prompt handler
│   └── useLongPress.ts           # Long-press gesture detection
├── pwa/
│   └── register.ts               # Service worker registration
└── ...
```

### Pattern 1: Responsive Layout Switching
**What:** Use a custom `useMediaQuery` hook to detect mobile vs desktop and render different layout shells
**When to use:** Top-level App component decides between desktop (sidebar/header + grid) and mobile (bottom tabs + day view)
**Example:**
```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const isMobile = useMediaQuery('(max-width: 768px)');
```

### Pattern 2: Bottom Sheet with CSS Transforms
**What:** Pure Tailwind + CSS transform-based bottom sheet without animation library
**When to use:** Task create/edit on mobile
**Example:**
```typescript
// translate-y-full = off-screen, translate-y-0 = visible
// touch-action: none on drag handle to prevent scroll interference
<div className={clsx(
  'fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl',
  'transform transition-transform duration-300 ease-out',
  isOpen ? 'translate-y-0' : 'translate-y-full'
)}>
  <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3"
       style={{ touchAction: 'none' }}
       {...dragHandlers} />
  {children}
</div>
```

### Pattern 3: Swipe-to-Reveal Actions
**What:** Use react-swipeable on task rows to reveal action buttons (Delete/Done)
**When to use:** Task list items on mobile
**Example:**
```typescript
const handlers = useSwipeable({
  onSwipedLeft: () => setRevealed(true),
  onSwipedRight: () => setRevealed(false),
  delta: 30,
  trackTouch: true,
  trackMouse: false,
});
// Shift row content left to reveal action buttons behind
```

### Pattern 4: PWA Install Prompt
**What:** Capture `beforeinstallprompt` event, show custom install UI after N visits
**When to use:** Subtle prompt after user has visited 3+ times
**Example:**
```typescript
function useInstallPrompt(minVisits = 3) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    const visits = parseInt(localStorage.getItem('pwa-visits') || '0') + 1;
    localStorage.setItem('pwa-visits', String(visits));
    setCanShow(visits >= minVisits);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [minVisits]);

  return { prompt, canShow, dismiss: () => setPrompt(null) };
}
```

### Anti-Patterns to Avoid
- **Don't hide desktop features on mobile:** All functionality must be accessible on both — just different layout/interaction
- **Don't use CSS media queries for JS logic:** Use `useMediaQuery` hook, not CSS-only hiding, when behavior changes (not just layout)
- **Don't block on service worker:** App must work immediately; SW registers in background
- **Don't queue offline AI requests:** Show "no connection" immediately per user decision

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker + manifest | Custom SW registration | vite-plugin-pwa | Workbox handles precaching, versioning, update flow; manual SW is fragile |
| Swipe gesture detection | Raw touchstart/touchmove/touchend | react-swipeable | Handles velocity, delta thresholds, scroll vs swipe conflicts |
| Responsive breakpoints | Custom resize listeners | Tailwind breakpoints + useMediaQuery | Tailwind's mobile-first system is battle-tested |
| Touch drag-and-drop | Custom touch drag handler | @dnd-kit TouchSensor | Already in project; has built-in delay/tolerance for long-press activation |

**Key insight:** PWA infrastructure (manifest + service worker) should be generated, not hand-written. The app logic is where effort should go — responsive layouts and touch interactions.

## Common Pitfalls

### Pitfall 1: iOS PWA Limitations
**What goes wrong:** iOS Safari has limited PWA support — no `beforeinstallprompt` event, no background sync, limited service worker lifecycle
**Why it happens:** Apple restricts PWA capabilities on iOS
**How to avoid:** Don't rely on `beforeinstallprompt` for iOS — show a manual "Add to Home Screen" instruction banner instead; test on actual iOS device
**Warning signs:** Install prompt never appears on iOS Safari

### Pitfall 2: Scroll vs Swipe Conflict
**What goes wrong:** Horizontal swipe gestures conflict with vertical page scrolling on mobile
**Why it happens:** Browser interprets touch movement as scroll by default
**How to avoid:** Use react-swipeable's `delta` threshold (30px+); only capture horizontal swipes; don't prevent vertical scroll; use `touch-action: pan-y` on swipeable containers
**Warning signs:** Page scrolls when trying to swipe, or page doesn't scroll when trying to scroll

### Pitfall 3: Bottom Sheet + Keyboard Overlap
**What goes wrong:** Virtual keyboard pushes bottom sheet off screen or covers input fields
**Why it happens:** Mobile browsers resize viewport when keyboard opens; `position: fixed` elements shift
**How to avoid:** Use `visualViewport` API to detect keyboard; adjust bottom sheet position; scroll form content to keep focused input visible
**Warning signs:** Input fields disappear behind keyboard when editing in bottom sheet

### Pitfall 4: Service Worker Cache Staleness
**What goes wrong:** Users see stale app version after deploy
**Why it happens:** Service worker serves cached assets; new version not activated
**How to avoid:** Use `registerType: 'autoUpdate'` in vite-plugin-pwa config; this auto-activates new SW on detection
**Warning signs:** Code changes don't appear after refresh

### Pitfall 5: dnd-kit Touch Delay Confusion
**What goes wrong:** Long-press drag doesn't activate, or activates too easily
**Why it happens:** TouchSensor needs delay configuration to distinguish tap from long-press
**How to avoid:** Configure `activationConstraint: { delay: 500, tolerance: 5 }` on TouchSensor — 500ms hold before drag starts, 5px tolerance for finger wobble
**Warning signs:** Accidental drags when tapping, or drag never activating

### Pitfall 6: 100vh on Mobile Browsers
**What goes wrong:** Layout extends behind browser chrome (URL bar, toolbar)
**Why it happens:** `100vh` includes hidden browser chrome height on mobile Safari/Chrome
**How to avoid:** Use `100dvh` (dynamic viewport height) instead of `100vh`; or use `min-h-screen` with Tailwind which handles this
**Warning signs:** Bottom tab bar partially hidden behind browser toolbar

## Code Examples

### vite-plugin-pwa Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'TaskBreaker',
        short_name: 'TaskBreaker',
        description: 'ADHD-friendly task breakdown app',
        theme_color: '#7c3aed',  // violet-600 matching existing UI
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
})
```

### Bottom Tab Bar
```typescript
function BottomTabBar({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex justify-around items-center h-14">
        {[
          { id: 'calendar', icon: Calendar, label: 'Calendar' },
          { id: 'list', icon: List, label: 'List' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full',
              activeTab === tab.id ? 'text-violet-600' : 'text-gray-400'
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

### Haptic Feedback Utility
```typescript
export function hapticFeedback(pattern: number | number[] = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
// Usage: hapticFeedback(10) for light tap, hapticFeedback([10, 50, 10]) for pattern
```

### Day Swipe Navigation
```typescript
const handlers = useSwipeable({
  onSwipedLeft: () => setCurrentDate(addDays(currentDate, 1)),
  onSwipedRight: () => setCurrentDate(addDays(currentDate, -1)),
  delta: 50,
  trackTouch: true,
  preventScrollOnSwipe: false,
});

return (
  <div {...handlers} className="min-h-0 flex-1 overflow-y-auto">
    <DayTaskList date={currentDate} />
  </div>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 100vh for full height | 100dvh (dynamic viewport height) | 2023+ | Fixes mobile browser chrome overlap |
| Manual SW registration | vite-plugin-pwa autoUpdate | 2023+ | Zero-config, handles versioning |
| framer-motion for sheets | CSS transforms + transitions | 2024+ | Smaller bundle, sufficient for simple sheets |
| beforeinstallprompt only | beforeinstallprompt + manual iOS banner | Always | iOS never supported beforeinstallprompt |

**Deprecated/outdated:**
- `manifest.json` filename: Use `manifest.webmanifest` (vite-plugin-pwa handles this)
- `apple-mobile-web-app-capable`: Still needed for iOS standalone mode

## Open Questions

1. **iOS Safari service worker behavior**
   - What we know: iOS Safari supports service workers but with limitations (no push, limited background)
   - What's unclear: Exact cache eviction behavior on iOS (reports of aggressive cache clearing)
   - Recommendation: Test offline behavior on real iOS device; accept that iOS offline may be less reliable

2. **dnd-kit long-press on mobile**
   - What we know: @dnd-kit/core has TouchSensor with delay activation constraint
   - What's unclear: Whether existing drag-to-reschedule implementation needs modification for mobile or just sensor config
   - Recommendation: Test existing dnd-kit setup on mobile first; likely just needs TouchSensor with delay: 500

## Sources

### Primary (HIGH confidence)
- vite-plugin-pwa official docs: https://vite-pwa-org.netlify.app/guide/ — configuration, service worker, manifest
- MDN Vibration API: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API — browser compatibility, usage
- Tailwind CSS responsive design: https://tailwindcss.com/docs/responsive-design — mobile-first breakpoints

### Secondary (MEDIUM confidence)
- react-swipeable API docs: https://nearform.com/open-source/react-swipeable/docs/api/ — hook usage, options
- react-modal-sheet (evaluated, not recommended): https://github.com/Temzasse/react-modal-sheet — requires motion dep
- Flowbite bottom navigation patterns: https://flowbite.com/docs/components/bottom-navigation/ — Tailwind tab bar reference

### Tertiary (LOW confidence)
- iOS PWA cache eviction: Community reports, no official Apple documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - vite-plugin-pwa and react-swipeable are well-documented, actively maintained
- Architecture: HIGH - Responsive Tailwind patterns are standard; PWA setup is well-established
- Pitfalls: HIGH - iOS limitations, scroll conflicts, keyboard issues are well-known and documented

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (stable domain, 30 days)
