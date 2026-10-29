import React from 'react';

const SummaryCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200/60',
      badge: 'text-emerald-700 bg-emerald-100/60',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200/60',
      badge: 'text-blue-700 bg-blue-100/60',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200/60',
      badge: 'text-amber-700 bg-amber-100/60',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200/60',
      badge: 'text-purple-700 bg-purple-100/60',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200/60',
      badge: 'text-rose-700 bg-rose-100/60',
    },
  }[color] || {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200/60',
    badge: 'text-emerald-700 bg-emerald-100/60',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${colorStyles.bg} ${colorStyles.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className={`px-2 py-0.5 rounded-md font-semibold mr-2 ${colorStyles.badge}`}>
            Update
          </span>
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
