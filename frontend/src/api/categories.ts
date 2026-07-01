import { api } from './client';
import type { Category } from '../types';

export const categoriesApi = {
  list: (type?: 'income' | 'expense') => {
    const qs = type ? `?type=${type}` : '';
    return api.get<{ categories: Category[] }>(`/api/categories${qs}`);
  },

  create: (data: { name: string; type: 'income' | 'expense'; color?: string }) =>
    api.post<{ message: string; category: Category }>('/api/categories', data),

  update: (id: number, data: { name?: string; color?: string }) =>
    api.put<{ message: string; category: Category }>(`/api/categories/${id}`, data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/categories/${id}`),
};
