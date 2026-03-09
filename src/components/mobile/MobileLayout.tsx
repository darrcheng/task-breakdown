import { type ReactNode } from 'react';
import { BottomTabBar, type MobileTab } from './BottomTabBar';
import { SyncStatusIcon } from '../ui/SyncStatusIcon';

interface MobileLayoutProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  children: ReactNode;
}

export function MobileLayout({ activeTab, onTabChange, children }: MobileLayoutProps) {
  return (
    <div className="h-[100dvh] bg-white flex flex-col">
      {/* Mobile header - minimal */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">taskpad</h1>
        <SyncStatusIcon />
      </header>

      {/* Main content area - fills between header and tab bar */}
      <main className="flex-1 flex flex-col overflow-hidden pb-14">
        {children}
      </main>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
