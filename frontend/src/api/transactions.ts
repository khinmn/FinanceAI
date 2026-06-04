import { api } from './client';
import type { Transaction, TransactionFormData, Pagination } from '../types';

interface TransactionListResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

interface TransactionSummary {
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  net_balance: number;
  income_count: number;
  expense_count: number;
  currency: string;
}

export const transactionsApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    type?: string;
    category_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return api.get<TransactionListResponse>(`/api/transactions${qs ? `?${qs}` : ''}`);
  },

  get: (id: number) =>
    api.get<{ transaction: Transaction }>(`/api/transactions/${id}`),

  create: (data: TransactionFormData) =>
    api.post<{ message: string; transaction: Transaction }>('/api/transactions', {
      ...data,
      amount: parseFloat(data.amount),
      category_id: data.category_id || null,
    }),

  update: (id: number, data: Partial<TransactionFormData>) =>
    api.put<{ message: string; transaction: Transaction }>(`/api/transactions/${id}`, {
      ...data,
      amount: data.amount ? parseFloat(data.amount) : undefined,
    }),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/transactions/${id}`),

  summary: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return api.get<TransactionSummary>(`/api/transactions/summary?${params}`);
  },
};
