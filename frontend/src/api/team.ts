import { api } from './client';
import type { TeamMember } from '../types';

export interface CreateMemberData {
  name: string;
  email: string;
  role: 'Owner' | 'Accountant' | 'Manager' | 'Employee';
  status?: 'Active' | 'Pending';
}

export interface UpdateMemberData {
  name?: string;
  role?: 'Owner' | 'Accountant' | 'Manager' | 'Employee';
  status?: 'Active' | 'Pending';
}

export const teamApi = {
  getTeamMembers: () => 
    api.get<{ members: TeamMember[] }>('/api/team'),

  addTeamMember: (data: CreateMemberData) => 
    api.post<{ message: string; member: TeamMember }>('/api/team', data),

  updateTeamMember: (id: number, data: UpdateMemberData) => 
    api.put<{ message: string; member: TeamMember }>(`/api/team/${id}`, data),

  deleteTeamMember: (id: number) => 
    api.delete<{ message: string }>(`/api/team/${id}`),
};
