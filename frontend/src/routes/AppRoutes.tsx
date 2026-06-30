import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import TransactionsPage from '../pages/TransactionsPage';
import ReportsPage from '../pages/ReportsPage';
import GapAnalysisPage from '../pages/GapAnalysisPage';
import SettingsPage from '../pages/SettingsPage';
import BudgetPage from '../pages/BudgetPage';
import AiAssistantPage from '../pages/AiAssistantPage';
import GoalsPage from '../pages/GoalsPage';
import TeamPage from '../pages/TeamPage';
import { authApi } from '../api/auth';

// ─── Role constants ───────────────────────────────────────────────────────────
const VALID_ROLES = ['personal', 'owner', 'accountant', 'manager', 'employee'] as const;

function normaliseRole(role: string | null | undefined): string {
  if (!role) return 'owner';
  const lower = role.toLowerCase().trim();
  const legacyMap: Record<string, string> = {
    'sme owner':    'owner',
    'sme_owner':    'owner',
    'solo user':    'personal',
    'personal user':'personal',
    'staff member': 'employee',
    'freelancer':   'personal',
    'shop owner':   'owner',
    'admin':        'owner',
    'accountant / finance staff': 'accountant',
  };
  if (legacyMap[lower]) return legacyMap[lower];
  if ((VALID_ROLES as readonly string[]).includes(lower)) return lower;
  return 'owner';
}

// ─── Route guards ────────────────────────────────────────────────────────────

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  const role = normaliseRole(user?.role);
  if (!allowedRoles.includes(role)) {
    const fallback = role === 'employee' ? '/transactions' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

function CatchAllRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const role = normaliseRole(user?.role);
  const defaultPath = role === 'employee' ? '/transactions' : '/dashboard';
  return <Navigate to={isAuthenticated ? defaultPath : '/'} replace />;
}

// ─── Splash / token-validation loader ────────────────────────────────────────

function AppLoader({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, setUser, user } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }

    // Validate the stored token by hitting /api/auth/me
    authApi.me()
      .then((res) => {
        // Refresh user data in case anything changed on the server
        setUser(res.user as any);
      })
      .catch(() => {
        // Token is expired / invalid — clear everything so the login page is shown
        logout();
      })
      .finally(() => {
        setChecking(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Auto-heal: normalise any legacy role stored in persisted user object
  useEffect(() => {
    if (!user) return;
    const normalised = normaliseRole(user.role);
    if (normalised !== user.role) {
      setUser({ ...user, role: normalised as any });
    }
  }, [user, setUser]);

  if (checking) {
    // Minimal loading screen while we verify the token
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] dark:bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="FinanceAI" className="w-14 h-14 animate-pulse" />
          <p className="text-sm text-dark-400 font-medium">Loading FinanceAI…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Main router ──────────────────────────────────────────────────────────────

export default function AppRoutes() {
  const darkMode = useAuthStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <AppLoader>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected app shell */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>

            {/* Dashboard — personal/owner/accountant/manager */}
            <Route path="dashboard" element={
              <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
                <DashboardPage />
              </RoleRoute>
            } />

            {/* Transactions — all roles */}
            <Route path="transactions" element={<TransactionsPage />} />

            {/* Budget — view: all except employee; create/edit: owner/personal only (enforced inside) */}
            <Route path="budget" element={
              <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
                <BudgetPage />
              </RoleRoute>
            } />

            {/* Reports — full: owner/personal/accountant; basic: manager */}
            <Route path="reports" element={
              <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
                <ReportsPage />
              </RoleRoute>
            } />

            {/* Gap Analysis — full: owner/personal/accountant; summary: manager */}
            <Route path="gap-analysis" element={
              <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
                <GapAnalysisPage />
              </RoleRoute>
            } />

            {/* AI Assistant — owner/personal/accountant only */}
            <Route path="ai-assistant" element={
              <RoleRoute allowedRoles={['owner', 'personal', 'accountant']}>
                <AiAssistantPage />
              </RoleRoute>
            } />

            {/* Goals — owner/personal only */}
            <Route path="goals" element={
              <RoleRoute allowedRoles={['owner', 'personal']}>
                <GoalsPage />
              </RoleRoute>
            } />

            {/* Team Management — owner only */}
            <Route path="team" element={
              <RoleRoute allowedRoles={['owner']}>
                <TeamPage />
              </RoleRoute>
            } />

            {/* Settings — all roles */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </AppLoader>
    </BrowserRouter>
  );
}
