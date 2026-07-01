import { api } from './client';
import type { ChatSession, ChatMessage } from '../types';

interface SendMessageResponse {
  session_id: number;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export const chatApi = {
  getSessions: () =>
    api.get<{ sessions: ChatSession[] }>('/api/chat/sessions'),

  createSession: (title?: string) =>
    api.post<{ session: ChatSession }>('/api/chat/session', { title }),

  getSession: (id: number) =>
    api.get<{ session: ChatSession }>(`/api/chat/sessions/${id}`),

  sendMessage: (message: string, session_id?: number) =>
    api.post<SendMessageResponse>('/api/chat/message', { message, session_id }),

  deleteSession: (id: number) =>
    api.delete<{ message: string }>(`/api/chat/sessions/${id}`),
};
