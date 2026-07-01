import { api } from './client';
import type { MonthlyReport, CashflowItem, CategoryReportItem } from '../types';

export const reportsApi = {
  monthly: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return api.get<MonthlyReport>(`/api/reports/monthly?${params}`);
  },

  cashflow: (months = 6) =>
    api.get<{ cashflow: CashflowItem[]; currency: string }>(
      `/api/reports/cashflow?months=${months}`
    ),

  categoryBreakdown: (type: 'income' | 'expense' = 'expense', year?: number) => {
    const params = new URLSearchParams({ type });
    if (year) params.set('year', String(year));
    return api.get<{
      year: number;
      type: string;
      total: number;
      currency: string;
      breakdown: CategoryReportItem[];
    }>(`/api/reports/category-breakdown?${params}`);
  },
};
