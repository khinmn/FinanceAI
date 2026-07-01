import { api } from './client';
import type {
  DashboardSummary,
  MonthlyChartData,
  CategoryChartData,
  Transaction,
} from '../types';

export const dashboardApi = {
  summary: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return api.get<DashboardSummary>(`/api/dashboard/summary?${params}`);
  },

  monthlyChart: (months = 6) =>
    api.get<{ chart_data: MonthlyChartData[] }>(
      `/api/dashboard/chart/monthly?months=${months}`
    ),

  categoryChart: (type: 'income' | 'expense' = 'expense', month?: number, year?: number) => {
    const params = new URLSearchParams({ type });
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return api.get<{ chart_data: CategoryChartData[]; total: number; type: string }>(
      `/api/dashboard/chart/categories?${params}`
    );
  },

  recent: (limit = 5) =>
    api.get<{ transactions: Transaction[] }>(`/api/dashboard/recent?limit=${limit}`),

  healthScore: () =>
    api.get<{ health_score: number; overall_health: string; score_label: string; risk_score: number }>('/api/dashboard/health-score'),
};

