import { X, Download } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * Subtle, dismissable PWA install prompt.
 * Appears above the bottom tab bar after 3+ visits on supported browsers.
 * Note: beforeinstallprompt is NOT supported on iOS Safari.
 */
export function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt(3);

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-16 inset-x-2 z-45 bg-violet-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 animate-slide-up">
      <Download className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Install taskpad</p>
        <p className="text-xs text-violet-200">Add to your home screen for quick access</p>
      </div>
      <button
        onClick={install}
        className="px-3 py-1.5 bg-white text-violet-600 text-sm font-medium rounded-lg hover:bg-violet-50 flex-shrink-0"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        className="p-1 text-violet-200 hover:text-white flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
