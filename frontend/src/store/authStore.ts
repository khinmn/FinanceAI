import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Business } from '../types';

interface AuthState {
  user: User | null;
  business: Business | null;
  role?: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (user: User, business: Business | null, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setRole: (role: string | null) => void;
  setBusiness: (business: Business | null) => void;
  aiCopilotEnabled?: boolean;
  aiDisclaimerEnabled?: boolean;
  setAiCopilotEnabled: (enabled: boolean) => void;
  setAiDisclaimerEnabled: (enabled: boolean) => void;
  notifyWeeklySummary?: boolean;
  notifyBudgetThreshold?: boolean;
  notifyAiInsights?: boolean;
  setNotifyWeeklySummary: (enabled: boolean) => void;
  setNotifyBudgetThreshold: (enabled: boolean) => void;
  setNotifyAiInsights: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      business: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      aiCopilotEnabled: true,
      aiDisclaimerEnabled: true,
      notifyWeeklySummary: true,
      notifyBudgetThreshold: true,
      notifyAiInsights: false,

      login: (user, business, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, business, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          business: null,
          role: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          aiCopilotEnabled: true,
          aiDisclaimerEnabled: true,
          notifyWeeklySummary: true,
          notifyBudgetThreshold: true,
          notifyAiInsights: false,
        });
      },

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setBusiness: (business) => set({ business }),
      setAiCopilotEnabled: (aiCopilotEnabled) => set({ aiCopilotEnabled }),
      setAiDisclaimerEnabled: (aiDisclaimerEnabled) => set({ aiDisclaimerEnabled }),
      setNotifyWeeklySummary: (notifyWeeklySummary) => set({ notifyWeeklySummary }),
      setNotifyBudgetThreshold: (notifyBudgetThreshold) => set({ notifyBudgetThreshold }),
      setNotifyAiInsights: (notifyAiInsights) => set({ notifyAiInsights }),
    }),
    {
      name: 'financeai-auth',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        role: state.role,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        aiCopilotEnabled: state.aiCopilotEnabled,
        aiDisclaimerEnabled: state.aiDisclaimerEnabled,
        notifyWeeklySummary: state.notifyWeeklySummary,
        notifyBudgetThreshold: state.notifyBudgetThreshold,
        notifyAiInsights: state.notifyAiInsights,
      }),
    }
  )
);
