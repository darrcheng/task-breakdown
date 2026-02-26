import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Captures the browser's PWA install prompt and gates display on visit count.
 * Returns { canInstall, install, dismiss } for UI integration.
 *
 * Note: beforeinstallprompt is NOT supported on iOS Safari.
 * iOS users must manually "Add to Home Screen" from share menu.
 */
export function useInstallPrompt(minVisits = 3) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canShow, setCanShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Track visit count
    const visits = parseInt(localStorage.getItem('taskbreaker-pwa-visits') || '0', 10) + 1;
    localStorage.setItem('taskbreaker-pwa-visits', String(visits));

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('taskbreaker-pwa-dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    setCanShow(visits >= minVisits);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [minVisits]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') {
      setDismissed(true);
      localStorage.setItem('taskbreaker-pwa-dismissed', 'true');
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('taskbreaker-pwa-dismissed', 'true');
    setDeferredPrompt(null);
  }, []);

  return {
    canInstall: !!deferredPrompt && canShow && !dismissed,
    install,
    dismiss,
  };
}
