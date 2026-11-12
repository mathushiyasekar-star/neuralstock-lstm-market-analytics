import React from 'react';
import { UserAccount } from '../types/market';
import { Bell, Shield, User, Sun, Moon } from 'lucide-react';

export type ActiveTab = 'terminal' | 'lstm_lab' | 'alerts' | 'portfolio' | 'admin';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserAccount;
  onOpenAuthModal: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuthModal,
  unreadCount,
  onOpenNotifications,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('terminal');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block shadow-xs shadow-emerald-500/50" />
          NeuralStock
        </a>
      </div>

      {/* Zone 2: 4-5 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('terminal')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'terminal' ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' : ''
          }`}
        >
          Market Terminal
        </button>

        <button
          onClick={() => onSelectTab('lstm_lab')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'lstm_lab' ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' : ''
          }`}
        >
          LSTM Model Lab
        </button>

        <button
          onClick={() => onSelectTab('alerts')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'alerts' ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' : ''
          }`}
        >
          Alerts & Notifications
        </button>

        <button
          onClick={() => onSelectTab('portfolio')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'portfolio' ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' : ''
          }`}
        >
          Paper Portfolio
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'admin' ? 'text-purple-400 border-b-2 border-purple-400 font-semibold' : ''
            }`}
          >
            Admin Console
          </button>
        )}
      </nav>

      {/* Zone 3: 1 primary action / User profile zone */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Dual Theme Switcher */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle light and dark theme"
          className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Live Notification Bell with unread counter */}
        <button
          onClick={onOpenNotifications}
          aria-label="Open notifications"
          className="relative p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Account / RBAC Switcher Button */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-xs"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <span className="font-medium text-slate-200 hidden sm:inline">{currentUser.name}</span>
          <span
            className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${
              currentUser.role === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : currentUser.role === 'analyst'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {currentUser.role}
          </span>
        </button>
      </div>
    </header>
  );
};
