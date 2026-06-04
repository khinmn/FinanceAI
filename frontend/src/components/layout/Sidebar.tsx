import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  AlertTriangle,
  LogOut,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/gap-analysis', icon: AlertTriangle, label: 'Gap Analysis' },
  { to: '/settings', icon: TrendingUp, label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, business, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-[#1E293B] border-r border-slate-200/10 overflow-hidden flex-shrink-0 text-slate-100"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/30">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shadow-sm">
          <TrendingUp className="w-5 h-5 text-[#2563EB]" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-white font-bold text-base leading-none">FinanceAI</div>
            <div className="text-slate-300 text-xs mt-0.5 truncate max-w-[140px]">
              {business?.business_name || 'My Business'}
            </div>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.985 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-200/80 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-slate-700/30 pt-3 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-300 text-xs truncate">{user.email}</p>
          </div>
        )}
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-red-50/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-red-600" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </motion.button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#0f1724] border border-slate-700 rounded-full flex items-center justify-center text-slate-200 hover:text-white hover:bg-[#0b1220] transition-all z-10 shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.aside>
  );
}
