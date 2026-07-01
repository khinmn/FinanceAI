import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Edit2, Trash2,
  Calendar, CheckCircle, AlertTriangle, Info, Sparkles
} from 'lucide-react';
import { budgetsApi } from '../api/budgets';
import { categoriesApi } from '../api/categories';
import type { BudgetSummaryItem, Category } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';


const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) + ' MMK';

export default function BudgetPage() {
  const { user } = useAuthStore();
  const role = user?.role || 'owner';
  const canManageBudget = ['owner', 'personal'].includes(role);
  const canUseAiCoach = ['owner', 'personal', 'accountant'].includes(role);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  
  const [summary, setSummary] = useState<BudgetSummaryItem[]>([]);
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  
  // Set Budget Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy budgets State
  const [copyLoading, setCopyLoading] = useState(false);

  // AI Coach State
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [aiCoachInsights, setAiCoachInsights] = useState('');
  const [aiCoachLoading, setAiCoachLoading] = useState(false);

  // Toast Alerts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetsApi.summary(month, year);
      setSummary(res.summary);
      setTotalBudgeted(res.total_budgeted);
      setTotalSpent(res.total_spent);
      
      const catsRes = await categoriesApi.list();
      setCategories(catsRes.categories.filter(c => c.type === 'expense'));
    } catch (e) {
      console.error(e);
      showToast('Failed to load budget summaries.', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenSetBudget = (item?: BudgetSummaryItem) => {
    setFormError('');
    if (item) {
      setSelectedCatId(item.category_id);
      setAmount(item.budget_amount > 0 ? String(item.budget_amount) : '');
    } else {
      setSelectedCatId('');
      setAmount('');
    }
    setModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !amount) {
      setFormError('Please fill in all fields.');
      return;
    }
    setFormError('');
    setFormLoading(true);
    try {
      await budgetsApi.create({
        category_id: Number(selectedCatId),
        amount: parseFloat(amount),
        month,
        year
      });
      setModalOpen(false);
      showToast('Budget saved successfully!');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save budget.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await budgetsApi.delete(deleteId);
      setDeleteId(null);
      showToast('Budget deleted successfully.');
      loadData();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete budget.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyPrevious = async () => {
    setCopyLoading(true);
    try {
      const res = await budgetsApi.copyPrevious(month, year);
      showToast(res.message);
      loadData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to copy budgets from last month.', 'error');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleToggleAiCoach = async () => {
    if (aiCoachOpen) {
      setAiCoachOpen(false);
      return;
    }
    
    setAiCoachOpen(true);
    setAiCoachLoading(true);
    try {
      const res = await budgetsApi.getAiCoach(month, year);
      setAiCoachInsights(res.insights);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to generate AI coaching suggestions.', 'error');
    } finally {
      setAiCoachLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const cleanedText = text
      .replace(/\n?\s*_AI service note:[\s\S]*?_\s*$/i, '')
      .replace(/(^|\n)\s*[-*•]\s*(?=\n|$)/g, '$1')
      .replace(/(^|\n)_([^_\n].*?)_(?=\n|$)/g, '$1$2')
      .replace(/([^\n])\s+(?=(\d+)\.\s+(?:\*\*|[A-Z]))/g, '$1\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const blocks = cleanedText.split(/\n\n+/);

    const parseInlineStyles = (rawText: string) => {
      const parts = rawText.split(/\*\*([^*]+)\*\*/g);
      if (parts.length === 1) return rawText;
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} className="font-bold text-[#2D1A54] dark:text-brand-300 bg-[#EFE6FD] dark:bg-brand-950/40 px-1 rounded text-sm">{part}</strong>;
        }
        return part;
      });
    };

    return blocks.map((block, bIdx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // Headers
      if (trimmedBlock.startsWith('# ')) {
        return (
          <h3 key={bIdx} className="text-sm font-extrabold text-[#2D1A54] dark:text-white mt-4 mb-2 first:mt-0 border-b border-[#E5DCFC] dark:border-dark-700 pb-1">
            {parseInlineStyles(trimmedBlock.slice(2))}
          </h3>
        );
      }
      if (trimmedBlock.startsWith('## ')) {
        return (
          <h4 key={bIdx} className="text-sm font-extrabold text-[#5B39A8] dark:text-brand-300 mt-4 mb-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(3))}
          </h4>
        );
      }
      if (trimmedBlock.startsWith('### ')) {
        return (
          <h5 key={bIdx} className="text-sm font-bold text-[#7C3AED] dark:text-brand-400 mt-3 mb-1">
            {parseInlineStyles(trimmedBlock.slice(4))}
          </h5>
        );
      }

      // Check if block represents a list
      const lines = trimmedBlock.split('\n');
      const isListBlock = lines.some(line => {
        const tLine = line.trim();
        return tLine.match(/^[-*]\s+/) || tLine.match(/^\*\*[-*]\s*/) || tLine.match(/^(\d+)\.\s+/) || tLine.match(/^\*\*(\d+)\.\s*/);
      });

      if (isListBlock) {
        return (
          <div key={bIdx} className="space-y-1.5 my-1.5">
            {lines.map((line, lIdx) => {
              const trimmedLine = line.trim();
              
              // Bullet lists
              let isBullet = false;
              let bulletRestText = '';
              const matchNormalBullet = trimmedLine.match(/^[-*]\s+(.*)/);
              const matchBoldBullet = trimmedLine.match(/^\*\*[-*]\s*(.*)/);

              if (matchBoldBullet) {
                isBullet = true;
                bulletRestText = matchBoldBullet[1].includes('**') ? '**' + matchBoldBullet[1] : matchBoldBullet[1];
              } else if (matchNormalBullet) {
                isBullet = true;
                bulletRestText = matchNormalBullet[1];
              }

              if (isBullet) {
                if (!bulletRestText.trim()) return null;
                return (
                  <div key={lIdx} className="flex gap-1 text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed items-start pl-6">
                    <span className="flex-shrink-0 w-6 flex justify-end items-center pr-2 h-5 text-sm text-[#3B3054] dark:text-dark-300 select-none font-bold">•</span>
                    <span className="flex-1">{parseInlineStyles(bulletRestText)}</span>
                  </div>
                );
              }

              // Numbered lists
              let isNumbered = false;
              let numLabel = '';
              let numRestText = '';
              const matchNormalNum = trimmedLine.match(/^(\d+)\.\s+(.*)/);
              const matchBoldStartNum = trimmedLine.match(/^\*\*(\d+)\.\s*(.*)/);
              const matchBoldBothNum = trimmedLine.match(/^\*\*(\d+)\.\*\*\s*(.*)/);

              if (matchBoldBothNum) {
                isNumbered = true;
                numLabel = `${matchBoldBothNum[1]}.`;
                numRestText = matchBoldBothNum[2];
              } else if (matchBoldStartNum) {
                isNumbered = true;
                numLabel = `${matchBoldStartNum[1]}.`;
                numRestText = matchBoldStartNum[2].includes('**') ? '**' + matchBoldStartNum[2] : matchBoldStartNum[2];
              } else if (matchNormalNum) {
                isNumbered = true;
                numLabel = `${matchNormalNum[1]}.`;
                numRestText = matchNormalNum[2];
              }

              if (isNumbered) {
                if (!numRestText.trim()) return null;
                return (
                  <div key={lIdx} className="flex gap-1 text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed items-start pl-6">
                    <span className="flex-shrink-0 w-6 flex justify-end items-center pr-2 h-5 text-sm text-[#3B3054] dark:text-dark-300 select-none font-bold">{numLabel}</span>
                    <span className="flex-1">{parseInlineStyles(numRestText)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed pl-6">
                  {parseInlineStyles(trimmedLine)}
                </p>
              );
            })}
          </div>
        );
      }

      // Standard paragraph - merge single-line hard breaks
      const mergedText = lines.map(line => line.trim()).join(' ');

      return (
        <p key={bIdx} className="text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed my-1.5">
          {parseInlineStyles(mergedText)}
        </p>
      );
    });
  };

  const remainingBalance = totalBudgeted - totalSpent;
  const isOverallExceeded = totalSpent > totalBudgeted && totalBudgeted > 0;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [
    { value: now.getFullYear() - 1, label: String(now.getFullYear() - 1) },
    { value: now.getFullYear(), label: String(now.getFullYear()) },
    { value: now.getFullYear() + 1, label: String(now.getFullYear() + 1) },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Budget Planner</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Set monthly limits for category spending and track compliance.</p>
        </div>
        
        {/* Date Selectors & Copy Last Month's Budget */}
        <div className="flex flex-wrap items-center gap-3">
          {canManageBudget && (
            <Button
              onClick={handleCopyPrevious}
              variant="secondary"
              size="sm"
              loading={copyLoading}
              className="text-xs flex items-center gap-1.5"
              title="Auto-fill budgets from the previous month"
            >
              Copy Last Month's Budgets
            </Button>
          )}


          <div className="flex items-center gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-dark-400 ml-2" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-dark-700 dark:text-dark-300 focus:outline-none border-none py-1 px-2 cursor-pointer"
            >
              {months.map(m => <option key={m.value} value={m.value} className="bg-white dark:bg-dark-800">{m.label}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-dark-700 dark:text-dark-300 focus:outline-none border-none py-1 px-2 cursor-pointer"
            >
              {years.map(y => <option key={y.value} value={y.value} className="bg-white dark:bg-dark-800">{y.label}</option>)}
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

      {/* Status Warning Banner */}
      {isOverallExceeded && (
        <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-sm font-semibold shadow-soft animate-pulse">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span>Alert: Total monthly expenses have exceeded your budgeted limit! Consider pausing non-essential transactions.</span>
        </div>
      )}

      {/* AI Budget Coach Insights */}
      <div className="bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 rounded-2xl p-5 text-dark-900 dark:text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-dark-900 dark:text-white text-base leading-tight">AI Budget Coach</h3>
                <p className="text-xs text-dark-500 dark:text-dark-400 font-semibold mt-0.5">Automated rule analysis and spending advice</p>
              </div>
            </div>
            {canUseAiCoach && (
              <button
                onClick={handleToggleAiCoach}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 bg-white dark:bg-dark-800 transition-all shadow-sm flex items-center gap-1.5"
              >
                {aiCoachOpen ? 'Hide Insights' : 'Get Budget Analysis'}
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {aiCoachOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-brand-200/50 dark:border-brand-800/50 overflow-hidden"
              >
                {aiCoachLoading ? (
                  <div className="flex items-center gap-2.5 py-4 text-dark-600 dark:text-dark-300">
                    <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                    <span className="text-sm font-semibold">Analyzing budget limits and current expenses...</span>
                  </div>
                ) : aiCoachInsights ? (
                  <div className="max-w-none text-dark-800 dark:text-dark-200 leading-relaxed font-sans space-y-3">
                    {renderMarkdown(aiCoachInsights)}
                  </div>
                ) : (
                  <p className="text-sm text-dark-500 dark:text-dark-400 font-medium">No insights generated yet. Click analyze to evaluate your spending rules.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Budgeted */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700/80 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-900/30 text-brand-600 border border-brand-100 dark:border-brand-800">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider mb-1">Total Budgeted</p>
          <p className="text-dark-900 dark:text-white text-xl font-bold">{fmt(totalBudgeted)}</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700/80 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isOverallExceeded ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'
            }`}>
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider mb-1">Total Spent</p>
          <p className="text-dark-900 dark:text-white text-xl font-bold">{fmt(totalSpent)}</p>
        </div>

        {/* Remaining */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700/80 p-5 shadow-soft">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              remainingBalance < 0 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border-purple-200 dark:border-purple-800'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-dark-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider mb-1">Remaining Balance</p>
          <p className="text-dark-900 dark:text-white text-xl font-bold">
            {remainingBalance < 0 ? `-${fmt(Math.abs(remainingBalance))}` : fmt(remainingBalance)}
          </p>
        </div>
      </div>

      {/* Categories Budgets section */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-soft">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-dark-900 dark:text-white font-bold text-lg">Category Spent vs. Budget</h2>
            <p className="text-dark-500 dark:text-dark-400 text-sm">Monthly breakdowns and progress meters.</p>
          </div>
          {canManageBudget && (
            <Button onClick={() => handleOpenSetBudget()} size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Set Budget
            </Button>
          )}
        </div>


        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-400/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : summary.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-dark-400 text-sm">No categories available. Please seed default categories in settings.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {summary.map((item) => {
              const hasBudget = item.budget_amount > 0;
              const ratio = hasBudget ? (item.actual_spent / item.budget_amount) * 100 : 0;
              const formattedRatio = ratio > 100 ? '100%' : `${ratio.toFixed(0)}%`;
              const isExceeded = item.is_exceeded;
              
              return (
                <div key={item.category_id} className="p-4 bg-gray-50/50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-700 rounded-2xl hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-300 group">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ background: item.category_color }} />
                      <div>
                        <h4 className="font-bold text-dark-800 dark:text-white text-sm">{item.category_name}</h4>
                        {!hasBudget && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-dark-400 font-semibold mt-0.5">
                            <Info className="w-3 h-3" /> No budget limit configured
                          </span>
                        )}
                        {hasBudget && isExceeded && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-danger/10 text-danger text-[10px] font-bold mt-1">
                            <AlertTriangle className="w-3 h-3" /> Over Budget
                          </span>
                        )}
                        {hasBudget && !isExceeded && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-bold mt-1">
                            <CheckCircle className="w-3 h-3" /> Within Limit
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="text-right">
                        <p className="text-xs text-dark-500 dark:text-dark-400 font-semibold">
                          <span className="text-dark-800 dark:text-white font-extrabold">{fmt(item.actual_spent)}</span>
                          {hasBudget ? ` of ${fmt(item.budget_amount)}` : ' spent'}
                        </p>
                        {hasBudget && (
                          <p className="text-[10px] text-dark-400 font-bold mt-0.5">{ratio.toFixed(0)}% used</p>
                        )}
                      </div>

                      {canManageBudget && (
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleOpenSetBudget(item)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-brand-600 hover:bg-brand-50"
                            title="Configure Budget"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {item.budget_id && (
                            <button
                              onClick={() => setDeleteId(item.budget_id)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-danger hover:bg-danger/10"
                              title="Delete Budget"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {hasBudget && (
                    <div className="h-2 w-full bg-gray-200/60 dark:bg-dark-600/60 rounded-full overflow-hidden relative shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: formattedRatio }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          isExceeded 
                            ? 'bg-gradient-to-r from-danger to-rose-600' 
                            : ratio > 80 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600' 
                              : 'bg-gradient-to-r from-brand-500 to-brand-600'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Configure Budget Limit">
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {formError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium">
              {formError}
            </div>
          )}

          <Select
            label="Category"
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: 'Choose expense category' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
            required
          />

          <Input
            label={`Budget Amount (K) for ${months.find(m => m.value === month)?.label} ${year}`}
            type="number"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
          />

          {(() => {
            const item = summary.find(s => s.category_id === Number(selectedCatId));
            if (item && amount && parseFloat(amount) < item.actual_spent) {
              return (
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 p-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>Warning: Budget limit is less than your actual spent amount ({fmt(item.actual_spent)}) for this category.</span>
                </p>
              );
            }
            return null;
          })()}

          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 flex gap-2.5 items-start text-brand-800 text-xs">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-brand-500 mt-0.5" />
            <p className="leading-relaxed">
              Configuring a budget limit notifies you immediately in the Transactions log when spending exceeds this category threshold.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} className="flex-1">
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Budget Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Budget Limit" maxWidth="max-w-sm">
        <p className="text-dark-600 text-sm mb-5">
          Are you sure you want to delete this budget configuration? Spending alerts will be disabled for this category.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteLoading} className="flex-1" onClick={handleDeleteBudget}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
