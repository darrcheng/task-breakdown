import { useState } from 'react';

const SETTINGS_KEY = 'taskbreaker-settings';

export interface Settings {
  weekStartsOn: 0 | 1;          // 0=Sunday, 1=Monday
  showKeyboardShortcuts: boolean; // toggle hint display in UI
}

const DEFAULT_SETTINGS: Settings = {
  weekStartsOn: 0,
  showKeyboardShortcuts: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { settings, updateSettings };
}
