import { useState, useEffect } from 'react';

/**
 * Returns true when the media query matches.
 * Updates reactively on viewport changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Returns true on mobile-width screens (<= 768px).
 * Use this as the primary mobile/desktop layout switch.
 * Matches Tailwind's `md` breakpoint — everything below md is mobile layout.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}
