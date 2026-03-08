import { useEffect } from 'react';
import { X, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import type { Settings } from '../../hooks/useSettings';
import { AIProviderSettings } from '../settings/AIProviderSettings';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../firebase/auth';
import { db } from '../../db/database';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
}

const SHORTCUTS = [
  { key: 'j', description: 'Next period' },
  { key: 'k', description: 'Previous period' },
  { key: 't', description: 'Go to today' },
  { key: 'm', description: 'Month view' },
  { key: 'w', description: 'Week view' },
  { key: 'c', description: 'Calendar view' },
  { key: 'l', description: 'List view' },
  { key: 's', description: 'Someday view' },
  { key: 'n', description: 'New task' },
  { key: '?', description: 'Open settings' },
];

export function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await db.delete();
    await signOutUser();
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Account */}
          {user && (
            <div className="pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-3 w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Start of week */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Start of week</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateSettings({ weekStartsOn: 0 })}
                className={clsx(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors',
                  settings.weekStartsOn === 0
                    ? 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-offset-1 ring-blue-400'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                Sunday
              </button>
              <button
                onClick={() => onUpdateSettings({ weekStartsOn: 1 })}
                className={clsx(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors',
                  settings.weekStartsOn === 1
                    ? 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-offset-1 ring-blue-400'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                Monday
              </button>
            </div>
          </div>

          {/* AI Provider */}
          <div className="border-t border-slate-200 pt-6">
            <AIProviderSettings />
          </div>

          {/* Keyboard shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700">Enable Keyboard Shortcuts</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showKeyboardShortcuts}
                  onChange={(e) => onUpdateSettings({ showKeyboardShortcuts: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                />
                <span className="text-xs text-slate-500">Enabled</span>
              </label>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-3">
                  <kbd className="text-xs bg-white px-1.5 py-0.5 rounded font-mono border border-slate-200 text-slate-600 min-w-[24px] text-center shadow-sm">
                    {shortcut.key}
                  </kbd>
                  <span className="text-sm text-slate-600">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
