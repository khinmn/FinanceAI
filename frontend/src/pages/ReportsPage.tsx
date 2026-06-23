import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { reportsApi } from '../api/reports';
import type { CashflowItem, CategoryReportItem } from '../types';

const fmt = (n: number) =>
  'K ' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

const tooltipFormatter = (value: number | string | readonly (string | number)[] | undefined) =>
  fmt(Number(Array.isArray(value) ? value[0] : value ?? 0));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 shadow-xl text-sm text-white">
        <p className="text-dark-400 mb-2 font-semibold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color || p.stroke }} className="font-bold flex items-center justify-between gap-4">
            <span>{p.name}</span>
            <span>{fmt(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type Tab = 'cashflow' | 'income' | 'expenses';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('cashflow');
  const [cashflow, setCashflow] = useState<CashflowItem[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryReportItem[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cf, inc, exp] = await Promise.all([
        reportsApi.cashflow(6),
        reportsApi.categoryBreakdown('income', year),
        reportsApi.categoryBreakdown('expense', year),
      ]);
      setCashflow(cf.cashflow);
      setIncomeBreakdown(inc.breakdown);
      setExpenseBreakdown(exp.breakdown);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'income', label: 'Income Breakdown' },
    { key: 'expenses', label: 'Expense Breakdown' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const breakdown = activeTab === 'income' ? incomeBreakdown : expenseBreakdown;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-dark-100 rounded-xl w-fit shadow-soft">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-250 ${
              activeTab === t.key
                ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20'
                : 'text-dark-500 hover:text-dark-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'cashflow' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Cumulative cashflow area chart */}
          <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-dark-900 font-bold text-base mb-1">Cumulative Cash Flow</h3>
            <p className="text-dark-400 text-xs mb-5 font-medium">Running total over last 6 months</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={cashflow}>
                <defs>
                  <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10}
                  tickFormatter={(v) => `K${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#8B5CF6"
                  fill="url(#cfGrad)" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly income/expense bars */}
          <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-dark-900 font-bold text-base mb-1">Monthly Net Cash Flow</h3>
            <p className="text-dark-400 text-xs mb-5 font-medium">Income vs expenses per month</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashflow} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10}
                  tickFormatter={(v) => `K${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {(activeTab === 'income' || activeTab === 'expenses') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-dark-900 font-bold text-base mb-1">
              {activeTab === 'income' ? 'Income' : 'Expense'} by Category
            </h3>
            <p className="text-dark-400 text-xs mb-3 font-medium">Year {year}</p>
            {breakdown.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-dark-400 text-sm">No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={85}
                      dataKey="total" paddingAngle={3}>
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* Category table */}
          <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-dark-900 font-bold text-base mb-4">Breakdown</h3>
            {breakdown.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-dark-400 text-sm">No data for this period</div>
            ) : (
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-dark-700 font-semibold">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-dark-400 font-medium">{item.count} txn{item.count !== 1 ? 's' : ''}</span>
                        <span className="text-dark-900 font-bold">{fmt(item.total)}</span>
                        <span className="text-dark-500 w-10 text-right font-semibold">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-dark-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
