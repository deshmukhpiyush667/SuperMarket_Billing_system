import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  AlertTriangle, 
  Package, 
  ArrowUpRight, 
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { reportApi } from '../api/reportApi';
import SummaryCard from '../components/SummaryCard';
import InvoiceModal from '../components/InvoiceModal';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getDashboardSummary();
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Compiling real-time supermarket analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Store Performance
          </span>
          <h2 className="text-2xl font-black mt-2">Executive Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Live supermarket metrics and operational trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pos"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Launch POS Register</span>
          </Link>
          <Link
            to="/inventory"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-2xl border border-white/10 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Stock Audit</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Today's Revenue"
          value={`₹${Number(summary?.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.todaySalesCount || 0} bills generated`}
          icon={IndianRupee}
          color="emerald"
        />
        <SummaryCard
          title="Weekly Revenue"
          value={`₹${Number(summary?.weeklyRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.weeklySalesCount || 0} completed orders`}
          icon={TrendingUp}
          color="blue"
        />
        <SummaryCard
          title="Monthly Revenue"
          value={`₹${Number(summary?.monthlyRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.monthlySalesCount || 0} total transactions`}
          icon={Calendar}
          color="purple"
        />
        <SummaryCard
          title="Low Stock Warnings"
          value={summary?.lowStockCount || 0}
          subtitle="Items needing replenishment"
          icon={AlertTriangle}
          color={summary?.lowStockCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Analytics Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Sales Trend</h3>
              <p className="text-xs text-slate-500">Daily gross revenue in Indian Rupees (₹)</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Best Sellers</h3>
              <p className="text-xs text-slate-500">Top volume drivers (30 days)</p>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Details
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {(!summary?.topProducts || summary.topProducts.length === 0) ? (
              <p className="text-xs text-slate-400 py-8 text-center">No sales recorded yet.</p>
            ) : (
              summary.topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{prod.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{prod.productSku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-slate-900">{prod.quantitySold} sold</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">₹{Number(prod.revenue).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Completed Invoices</h3>
            <p className="text-xs text-slate-500">Latest checkout register transactions</p>
          </div>
          <Link to="/sales" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>View All Sales</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!summary?.recentTransactions || summary.recentTransactions.length === 0) ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                summary.recentTransactions.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                    <td className="py-3 px-3 text-slate-600">{new Date(sale.saleDate).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{sale.customerName || 'Walk-in'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700 uppercase">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      ₹{Number(sale.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice receipt modal */}
      <InvoiceModal
        sale={selectedSale}
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
};

export default Dashboard;
