import { api } from './client';
import type { AuthResponse, User, Business } from '../types';

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    business_name: string;
    industry: string;
    description?: string;
  }) => api.post<AuthResponse>('/api/auth/register', data, { skipAuth: true }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }, { skipAuth: true }),

  me: () =>
    api.get<{ user: User; business: Business | null }>('/api/auth/me'),

  updateProfile: (data: {
    name?: string;
    business?: Partial<Business>;
  }) => api.put<{ message: string; user: User; business: Business | null }>('/api/auth/update-profile', data),

  changePassword: (current_password: string, new_password: string) =>
    api.post<{ message: string }>('/api/auth/change-password', {
      current_password,
      new_password,
    }),
};
