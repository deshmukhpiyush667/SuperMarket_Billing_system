import api from './axios';

export const categoryApi = {
  getAll: (activeOnly = false) => api.get('/categories', { params: { activeOnly } }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};
