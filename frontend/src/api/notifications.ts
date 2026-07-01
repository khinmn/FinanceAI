import { api } from './client';

export interface NotificationItem {
  id: string;
  type: 'alert' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  created_at: string | null;
  read: boolean;
}

export const notificationsApi = {
  list: () => api.get<{ notifications: NotificationItem[] }>('/api/notifications'),
};
