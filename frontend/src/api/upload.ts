import { api } from './client';

export const uploadApi = {
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ message: string; receipt_url: string }>('/api/upload/receipt', formData);
  },
};
