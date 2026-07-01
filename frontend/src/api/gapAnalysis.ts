import { api } from './client';
import type { GapAnalysisResult, MonthlyChartData } from '../types';

interface RunAnalysisResponse {
  message: string;
  result: GapAnalysisResult;
  monthly_data: MonthlyChartData[];
  analysis_period: string;
}

interface HistoryResponse {
  results: GapAnalysisResult[];
  total: number;
  pages: number;
}

export const gapAnalysisApi = {
  run: (months_back = 3) =>
    api.post<RunAnalysisResponse>('/api/gap-analysis/run', { months_back }),

  history: (page = 1) =>
    api.get<HistoryResponse>(`/api/gap-analysis/history?page=${page}`),

  getResult: (id: number) =>
    api.get<{ result: GapAnalysisResult }>(`/api/gap-analysis/${id}`),
};
