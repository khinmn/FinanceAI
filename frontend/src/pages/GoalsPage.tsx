import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Trash2, Edit2, Brain, Sparkles, Calendar, TrendingUp,
  AlertCircle, X, DollarSign, Loader2, ArrowRight, Coins
} from 'lucide-react';
import { goalsApi } from '../api/goals';
import type { Goal } from '../types';
import Button from '../components/ui/Button';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals / Overlays
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // AI Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeGoalForAI, setActiveGoalForAI] = useState<Goal | null>(null);
  const [aiProjection, setAiProjection] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlySavings, setMonthlySavings] = useState('');

  // Quick Add Savings Field
  const [quickAddId, setQuickAddId] = useState<number | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState('');

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await goalsApi.getGoals();
      setGoals(res.goals);
    } catch (err) {
      console.error(err);
      showToast('Failed to load savings goals.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open modal to add goal
  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setMonthlySavings('');
    setIsModalOpen(true);
  };

  // Open modal to edit goal
  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount));
    setTargetDate(goal.target_date);
    setMonthlySavings(String(goal.monthly_savings));
    setIsModalOpen(true);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || !targetDate) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const tAmt = parseFloat(targetAmount);
    const cAmt = parseFloat(currentAmount || '0');
    const mSav = parseFloat(monthlySavings || '0');

    if (isNaN(tAmt) || tAmt <= 0) {
      showToast('Target amount must be a positive number.', 'error');
      return;
    }
    if (isNaN(cAmt) || cAmt < 0) {
      showToast('Current amount must be non-negative.', 'error');
      return;
    }
    if (isNaN(mSav) || mSav < 0) {
      showToast('Monthly savings must be non-negative.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingGoal) {
        // Edit Goal
        const res = await goalsApi.updateGoal(editingGoal.id, {
          name,
          target_amount: tAmt,
          current_amount: cAmt,
          target_date: targetDate,
          monthly_savings: mSav,
        });
        showToast('Savings goal updated successfully.');
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? res.goal : g));
      } else {
        // Add Goal
        const res = await goalsApi.createGoal({
          name,
          target_amount: tAmt,
          current_amount: cAmt,
          target_date: targetDate,
          monthly_savings: mSav,
        });
        showToast('Savings goal created successfully.');
        setGoals(prev => [res.goal, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save goals.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Goal
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await goalsApi.deleteGoal(id);
      showToast('Savings goal deleted.');
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
      showToast('Failed to delete savings goal.', 'error');
    }
  };

  // Quick Add Savings
  const handleQuickAddSavings = async (goal: Goal) => {
    const amountToAdd = parseFloat(quickAddAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }

    const newCurrent = Number(goal.current_amount) + amountToAdd;

    try {
      const res = await goalsApi.updateGoal(goal.id, {
        current_amount: newCurrent,
      });
      showToast(`Added K ${amountToAdd.toLocaleString()} to ${goal.name}!`);
      setGoals(prev => prev.map(g => g.id === goal.id ? res.goal : g));
      setQuickAddId(null);
      setQuickAddAmount('');
    } catch (err) {
      console.error(err);
      showToast('Failed to add savings.', 'error');
    }
  };

  // Trigger AI projection
  const handleGetAiProjection = async (goal: Goal) => {
    setActiveGoalForAI(goal);
    setAiProjection(null);
    setAiLoading(true);
    setIsDrawerOpen(true);

    try {
      const res = await goalsApi.getGoalProjection(goal.id);
      setAiProjection(res.projection);
    } catch (err: any) {
      console.error(err);
      setAiProjection('⚠️ Failed to generate AI savings plan. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Custom block-based Markdown parser matching AI Assistant design standards
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
          return <strong key={index} className="font-bold text-[#2D1A54] dark:text-brand-300 bg-[#EFE6FD] dark:bg-brand-950/40 px-1 rounded">{part}</strong>;
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
          <h3 key={bIdx} className="text-[15px] font-extrabold text-[#2D1A54] dark:text-white border-b border-[#E5DCFC] dark:border-dark-700 pb-2 mt-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(2))}
          </h3>
        );
      }
      if (trimmedBlock.startsWith('## ')) {
        return (
          <h4 key={bIdx} className="text-[15px] font-extrabold text-[#5B39A8] dark:text-brand-300 mt-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(3))}
          </h4>
        );
      }
      if (trimmedBlock.startsWith('### ')) {
        return (
          <h5 key={bIdx} className="text-[15px] font-bold text-[#7C3AED] dark:text-brand-400 mt-2 first:mt-0">
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
          <div key={bIdx} className="space-y-2">
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
                  <div key={lIdx} className="flex gap-1 text-[15px] text-[#3B3054] dark:text-dark-300 leading-relaxed items-start pl-4">
                    <span className="flex-shrink-0 w-7 flex justify-end items-center pr-2 h-6 text-[15px] text-[#3B3054] dark:text-dark-300 select-none font-bold">•</span>
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
                  <div key={lIdx} className="flex gap-1 text-[15px] text-[#3B3054] dark:text-dark-300 leading-relaxed items-start pl-4">
                    <span className="flex-shrink-0 w-7 flex justify-end items-center pr-2 h-6 text-[15px] text-[#3B3054] dark:text-dark-300 select-none font-bold">{numLabel}</span>
                    <span className="flex-1">{parseInlineStyles(numRestText)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-[15px] text-[#3B3054] dark:text-dark-300 leading-relaxed pl-4">
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
        <p key={bIdx} className="text-[15px] text-[#3B3054] dark:text-dark-300 leading-relaxed">
          {parseInlineStyles(mergedText)}
        </p>
      );
    });
  };

  // Metrics calculation
  const totalGoals = goals.length;
  const totalTargetAmt = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalCurrentAmt = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalMonthlySavings = goals.reduce((sum, g) => sum + Number(g.monthly_savings), 0);
  const overallPercentage = totalTargetAmt > 0 ? Math.round((totalCurrentAmt / totalTargetAmt) * 100) : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section with ambient glow */}
      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-700/50 bg-white dark:bg-dark-800 shadow-soft">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-black text-dark-900 dark:text-white tracking-tight">Savings Goals</h1>
            <p className="text-[15px] text-dark-400 dark:text-dark-400 font-semibold mt-1">
              Define your business savings milestones, track balances, and use AI projection narratives to reach them.
            </p>
          </div>
          <div>
            <Button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 text-[15px] shadow-sm py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              <Plus className="w-5 h-5" />
              Add Savings Goal
            </Button>
          </div>
        </div>

        {/* Dashboard Progress Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-dark-700">
          
          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center text-brand-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Active Goals</p>
              <h3 className="text-xl font-black text-dark-900 dark:text-white mt-0.5">{totalGoals}</h3>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Total Saved Progress</p>
              <h3 className="text-xl font-black text-dark-900 dark:text-white mt-0.5">K {totalCurrentAmt.toLocaleString()}</h3>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Monthly Savings Rate</p>
              <h3 className="text-xl font-black text-dark-900 dark:text-white mt-0.5">K {totalMonthlySavings.toLocaleString()}</h3>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Overall Progress</p>
              <span className="text-[12px] font-black text-brand-600 dark:text-brand-400">{overallPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
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
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-[15px] font-semibold shadow-sm mb-2 ${
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

      {/* Loading state / Goals Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700/50 shadow-soft">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <span className="text-[15px] text-dark-400 dark:text-dark-400 font-semibold">Loading your savings goals...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700/50 shadow-soft text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center text-brand-500">
            <Target className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">No Saving Goals Defined</h3>
            <p className="text-[15px] text-dark-400 dark:text-dark-450 font-semibold max-w-sm mx-auto">
              Setting savings goals is the first step towards sound business health. Define your targets to track and build AI forecasts.
            </p>
          </div>
          <Button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 text-[15px] shadow-sm py-2 bg-brand-600 text-white font-bold"
          >
            <Plus className="w-4 h-4" />
            Define a Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const current = Number(g.current_amount);
            const target = Number(g.target_amount);
            const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
            const remaining = Math.max(target - current, 0);

            // calculate months till target date
            let monthsStr = '';
            if (g.target_date) {
              const diffMs = new Date(g.target_date).getTime() - new Date().getTime();
              const diffMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.4));
              monthsStr = diffMonths > 0 ? `${diffMonths} months remaining` : 'Target date passed';
            }

            return (
              <motion.div
                layout
                key={g.id}
                className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700/50 hover:border-brand-200 dark:hover:border-brand-700 shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#EDE5FC] dark:bg-brand-950/40 text-[#7C3AED] dark:text-brand-400 border border-[#E5DCFC] dark:border-brand-900/50 flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-dark-900 dark:text-white text-[15px] leading-snug">{g.name}</h4>
                        <span className="text-[12px] text-dark-400 dark:text-dark-400 font-bold flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          By {new Date(g.target_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(g)}
                        className="p-1.5 rounded-lg text-dark-400 dark:text-dark-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-dark-700 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-lg text-dark-400 dark:text-dark-500 hover:text-danger dark:hover:text-rose-400 hover:bg-danger/10 dark:hover:bg-rose-950/20 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-bold text-dark-400 dark:text-dark-400 mb-1.5">
                        <span className="uppercase tracking-wider">Progress</span>
                        <span className="text-brand-600 dark:text-brand-400 font-black">{pct}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[12px] font-bold text-dark-400 dark:text-dark-450">
                        <span>K {current.toLocaleString()} saved</span>
                        <span>Goal: K {target.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Meta info fields */}
                    <div className="pt-4 border-t border-gray-50 dark:border-dark-700 space-y-2">
                      <div className="flex justify-between items-center text-[12px] font-bold text-dark-400 dark:text-dark-450">
                        <span>Remaining:</span>
                        <span className="text-dark-900 dark:text-white font-extrabold">K {remaining.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] font-bold text-dark-400 dark:text-dark-450">
                        <span>Savings Rate:</span>
                        <span className="text-dark-900 dark:text-white font-extrabold">K {Number(g.monthly_savings).toLocaleString()} / month</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] font-bold text-dark-400 dark:text-dark-450">
                        <span>Timeline:</span>
                        <span className="text-brand-600 dark:text-brand-400 font-black">{monthsStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-dark-700 flex flex-col gap-2">
                  
                  {quickAddId === g.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={quickAddAmount}
                        onChange={(e) => setQuickAddAmount(e.target.value)}
                        placeholder="Amt (K)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-xs font-semibold text-dark-800 dark:text-white placeholder:text-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500/40"
                      />
                      <button
                        onClick={() => handleQuickAddSavings(g)}
                        className="px-3 py-1.5 bg-success text-white text-xs font-bold rounded-lg hover:bg-success/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setQuickAddId(null)}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-dark-500 dark:text-dark-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setQuickAddId(g.id); setQuickAddAmount(''); }}
                      className="w-full py-2 border border-gray-200 dark:border-dark-750 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Coins className="w-4 h-4" />
                      Add Savings
                    </button>
                  )}

                  <button
                    onClick={() => handleGetAiProjection(g)}
                    className="w-full py-2.5 bg-[#EDE5FC] dark:bg-brand-950/30 text-[#7C3AED] dark:text-brand-400 hover:bg-[#E5DCFC] dark:hover:bg-brand-900/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-[#E5DCFC] dark:border-brand-900/30"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Get AI Savings Plan
                  </button>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-dark-700 pb-4">
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">
                  {editingGoal ? 'Edit Savings Goal' : 'Add New Savings Goal'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-dark-400 dark:text-dark-500 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-dark-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Goal Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Purchase Delivery Truck"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Target Amount * (K)</label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="e.g. 15000000"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Current Saved (K)</label>
                    <input
                      type="number"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="e.g. 5000000"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Target Date *</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Monthly savings (K)</label>
                    <input
                      type="number"
                      value={monthlySavings}
                      onChange={(e) => setMonthlySavings(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    className="text-[15px] px-5 py-2.5 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="text-[15px] px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Goal'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Savings Plan Side-Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-dark-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white dark:bg-dark-800 h-full shadow-2xl flex flex-col z-10 border-l border-gray-100 dark:border-dark-700 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between bg-white dark:bg-dark-800 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE5FC] dark:bg-brand-950/40 text-[#7C3AED] dark:text-brand-400 border border-[#E5DCFC] dark:border-brand-900/50 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark-900 dark:text-white text-lg">AI Savings Plan</h3>
                    <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold mt-0.5">Custom projection for: {activeGoalForAI?.name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-dark-400 dark:text-dark-500 hover:bg-gray-150 dark:hover:bg-dark-700 hover:text-dark-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/20 dark:bg-dark-900/20">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                    <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                    <span className="text-[15px] text-dark-400 dark:text-dark-400 font-semibold">Analyzing savings metrics and projecting data...</span>
                  </div>
                ) : aiProjection ? (
                  <div className="bg-[#F8F5FE] dark:bg-dark-900/40 border border-[#E5DCFC] dark:border-dark-700 p-6 md:p-8 rounded-3xl text-[15px] dark:text-dark-300 leading-relaxed shadow-sm font-sans space-y-4">
                    {renderMarkdown(aiProjection)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-dark-400 dark:text-dark-500">
                    <AlertCircle className="w-12 h-12 text-warning mb-2" />
                    <span className="text-[15px] font-semibold">No projection generated.</span>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-end relative z-10">
                <Button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-[15px] px-5 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Close Plan
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
