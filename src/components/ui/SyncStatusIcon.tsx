import { useState, useEffect, useRef } from 'react';
import { CloudCheck, CloudUpload, CloudOff, CloudAlert } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { retrySync } from '../../firebase/sync';

const SYNC_ICONS = {
  synced:  { Icon: CloudCheck,  color: 'text-emerald-500' },
  syncing: { Icon: CloudUpload, color: 'text-blue-500'    },
  offline: { Icon: CloudOff,    color: 'text-amber-500'   },
  error:   { Icon: CloudAlert,  color: 'text-red-500'     },
} as const;

const SYNC_MESSAGES = {
  synced:  'All changes synced',
  syncing: 'Syncing changes...',
  offline: 'Offline \u2014 changes saved locally',
  error:   'Sync failed \u2014 check your connection and try again',
} as const;

export function SyncStatusIcon() {
  const status = useSyncStatus();
  const [showPopover, setShowPopover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Outside click handling
  useEffect(() => {
    if (!showPopover) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showPopover]);

  // Auto-dismiss for non-error states
  useEffect(() => {
    if (!showPopover || status === 'error') return;

    const timer = setTimeout(() => setShowPopover(false), 3000);
    return () => clearTimeout(timer);
  }, [showPopover, status]);

  const { Icon, color } = SYNC_ICONS[status];

  const handleRetry = () => {
    retrySync();
    setShowPopover(false);
  };

  const iconElement = <Icon className={`w-5 h-5 ${color}`} />;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setShowPopover(prev => !prev)}
        className="flex items-center justify-center p-1 rounded hover:bg-slate-100 transition-colors"
        title={SYNC_MESSAGES[status]}
      >
        {iconElement}
      </button>

      {showPopover && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[260px] z-50">
          <p className="text-sm text-slate-700">{SYNC_MESSAGES[status]}</p>
          {status === 'error' && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleRetry}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setShowPopover(false)}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
