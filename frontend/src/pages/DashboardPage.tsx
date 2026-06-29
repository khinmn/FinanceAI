import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Percent,
  ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, Brain, ArrowRight,
  Target, PieChart as PieChartIcon, Activity, ArrowLeftRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import type { DashboardSummary, MonthlyChartData, CategoryChartData, Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) => {
  const business = useAuthStore.getState().business;
  const currencyStr = business?.currency || 'MMK';
  if (currencyStr === 'MMK') {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) + ' MMK';
  }
  return currencyStr + ' ' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
};

const fmtAxis = (v: number) => {
  const business = useAuthStore.getState().business;
  const currencyStr = business?.currency || 'MMK';
  const val = v >= 1000 ? `${(v/1000)}k` : v;
  if (currencyStr === 'MMK') {
    return `${val} MMK`;
  }
  return `${currencyStr} ${val}`;
};

function KPICard({
  label, value, change, icon: Icon, color, bg, delay,
}: {
  label: string; value: string; change?: number | null;
  icon: React.ElementType; color: string; bg: string; delay: number;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700/80 p-5 shadow-soft hover:shadow-glass-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {change !== null && change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            isPositive ? 'bg-success/10 text-success dark:bg-success/20 dark:text-success' : 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-dark-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-dark-900 dark:text-white text-2xl font-bold">{value}</p>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 shadow-xl text-sm">
        <p className="text-dark-400 mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-bold flex items-center justify-between gap-4">
            <span>{p.name}</span>
            <span>{fmt(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dummy data for Financial Health Trend
const healthData = [
  { name: 'Jan', score: 65 }, { name: 'Feb', score: 68 }, { name: 'Mar', score: 72 },
  { name: 'Apr', score: 75 }, { name: 'May', score: 80 }, { name: 'Jun', score: 85 }
];

export default function DashboardPage() {
  const { user, business, darkMode } = useAuthStore();
  const navigate = useNavigate();
  const annualSavings = business?.currency === 'MMK' ? '2,500,000 MMK' : '$1,200';
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyChartData[]>([]);
  const [catData, setCatData] = useState<CategoryChartData[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'owner';
  const showHealthScore = ['owner', 'personal', 'accountant'].includes(role);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthLabel, setHealthLabel] = useState<string>('healthy');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, c, r] = await Promise.all([
        dashboardApi.summary(month, year),
        dashboardApi.monthlyChart(6),
        dashboardApi.categoryChart('expense', month, year),
        dashboardApi.recent(4),
      ]);
      setSummary(s);
      setMonthly(m.chart_data);
      setCatData(c.chart_data);
      setRecent(r.transactions);

      if (showHealthScore) {
        try {
          const h = await dashboardApi.healthScore();
          setHealthScore(h.health_score);
          setHealthLabel(h.score_label);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year, showHealthScore]);


  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Good morning, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Here's what's happening with your finances today.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-white hover:bg-softGray dark:hover:bg-dark-700 text-sm font-medium transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Total Income" delay={0}
          value={fmt(summary?.total_income ?? 0)}
          change={summary?.income_change_pct}
          icon={TrendingUp} color="text-success" bg="bg-success/10 dark:bg-success/20"
        />
        <KPICard
          label="Total Expenses" delay={0.1}
          value={fmt(summary?.total_expense ?? 0)}
          change={summary?.expense_change_pct ? -summary.expense_change_pct : null}
          icon={TrendingDown} color="text-danger" bg="bg-danger/10 dark:bg-danger/20"
        />
        <KPICard
          label="Net Balance" delay={0.2}
          value={fmt(summary?.net_balance ?? 0)}
          change={null}
          icon={Wallet} color="text-brand-600 dark:text-brand-400" bg="bg-brand-100 dark:bg-brand-900/30"
        />
        {showHealthScore ? (
          <KPICard
            label="Health Score" delay={0.3}
            value={healthScore !== null ? `${healthScore}/100` : '...'}
            change={null}
            icon={Activity} color="text-purple-500 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-900/30"
          />
        ) : (
          <KPICard
            label="Savings Rate" delay={0.3}
            value={`${summary?.savings_rate ?? 0}%`}
            change={null}
            icon={Percent} color="text-purple-500 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-900/30"
          />
        )}
      </div>


      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-700/80 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-dark-900 dark:text-white font-bold text-lg">Income vs Expenses</h3>
              <p className="text-dark-500 dark:text-dark-400 text-sm">Last 6 months overview</p>
            </div>
            <select className="bg-softGray dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-dark-700 dark:text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400">
              <option>Last 6 months</option>
              <option>This Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#2D3748' : '#E5E7EB'} />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10}
                tickFormatter={fmtAxis} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: darkMode ? '#1A1D24' : '#F3F4F6' }} />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expenses by Category Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-700/80 p-6 shadow-sm flex flex-col"
        >
          <div>
            <h3 className="text-dark-900 dark:text-white font-bold text-lg">Expenses by Category</h3>
            <p className="text-dark-500 dark:text-dark-400 text-sm">This month's breakdown</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center mt-4">
            {catData.length === 0 ? (
              <div className="text-center text-dark-400 dark:text-dark-500 text-sm py-10">No expense data found</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={catData} cx="50%" cy="50%"
                      innerRadius={65} outerRadius={85}
                      dataKey="amount" paddingAngle={4}
                    >
                      {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-4">
                  {catData.slice(0, 3).map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: c.color }} />
                        <span className="text-dark-700 dark:text-dark-300 font-medium truncate max-w-[120px]">{c.name}</span>
                      </div>
                      <span className="text-dark-900 dark:text-white font-bold">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Complex Row: AI Recommendation + Recent Transactions + Health Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-brand-200/50 dark:border-brand-900/40 p-6 shadow-soft flex flex-col bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/20 dark:to-brand-900/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="font-bold text-brand-900 dark:text-brand-300">AI Insights</h3>
          </div>
          <h4 className="text-lg font-bold text-dark-900 dark:text-white mb-2 leading-tight">Your software subscriptions have increased.</h4>
          <p className="text-dark-600 dark:text-dark-300 text-sm mb-6 flex-1">
            We noticed a 15% jump in recurring SaaS expenses. Consider reviewing unused tools to save up to {annualSavings} annually.
          </p>
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all shadow-md shadow-brand-500/30 hover:-translate-y-0.5"
          >
            Review Subscriptions
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-700/80 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-dark-900 dark:text-white font-bold text-lg">Recent Transactions</h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:text-brand-500 dark:hover:text-brand-350 transition-colors"
            >
              View All
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-dark-400 dark:text-dark-500 text-sm">No recent transactions.</div>
          ) : (
            <div className="space-y-4">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tx.category_color + '15' }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tx.category_color }} />
                    </div>
                    <div>
                      <p className="text-dark-900 dark:text-white font-bold text-sm">{tx.description}</p>
                      <p className="text-dark-500 dark:text-dark-400 text-xs mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-success' : 'text-dark-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </p>
                    <p className="text-dark-400 dark:text-dark-500 text-xs mt-0.5">{tx.category_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Financial Health Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => navigate('/gap-analysis')}
          className="rounded-2xl border border-brand-900/50 p-6 shadow-xl relative overflow-hidden cursor-pointer hover:border-brand-500/80 transition-all duration-300 group"
          style={{ background: 'linear-gradient(135deg, #0F1115 0%, #1A1328 100%)' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/30 blur-3xl rounded-full" />
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-1 group-hover:text-brand-300 transition-colors">Financial Health Trend</h3>
            <p className="text-dark-400 text-sm mb-6">+12% improvement this quarter</p>
            
            <div className="h-32 mb-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-between border-t border-dark-800 pt-4">
              <div className="text-white text-2xl font-bold">{healthScore !== null ? healthScore : '85'}<span className="text-dark-500 text-sm font-normal">/100</span></div>
              <div className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-bold border border-success/30 capitalize">{healthLabel}</div>
            </div>
          </div>
        </motion.div>


      </div>

      {/* Mini Panels Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { title: 'Transactions', icon: ArrowLeftRight, desc: 'View all history', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', path: '/transactions' },
          { title: 'Budget Overview', icon: PieChartIcon, desc: 'Track spending limits', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', path: '/budget' },
          { title: 'AI Assistant', icon: Brain, desc: 'Ask financial queries', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', path: '/ai-assistant' },
          { title: 'Gap Analysis', icon: Target, desc: 'Find growth opportunities', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', path: '/gap-analysis' }
        ].map((panel, i) => (
          <div
            key={i}
            onClick={() => navigate(panel.path)}
            className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700/80 p-4 hover:border-brand-300 dark:hover:border-brand-50 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-lg ${panel.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <panel.icon className={`w-5 h-5 ${panel.color}`} />
            </div>
            <h4 className="font-bold text-dark-900 dark:text-white text-sm">{panel.title}</h4>
            <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">{panel.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
