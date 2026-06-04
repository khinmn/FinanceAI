import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import type { DashboardSummary, MonthlyChartData, CategoryChartData, Transaction } from '../types';
import { useAuthStore } from '../store/authStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) + ' MMK';

function KPICard({
  label, value, change, icon: Icon, color, delay,
}: {
  label: string; value: string; change?: number | null;
  icon: React.ElementType; color: string; delay: number;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== null && change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            isPositive ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#DC2626]/10 text-[#DC2626]'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-slate-600 text-xs font-medium mb-1">{label}</p>
      <p className="text-slate-900 text-xl font-bold">{value}</p>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow text-sm">
        <p className="text-slate-600 mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { business } = useAuthStore();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyChartData[]>([]);
  const [catData, setCatData] = useState<CategoryChartData[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, c, r] = await Promise.all([
        dashboardApi.summary(month, year),
        dashboardApi.monthlyChart(6),
        dashboardApi.categoryChart('expense', month, year),
        dashboardApi.recent(5),
      ]);
      setSummary(s);
      setMonthly(m.chart_data);
      setCatData(c.chart_data);
      setRecent(r.transactions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      {/* Period header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm">
            {monthName} {year} · {business?.business_name}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Income" delay={0}
          value={fmt(summary?.total_income ?? 0)}
          change={summary?.income_change_pct}
          icon={TrendingUp}
          color="bg-[#16A34A]"
        />
        <KPICard
          label="Total Expenses" delay={0.05}
          value={fmt(summary?.total_expense ?? 0)}
          change={summary?.expense_change_pct ? -summary.expense_change_pct : null}
          icon={TrendingDown}
          color="bg-[#DC2626]"
        />
        <KPICard
          label="Net Balance" delay={0.1}
          value={fmt(summary?.net_balance ?? 0)}
          change={null}
          icon={DollarSign}
          color={(summary?.net_balance ?? 0) >= 0 ? 'bg-[#2563EB]' : 'bg-[#f97316]'}
        />
        <KPICard
          label="Financial Health" delay={0.15}
          value={`${summary?.savings_rate ?? 0}%`}
          change={null}
          icon={Percent}
          color="bg-[#2563EB]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5"
        >
          <h3 className="text-slate-900 font-semibold text-sm mb-1">Income vs Expenses</h3>
          <p className="text-slate-500 text-xs mb-5">Last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v).toLocaleString()} MMK`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 p-5"
        >
          <h3 className="text-slate-900 font-semibold text-sm mb-1">Expense Breakdown</h3>
          <p className="text-slate-500 text-xs mb-3">By category this month</p>
          {catData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No expense data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="amount"
                  paddingAngle={2}
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {catData.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-slate-600 truncate max-w-[140px]">{c.name}</span>
                </div>
                <span className="text-slate-700 font-medium">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 p-5"
      >
        <h3 className="text-slate-900 font-semibold text-sm mb-4">Recent Transactions</h3>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No transactions yet. Add your first one!
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: tx.category_color + '20', border: `1px solid ${tx.category_color}40` }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full" style={{ background: tx.category_color }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-slate-500 text-xs">{tx.category_name} · {tx.date}</p>
                </div>
                <p className={`text-sm font-semibold flex-shrink-0 ${
                  tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
