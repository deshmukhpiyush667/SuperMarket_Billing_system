import api from './axios';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  checkHealth: () => api.get('/health'),
};
