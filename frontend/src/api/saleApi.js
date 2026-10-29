import api from './axios';

export const saleApi = {
  createSale: (data) => api.post('/sales', data),
  getSales: (params) => api.get('/sales', { params }),
  getSaleById: (id) => api.get(`/sales/${id}`),
  getSaleByInvoice: (invoiceNumber) => api.get(`/sales/invoice/${invoiceNumber}`),
  cancelSale: (id, reason) => api.post(`/sales/${id}/cancel`, null, { params: { reason } }),
};
