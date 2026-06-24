import { api } from './client';
import type { Goal } from '../types';

export interface CreateGoalData {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM-DD
  monthly_savings: number;
}

export interface UpdateGoalData {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string; // YYYY-MM-DD
  monthly_savings?: number;
}

export const goalsApi = {
  getGoals: () => 
    api.get<{ goals: Goal[] }>('/api/goals'),

  createGoal: (data: CreateGoalData) => 
    api.post<{ message: string; goal: Goal }>('/api/goals', data),

  updateGoal: (id: number, data: UpdateGoalData) => 
    api.put<{ message: string; goal: Goal }>(`/api/goals/${id}`, data),

  deleteGoal: (id: number) => 
    api.delete<{ message: string }>(`/api/goals/${id}`),

  getGoalProjection: (id: number) => 
    api.post<{ projection: string }>(`/api/goals/${id}/projection`),
};
