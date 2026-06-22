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
  Crown,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budget', icon: PieChart, label: 'Budget' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/gap-analysis', icon: Target, label: 'Gap Analysis' },
  { to: '/ai-assistant', icon: Brain, label: 'AI Assistant' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
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
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-dark-900 border-r border-dark-800 overflow-hidden flex-shrink-0 text-white font-sans"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-dark-900 border-t-transparent animate-spin-slow" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xl tracking-tight"
          >
            FinanceAI<span className="text-primary-500 text-lg relative -top-1">+</span>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={label} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'text-dark-600 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={clsx("w-5 h-5 flex-shrink-0", isActive ? "text-success" : "")} />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-6 space-y-4">
        {!collapsed && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-warning/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center mb-3">
              <Crown className="w-4 h-4 text-warning" />
            </div>
            <div className="text-sm font-bold text-white mb-1">Premium Plan</div>
            <div className="text-xs text-success">Active</div>
          </div>
        )}
        
        {collapsed && (
           <div className="w-10 h-10 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
             <Crown className="w-5 h-5 text-warning" />
           </div>
        )}

        <div className="pt-2 border-t border-dark-800">
           <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center gap-3 w-full py-2.5 rounded-xl text-dark-600 hover:text-white hover:bg-white/5 transition-all duration-200",
              collapsed ? "justify-center px-0" : "px-3"
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
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
        className="absolute -right-3 top-8 w-6 h-6 bg-dark-800 border border-dark-700 rounded-full flex items-center justify-center text-dark-600 hover:text-white hover:bg-dark-700 transition-all z-10"
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
