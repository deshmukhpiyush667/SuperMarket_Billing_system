import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  Plus, 
  Filter, 
  Search,
  CheckCircle2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { productApi } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Inventory = () => {
  const [movements, setMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'PURCHASE_RESTOCK',
    quantityChanged: '',
    reason: '',
    referenceNumber: '',
  });

  const { isAdmin } = useAuth();
  const { success, error, warning } = useNotification();

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [movRes, lowRes, prodRes] = await Promise.all([
        inventoryApi.getRecentMovements(),
        productApi.getLowStock(),
        productApi.getProducts({ active: true, size: 100 }),
      ]);

      if (movRes.data?.success) setMovements(movRes.data.data || []);
      if (lowRes.data?.success) setLowStockProducts(lowRes.data.data || []);
      if (prodRes.data?.success) setAllProducts(prodRes.data.data.content || []);
    } catch (err) {
      error('Failed to load inventory movements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestock = (product = null) => {
    setFormData({
      productId: product ? product.id : (allProducts[0]?.id || ''),
      movementType: 'PURCHASE_RESTOCK',
      quantityChanged: '50',
      reason: product ? `Restocking low stock item: ${product.name}` : 'Vendor shipment intake',
      referenceNumber: `PO-${Date.now().toString().slice(-5)}`,
    });
    setModalOpen(true);
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantityChanged || !formData.reason.trim()) {
      error('Please complete all required fields');
      return;
    }

    try {
      const payload = {
        productId: parseInt(formData.productId),
        movementType: formData.movementType,
        quantityChanged: parseInt(formData.quantityChanged),
        reason: formData.reason.trim(),
        referenceNumber: formData.referenceNumber.trim() || undefined,
      };

      await inventoryApi.adjustStock(payload);
      success('Stock adjusted and movement recorded in audit log!');
      setModalOpen(false);
      fetchInventoryData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Stock Audit</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track stock balances, replenish inventory, and inspect historical audit movements
          </p>
        </div>
        <button
          onClick={() => handleOpenRestock()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-bold text-amber-900">
              Low Stock Alert ({lowStockProducts.length} items require replenishment)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white rounded-2xl border border-amber-200 flex items-center justify-between shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    SKU: {p.sku} | In Stock:{' '}
                    <span className="font-bold text-amber-700">
                      {p.stockQuantity} {p.measurementUnit}
                    </span>{' '}
                    (Min: {p.minStockLevel})
                  </p>
                </div>
                <button
                  onClick={() => handleOpenRestock(p)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow-xs shrink-0 transition-colors"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stock Movement Audit Log</h3>
            <p className="text-xs text-slate-500">Real-time ledger of restocks, sales, damages & returns</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product Name / SKU</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4 text-center">Change</th>
                <th className="py-3 px-4 text-center">Stock Balance</th>
                <th className="py-3 px-4">Reason / Reference</th>
                <th className="py-3 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Loading movements log...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPositive = m.quantityChanged > 0;
                  let typeColor = 'bg-slate-100 text-slate-700';

                  if (m.movementType === 'PURCHASE_RESTOCK') {
                    typeColor = 'bg-emerald-100 text-emerald-800';
                  } else if (m.movementType === 'SALE') {
                    typeColor = 'bg-blue-100 text-blue-800';
                  } else if (m.movementType === 'DAMAGE') {
                    typeColor = 'bg-rose-100 text-rose-800';
                  } else if (m.movementType === 'SALE_RETURN') {
                    typeColor = 'bg-purple-100 text-purple-800';
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{m.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.productSku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${typeColor}`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${m.quantityChanged}` : m.quantityChanged}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                        {m.stockBefore} → <strong className="text-slate-900">{m.stockAfter}</strong>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{m.reason}</div>
                        {m.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400">Ref: {m.referenceNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {m.performedByName || 'System'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Record Stock Adjustment</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Product</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                >
                  <option value="">Select a product...</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stockQuantity} {p.measurementUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Movement Type</label>
                  <select
                    value={formData.movementType}
                    onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="PURCHASE_RESTOCK">Purchase Restock (+)</option>
                    <option value="DAMAGE">Damage / Spoilage (-)</option>
                    <option value="MANUAL_ADJUSTMENT">Manual Audit Adjust</option>
                    <option value="SALE_RETURN">Customer Return (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantityChanged}
                    onChange={(e) => setFormData({ ...formData, quantityChanged: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference / PO #</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g. PO-98214 or Vendor Invoice"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Reason</label>
                <textarea
                  rows="2"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Received weekly wholesale dairy crate delivery"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
