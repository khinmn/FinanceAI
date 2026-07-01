import { api } from './client';
import type { Budget, BudgetSummaryResponse } from '../types';

export const budgetsApi = {
  summary: (month: number, year: number) => {
    const params = new URLSearchParams();
    params.set('month', String(month));
    params.set('year', String(year));
    return api.get<BudgetSummaryResponse>(`/api/budgets/summary?${params}`);
  },

  create: (data: { category_id: number; amount: number; month: number; year: number }) =>
    api.post<{ message: string; budget: Budget }>('/api/budgets', data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/budgets/${id}`),

  copyPrevious: (month: number, year: number) =>
    api.post<{ message: string; copied_count: number }>('/api/budgets/copy-previous', { month, year }),

  getAiCoach: (month: number, year: number) => {
    const params = new URLSearchParams();
    params.set('month', String(month));
    params.set('year', String(year));
    return api.get<{ insights: string; warning?: string }>(`/api/budgets/ai-coach?${params}`);
  },
};
