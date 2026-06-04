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
  setBusiness: (business: Business) => void;
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
        });
      },

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setBusiness: (business) => set({ business }),
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
      }),
    }
  )
);
