import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/reports': 'Reports',
  '/gap-analysis': 'Gap Analysis',
};

export default function Header() {
  const location = useLocation();
  const { user, business } = useAuthStore();
  const title = PAGE_TITLES[location.pathname] || 'FinanceAI';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-transparent border-b border-slate-200/10 flex-shrink-0">
      <div>
        <h1 className="text-slate-900 font-semibold text-xl">{title}</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 text-xs">{dateStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[#2563EB] text-sm font-bold">MMK</span>
          <span className="text-slate-600 text-xs">{business?.currency_name || 'Myanmar Kyat'}</span>
        </div>

        {/* Notification bell (cosmetic) */}
        <button className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-all">
          <Bell className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  );
}
