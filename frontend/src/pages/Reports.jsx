import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  Calendar, 
  Award,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { reportApi } from '../api/reportApi';
import SummaryCard from '../components/SummaryCard';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getDashboardSummary();
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Generating analytics reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Sales Intelligence</h2>
        <p className="text-xs text-slate-500 mt-1">
          Database-backed revenue summaries, best-selling products, and transaction volumes
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Daily Sales Today"
          value={`₹${Number(summary?.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.todaySalesCount || 0} completed orders`}
          icon={IndianRupee}
          color="emerald"
        />
        <SummaryCard
          title="Weekly Revenue"
          value={`₹${Number(summary?.weeklyRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.weeklySalesCount || 0} bills finalized`}
          icon={TrendingUp}
          color="blue"
        />
        <SummaryCard
          title="Monthly Revenue"
          value={`₹${Number(summary?.monthlyRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.monthlySalesCount || 0} total customers`}
          icon={Calendar}
          color="purple"
        />
        <SummaryCard
          title="Active Stock Items"
          value={summary?.totalActiveProducts || 0}
          subtitle={`${summary?.lowStockCount || 0} low stock warnings`}
          icon={ShoppingBag}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Daily Revenue (Last 7 Days)</h3>
          <p className="text-xs text-slate-500 mb-4">Total gross sales revenue in ₹</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Volume Line Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Transaction Velocity</h3>
          <p className="text-xs text-slate-500 mb-4">Number of completed bills per day</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value) => [value, 'Transactions']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Line type="monotone" dataKey="orderCount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Best Performing Products (30 Days)</h3>
            <p className="text-xs text-slate-500">Volume and revenue leaders ranked by sales count</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!summary?.topProducts || summary.topProducts.length === 0) ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    No sales data available for ranking.
                  </td>
                </tr>
              ) : (
                summary.topProducts.map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                      {p.productName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {p.productSku}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                      {p.quantitySold}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                      ₹{Number(p.revenue).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
