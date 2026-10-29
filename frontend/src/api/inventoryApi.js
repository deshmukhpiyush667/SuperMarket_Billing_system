import api from './axios';

export const inventoryApi = {
  adjustStock: (data) => api.post('/inventory/adjust', data),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  getRecentMovements: () => api.get('/inventory/movements/recent'),
  getProductMovements: (productId) => api.get(`/inventory/movements/product/${productId}`),
};
