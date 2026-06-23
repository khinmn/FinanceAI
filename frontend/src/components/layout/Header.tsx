import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-md border-b border-brand-100/50 flex-shrink-0 z-10">
      <div className="flex-1">
        {/* Placeholder for left side if needed, Dashboard handles the greeting */}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-9 pr-4 py-2.5 w-64 rounded-full border border-brand-100 bg-white text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all placeholder:text-dark-400 shadow-sm"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2.5 rounded-full hover:bg-brand-50 text-dark-500 hover:text-brand-600 transition-colors border border-transparent hover:border-brand-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-white" />
        </button>

        {/* Avatar & Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/30 ring-2 ring-brand-100">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-dark-900 leading-none">{user?.name || 'Admin User'}</div>
            <div className="text-[10px] text-brand-600 font-semibold mt-1">SME Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
