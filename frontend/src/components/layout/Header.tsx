import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, AlertCircle, CheckCircle, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NotificationItem {
  id: string;
  type: 'alert' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Budget Threshold Exceeded',
    message: 'Your Food & Beverage budget has crossed 90% of its monthly limit.',
    time: '2h ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'AI Smart Advice',
    message: 'Saved 12% on utilities this week. Tap to see projection insights.',
    time: '1d ago',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Goal Reached',
    message: 'Saved MMK 500,000 for "Shop expansion" target!',
    time: '2d ago',
    read: true,
  },
];

export default function Header() {
  const { user, darkMode, setDarkMode } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case 'owner':      return 'SME Owner';
      case 'personal':   return 'Personal User';
      case 'accountant': return 'Accountant';
      case 'manager':    return 'Manager';
      case 'employee':   return 'Employee';
      default:           return 'User';
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/60 dark:bg-dark-900/60 backdrop-blur-md border-b border-brand-100/50 dark:border-dark-800/40 flex-shrink-0 z-30 relative transition-colors duration-300">
      <div className="flex-1">
        {/* Placeholder for left side if needed */}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-dark-400 dark:text-dark-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-9 pr-4 py-2.5 w-64 rounded-full border border-brand-100 dark:border-dark-700 bg-white dark:bg-dark-800 text-sm dark:text-white focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 transition-all placeholder:text-dark-400 dark:placeholder:text-dark-500 shadow-sm"
          />
        </div>

        {/* Light/Dark Theme Toggle */}
        <button
          onClick={() => setDarkMode?.(!darkMode)}
          className="p-2.5 rounded-full hover:bg-brand-50 dark:hover:bg-dark-800 text-dark-500 hover:text-brand-600 dark:text-dark-400 dark:hover:text-brand-400 transition-colors border border-transparent hover:border-brand-100 dark:hover:border-dark-700/50"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification bell and Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2.5 rounded-full hover:bg-brand-50 dark:hover:bg-dark-800 text-dark-500 hover:text-brand-600 dark:text-dark-400 dark:hover:text-white transition-colors border border-transparent hover:border-brand-100 dark:hover:border-dark-700/50"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger border-2 border-white dark:border-dark-900 animate-pulse" />
            )}
          </button>

          {/* Click-outside backdrop */}
          {isOpen && (
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsOpen(false)}
            />
          )}

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl shadow-2xl overflow-hidden z-50 font-sans"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 dark:border-dark-700/40 bg-white dark:bg-dark-800">
                  <span className="text-sm font-bold text-dark-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notification items */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-dark-700/40">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-dark-400 dark:text-dark-500 text-sm font-medium">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-dark-700/40 transition-colors cursor-pointer text-left ${
                          !n.read ? 'bg-brand-50/10 dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          n.type === 'alert'
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 border border-rose-100 dark:border-rose-900/40'
                            : n.type === 'success'
                              ? 'bg-success/10 dark:bg-success/5 text-success border border-success/20 dark:border-success/30'
                              : 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 border border-brand-100 dark:border-brand-850'
                        }`}>
                          {n.type === 'alert' && <AlertCircle className="w-4 h-4" />}
                          {n.type === 'success' && <CheckCircle className="w-4 h-4" />}
                          {n.type === 'info' && <Sparkles className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs ${!n.read ? 'font-bold text-dark-900 dark:text-white' : 'font-semibold text-dark-800 dark:text-dark-300'} truncate`}>
                              {n.title}
                            </p>
                            <span className="text-[9px] text-dark-400 dark:text-dark-500 font-bold whitespace-nowrap mt-0.5">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-dark-500 dark:text-dark-400 font-semibold leading-relaxed mt-1">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar & Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/30 ring-2 ring-brand-100 dark:ring-dark-800">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-dark-900 dark:text-white leading-none">{user?.name || 'Admin User'}</div>
            <div className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-1">{getRoleLabel(user?.role)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
