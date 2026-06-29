import React, { useEffect } from 'react';
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

// If logged in, redirect to dashboard. Otherwise show the page (landing/login/register).
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// If NOT logged in, redirect to landing page. Otherwise show the protected page.
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

// Enforce role-based access control on routes
function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const role = user?.role || 'owner';

  if (!allowedRoles.includes(role)) {
    // If not allowed, redirect back to dashboard (or transactions for employee)
    const fallbackPath = role === 'employee' ? '/transactions' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

// Catch unknown URLs: logged in → dashboard, logged out → landing page
function CatchAllRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const defaultPath = user?.role === 'employee' ? '/transactions' : '/dashboard';
  return <Navigate to={isAuthenticated ? defaultPath : '/'} replace />;
}

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
      <Routes>
        {/* Landing Page - first thing any visitor sees */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

        {/* Auth pages */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected app routes */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          {/* Dashboard page accessible by all except employees */}
          <Route path="dashboard" element={
            <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
              <DashboardPage />
            </RoleRoute>
          } />
          
          {/* Transactions page accessible by everyone */}
          <Route path="transactions" element={<TransactionsPage />} />
          
          {/* Budget page accessible by all except employees */}
          <Route path="budget" element={
            <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
              <BudgetPage />
            </RoleRoute>
          } />
          
          {/* Reports page accessible by all except employees */}
          <Route path="reports" element={
            <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
              <ReportsPage />
            </RoleRoute>
          } />
          
          {/* Gap Analysis page accessible by all except employees */}
          <Route path="gap-analysis" element={
            <RoleRoute allowedRoles={['owner', 'personal', 'accountant', 'manager']}>
              <GapAnalysisPage />
            </RoleRoute>
          } />
          
          {/* AI Assistant page accessible by owner, personal, accountant */}
          <Route path="ai-assistant" element={
            <RoleRoute allowedRoles={['owner', 'personal', 'accountant']}>
              <AiAssistantPage />
            </RoleRoute>
          } />
          
          {/* Goals page accessible by owner and personal only */}
          <Route path="goals" element={
            <RoleRoute allowedRoles={['owner', 'personal']}>
              <GoalsPage />
            </RoleRoute>
          } />
          
          {/* Team page accessible by owner only */}
          <Route path="team" element={
            <RoleRoute allowedRoles={['owner']}>
              <TeamPage />
            </RoleRoute>
          } />
          
          {/* Settings page accessible by everyone (some tabs restricted internally) */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
