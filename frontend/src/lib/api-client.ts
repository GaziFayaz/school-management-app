import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Standardized utility to extract user-friendly error messages from API responses
 */
export function extractApiErrorMessage(error: any, defaultFallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return defaultFallback;

  if (typeof error === 'string') return error;

  const data = error.response?.data;
  if (data) {
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.detail) return data.detail;
    if (data.title) return data.title;
    if (data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat();
      if (messages.length > 0) return String(messages[0]);
    }
  }

  if (error.message) {
    if (error.message.includes('Network Error')) {
      return 'Unable to reach the server. Please verify your connection or ensure backend is running.';
    }
    return error.message;
  }

  return defaultFallback;
}
