import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Target,
  Brain,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crosshair
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

// Role-label display map (matches Header.tsx)
const ROLE_LABELS: Record<string, string> = {
  owner:      'SME Owner',
  personal:   'Personal User',
  accountant: 'Accountant',
  manager:    'Manager',
  employee:   'Employee',
};

// RBAC matrix per feature area
// Dashboard   : owner/personal/accountant/manager  (employee: None)
// Transactions: everyone (add/delete restricted inside page)
// Budget      : owner/personal/accountant/manager  (employee: None)
// Reports     : owner/personal/accountant/manager  (employee: None)
// Gap Analysis: owner/personal/accountant/manager  (employee: None)
// AI Assistant: owner/personal/accountant          (manager/employee: None)
// Goals       : owner/personal                     (others: None)
// Team        : owner only
// Settings    : everyone

const navItems = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    allowedRoles: ['owner', 'personal', 'accountant', 'manager'],
  },
  {
    to: '/transactions',
    icon: ArrowLeftRight,
    label: 'Transactions',
    allowedRoles: ['owner', 'personal', 'accountant', 'manager', 'employee'],
  },
  {
    to: '/budget',
    icon: PieChart,
    label: 'Budget',
    allowedRoles: ['owner', 'personal', 'accountant', 'manager'],
  },
  {
    to: '/reports',
    icon: BarChart3,
    label: 'Reports',
    allowedRoles: ['owner', 'personal', 'accountant', 'manager'],
  },
  {
    to: '/gap-analysis',
    icon: Crosshair,
    label: 'Gap Analysis',
    allowedRoles: ['owner', 'personal', 'accountant', 'manager'],
  },
  {
    to: '/ai-assistant',
    icon: Brain,
    label: 'AI Assistant',
    allowedRoles: ['owner', 'personal', 'accountant'],
  },
  {
    to: '/goals',
    icon: Target,
    label: 'Goals',
    allowedRoles: ['owner', 'personal'],
  },
  {
    to: '/team',
    icon: Users,
    label: 'Team',
    allowedRoles: ['owner'],
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
    allowedRoles: ['owner', 'personal', 'accountant', 'manager', 'employee'],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userRole = user?.role || 'owner';
  const roleLabel = ROLE_LABELS[userRole] || 'User';
  const visibleNavItems = navItems.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen overflow-hidden flex-shrink-0 font-sans"
      style={{ background: 'linear-gradient(180deg, #0F1115 0%, #1A1328 50%, #0F1115 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-32 h-32 bg-brand-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-8">
        <img src="/logo.svg" alt="FinanceAI" className="w-9 h-9 flex-shrink-0" />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xl tracking-tight text-white"
          >
            FinanceAI
          </motion.div>
        )}
      </div>

      {/* Role badge (visible when not collapsed) */}
      {!collapsed && (
        <div className="relative z-10 mx-4 mb-3 px-3 py-2 rounded-xl bg-brand-600/15 border border-brand-500/20">
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">Current Role</p>
          <p className="text-xs text-white font-bold mt-0.5">{roleLabel}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={label} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                    : 'text-dark-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={clsx("w-5 h-5 flex-shrink-0", isActive ? "text-brand-400" : "")} />
                {!collapsed && (
                  <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="relative z-10 px-4 py-6 space-y-4">
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center gap-3 w-full py-2.5 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all duration-200",
              collapsed ? "justify-center px-0" : "px-3"
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>

        {!collapsed && (
          <div className="text-[10px] text-dark-600 px-3 text-center">
            FinanceAI v2.0
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 bg-dark-800 border border-brand-500/20 rounded-full flex items-center justify-center text-dark-500 hover:text-brand-400 hover:bg-dark-700 transition-all z-20"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
