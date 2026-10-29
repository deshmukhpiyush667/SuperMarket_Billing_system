import api from './axios';

export const productApi = {
  getProducts: (params) => api.get('/products', { params }),
  searchForPOS: (keyword) => api.get('/products/search', { params: { keyword } }),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getLowStock: () => api.get('/products/low-stock'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  toggleStatus: (id) => api.patch(`/products/${id}/toggle-status`),
};
