import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, Percent
} from 'lucide-react';
import { reportsApi } from '../api/reports';
import type { CashflowItem, CategoryReportItem } from '../types';
import Button from '../components/ui/Button';

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

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const years = [
    { value: now.getFullYear() - 1, label: String(now.getFullYear() - 1) },
    { value: now.getFullYear(), label: String(now.getFullYear()) },
    { value: now.getFullYear() + 1, label: String(now.getFullYear() + 1) },
  ];

  // Toast Alerts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      showToast('Failed to load report data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (activeTab === 'cashflow') {
      if (cashflow.length === 0) {
        showToast('No cash flow data to export', 'error');
        return;
      }
      headers = ['Period', 'Income (MMK)', 'Expenses (MMK)', 'Net Cash Flow (MMK)', 'Cumulative (MMK)'];
      rows = cashflow.map((item) => [
        item.period,
        item.income,
        item.expense,
        item.net_cashflow,
        item.cumulative,
      ]);
      filename = `cashflow_report_${year}_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (activeTab === 'income') {
      if (incomeBreakdown.length === 0) {
        showToast('No income breakdown data to export', 'error');
        return;
      }
      headers = ['Category Name', 'Total Amount (MMK)', 'Transaction Count', 'Percentage (%)'];
      rows = incomeBreakdown.map((item) => [
        item.name,
        item.total,
        item.count,
        item.percentage,
      ]);
      filename = `income_breakdown_report_${year}_${new Date().toISOString().slice(0, 10)}.csv`;
    } else { // expenses
      if (expenseBreakdown.length === 0) {
        showToast('No expense breakdown data to export', 'error');
        return;
      }
      headers = ['Category Name', 'Total Amount (MMK)', 'Transaction Count', 'Percentage (%)'];
      rows = expenseBreakdown.map((item) => [
        item.name,
        item.total,
        item.count,
        item.percentage,
      ]);
      filename = `expense_breakdown_report_${year}_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report exported successfully!');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'income', label: 'Income Breakdown' },
    { key: 'expenses', label: 'Expense Breakdown' },
  ];

  // Annual Overview Calculations
  const totalIncome = incomeBreakdown.reduce((sum, item) => sum + item.total, 0);
  const totalExpense = expenseBreakdown.reduce((sum, item) => sum + item.total, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const breakdown = activeTab === 'income' ? incomeBreakdown : expenseBreakdown;

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Financial Reports</h1>
          <p className="text-dark-500 mt-1">Deep-dive analysis of your business's income, expenses, and cash flow trends.</p>
        </div>
        
        {/* Filters & Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="secondary"
            size="sm"
            className="text-xs flex items-center gap-1.5"
            title="Export current tab data as a CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-dark-400 ml-2" />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-dark-700 focus:outline-none border-none py-1 px-2 cursor-pointer"
            >
              {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Inline Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold shadow-sm mb-2 ${
              toast.type === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-danger/10 border-danger/20 text-danger'
            }`}>
              <span className="flex items-center gap-2">
                <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
                {toast.message}
              </span>
              <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-65 hover:opacity-100 font-bold">
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annual Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 text-xs font-bold uppercase tracking-wider mb-1">Annual Income ({year})</p>
          <p className="text-dark-900 text-xl font-bold">{fmt(totalIncome)}</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 text-xs font-bold uppercase tracking-wider mb-1">Annual Expenses ({year})</p>
          <p className="text-dark-900 text-xl font-bold">{fmt(totalExpense)}</p>
        </div>

        {/* Net Savings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              netSavings < 0 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-brand-50 text-brand-600 border-brand-100'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 text-xs font-bold uppercase tracking-wider mb-1">Net Savings ({year})</p>
          <p className="text-dark-900 text-xl font-bold">
            {netSavings < 0 ? `-${fmt(Math.abs(netSavings))}` : fmt(netSavings)}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 text-xs font-bold uppercase tracking-wider mb-1">Savings Rate ({year})</p>
          <p className="text-dark-900 text-xl font-bold">
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

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

