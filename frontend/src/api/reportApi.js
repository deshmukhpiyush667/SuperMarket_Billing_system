import api from './axios';

export const reportApi = {
  getDashboardSummary: () => api.get('/reports/dashboard'),
};
