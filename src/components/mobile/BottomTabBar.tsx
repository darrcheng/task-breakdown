import { Archive, Calendar, List, Settings } from 'lucide-react';
import clsx from 'clsx';

export type MobileTab = 'calendar' | 'list' | 'someday' | 'settings';

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; icon: typeof Calendar; label: string }[] = [
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'list', icon: List, label: 'List' },
  { id: 'someday', icon: Archive, label: 'Someday' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 h-full',
                isActive ? 'text-violet-600' : 'text-slate-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
