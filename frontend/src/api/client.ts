import { useAuthStore } from '../store/authStore';

// Direct URL to Flask backend — CORS is enabled on the backend for all origins
// so direct cross-origin requests work without needing the Vite proxy.
const BASE_URL = 'http://127.0.0.1:5000';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getToken();
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // If the token is 'undefined', clear it so we don't end up in an invalid state
      localStorage.removeItem('access_token');
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 — token expired, clear auth and redirect
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const text = await response.text();
  let data: unknown = null;

  if (text.trim().length > 0) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = JSON.parse(text);
    } else {
      data = text;
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null ? (data as any).error : String(data || `Request failed with status ${response.status}`);
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) => {
    const isFormData = body instanceof FormData;
    return request<T>(path, {
      method: 'POST',
      body: isFormData ? (body as any) : (body !== undefined ? JSON.stringify(body) : undefined),
      ...options,
    });
  },

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...options }),
};
