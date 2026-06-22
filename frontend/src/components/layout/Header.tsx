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
    <header className="flex items-center justify-between px-6 py-4 bg-transparent border-b border-dark-100 flex-shrink-0 z-10">
      <div className="flex-1">
        {/* Placeholder for left side if needed, Dashboard handles the greeting */}
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-9 pr-4 py-2 w-64 rounded-full border border-dark-200 bg-white text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-dark-400"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-full hover:bg-dark-100 text-dark-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border-2 border-white" />
        </button>

        {/* Avatar & Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border border-primary-200">
            <span className="text-primary-600 text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-dark-900 leading-none">{user?.name || 'Admin User'}</div>
            <div className="text-[10px] text-dark-500 mt-1">SME Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
