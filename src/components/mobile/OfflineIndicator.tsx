import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Shows a small amber banner when the app loses internet connectivity.
 * Automatically hides when connection is restored.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white text-center py-1 px-4 text-xs font-medium flex items-center justify-center gap-1.5">
      <WifiOff className="w-3.5 h-3.5" />
      You're offline — tasks are saved locally
    </div>
  );
}
