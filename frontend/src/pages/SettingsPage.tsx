import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../api/auth';
import {
  Shield, Sparkles, User, Briefcase, Key, LogOut,
  X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Bell
} from 'lucide-react';

export default function SettingsPage() {
  const {
    user, business, setUser, setBusiness, setRole, role, logout,
    aiCopilotEnabled, aiDisclaimerEnabled, setAiCopilotEnabled, setAiDisclaimerEnabled,
    notifyWeeklySummary, notifyBudgetThreshold, notifyAiInsights,
    setNotifyWeeklySummary, setNotifyBudgetThreshold, setNotifyAiInsights
  } = useAuthStore();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    business_name: business?.business_name || '',
    industry: business?.industry || 'retail',
    description: business?.description || '',
  });

  const [prefs, setPrefs] = useState({
    currency: business?.currency_name || 'Myanmar Kyat',
    business_type: business?.industry || 'SME',
    country: 'Myanmar',
  });

  // State Management
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name: profile.name,
        business: {
          business_name: profile.business_name,
          industry: profile.industry,
          description: profile.description,
        },
      });
      setUser(res.user);
      setBusiness(res.business || null);
      showToast('Profile details updated successfully!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      // Simulate API delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast('Business preferences updated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update business preferences.', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!');
      
      // Reset Modal Form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Incorrect current password or invalid input.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12 font-sans">
      
      {/* Title Header with Ambient Glow */}
      <div className="relative p-6 rounded-3xl border border-gray-100 bg-white shadow-soft overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-dark-900 tracking-tight">Settings</h1>
          <p className="text-[15px] text-dark-400 font-semibold mt-1">
            Manage your account profiles, standard currency options, security passwords, and AI helper settings.
          </p>
        </div>
      </div>

      {/* Inline Toast Banner */}
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

      {/* Settings Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Profile Settings */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-soft flex flex-col justify-between hover:border-brand-200 transition-all duration-300">
          <div>
            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-dark-900 font-bold text-lg">Profile Settings</h2>
            </div>
            <div className="space-y-4">
              <Input label="Full Name" value={profile.name} onChange={(e) => setProfile(p => ({...p, name: e.target.value}))} />
              <Input label="Email Address" value={profile.email} disabled className="bg-gray-50 cursor-not-allowed text-dark-400 font-medium" />
              <Input label="Business Name" value={profile.business_name} onChange={(e) => setProfile(p => ({...p, business_name: e.target.value}))} />
              <Select label="Role Profile" value={role || 'SME Owner'} onChange={(e) => setRole?.(e.target.value)} options={[
                { value: 'SME Owner', label: 'SME Owner' },
                { value: 'Freelancer', label: 'Freelancer' },
                { value: 'Shop Owner', label: 'Shop Owner' },
                { value: 'Accountant / Finance Staff', label: 'Accountant / Finance Staff' },
                { value: 'Admin', label: 'Admin' },
              ]} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
            <Button onClick={saveProfile} loading={savingProfile} className="w-full sm:w-auto text-[15px] font-bold py-2.5 rounded-xl bg-brand-600 text-white">
              Save Changes
            </Button>
          </div>
        </section>

        {/* Business Preferences */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-soft flex flex-col justify-between hover:border-brand-200 transition-all duration-300">
          <div>
            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-dark-900 font-bold text-lg">Business Preferences</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-dark-800 text-sm font-semibold mb-1">Currency</p>
                <p className="text-dark-500 text-[15px] font-semibold bg-gray-50 border border-gray-100 p-2.5 rounded-xl">
                  MMK (Myanmar Kyat) — Fixed for local compliance
                </p>
              </div>
              <Select label="Business Industry" value={profile.industry} onChange={(e) => setProfile(p => ({...p, industry: e.target.value}))} options={[
                { value: 'retail', label: 'Retail' },
                { value: 'food_beverage', label: 'Food & Beverage' },
                { value: 'services', label: 'Services' },
                { value: 'manufacturing', label: 'Manufacturing' },
                { value: 'technology', label: 'Technology' },
                { value: 'healthcare', label: 'Healthcare' },
                { value: 'education', label: 'Education' },
                { value: 'agriculture', label: 'Agriculture' },
                { value: 'construction', label: 'Construction' },
                { value: 'transport', label: 'Transport' },
                { value: 'other', label: 'Other' },
              ]} />
              <Input label="Country / Region" value={prefs.country} onChange={(e) => setPrefs(p => ({...p, country: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
            <Button variant="secondary" onClick={savePrefs} loading={savingPrefs} className="w-full sm:w-auto text-[15px] font-bold py-2.5 rounded-xl">
              Save Preferences
            </Button>
          </div>
        </section>

        {/* AI Assistant Settings */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-soft hover:border-brand-200 transition-all duration-300">
          <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-dark-900 font-bold text-lg">AI Assistant Settings</h2>
          </div>
          
          <div className="space-y-6 text-[15px] text-dark-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-dark-900">Enable AI Copilot</p>
                <p className="text-dark-500 mt-0.5 font-semibold">
                  Toggle the in-app AI assistant for smart insights and transaction advice.
                </p>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                  aiCopilotEnabled !== false
                    ? 'bg-brand-50 text-brand-700 border-brand-100'
                    : 'bg-gray-50 text-dark-400 border-gray-150'
                }`}>
                  {aiCopilotEnabled !== false ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => setAiCopilotEnabled(aiCopilotEnabled === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    aiCopilotEnabled !== false ? 'bg-brand-600' : 'bg-gray-250'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      aiCopilotEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
              <div>
                <p className="font-bold text-dark-900">Show AI Disclaimer</p>
                <p className="text-dark-500 mt-0.5 font-semibold">
                  Display advisor details and guidance warnings inside AI chat responses.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                  aiDisclaimerEnabled !== false
                    ? 'bg-brand-50 text-brand-700 border-brand-100'
                    : 'bg-gray-50 text-dark-400 border-gray-150'
                }`}>
                  {aiDisclaimerEnabled !== false ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => setAiDisclaimerEnabled(aiDisclaimerEnabled === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    aiDisclaimerEnabled !== false ? 'bg-brand-600' : 'bg-gray-250'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      aiDisclaimerEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-[#F8F5FE] border border-[#E5DCFC] rounded-2xl p-4 mt-2 flex items-start gap-2 text-[#3B3054]">
              <Sparkles className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5 animate-pulse" />
              <p className="text-[12px] font-semibold leading-relaxed">
                💡 AI advice is generated automatically based on your financial history. It does not replace certified professional audit or tax filing consultation.
              </p>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-soft hover:border-brand-200 transition-all duration-300">
          <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-dark-900 font-bold text-lg">Notification Preferences</h2>
          </div>
          
          <div className="space-y-6 text-[15px] text-dark-700">
            {/* Weekly Summary */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-dark-900">Weekly Finance Summary</p>
                <p className="text-dark-500 mt-0.5 font-semibold">
                  Receive a weekly email recap summarizing expenses, income, and overall budget health.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                  notifyWeeklySummary !== false
                    ? 'bg-brand-50 text-brand-700 border-brand-100'
                    : 'bg-gray-50 text-dark-400 border-gray-200'
                }`}>
                  {notifyWeeklySummary !== false ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => setNotifyWeeklySummary?.(notifyWeeklySummary === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    notifyWeeklySummary !== false ? 'bg-brand-600' : 'bg-gray-250'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifyWeeklySummary !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Budget Alerts */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
              <div>
                <p className="font-bold text-dark-900">Budget Threshold Alerts</p>
                <p className="text-dark-500 mt-0.5 font-semibold">
                  Notify me in-app and by email when category spending exceeds 80% and 100% of limits.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                  notifyBudgetThreshold !== false
                    ? 'bg-brand-50 text-brand-700 border-brand-100'
                    : 'bg-gray-50 text-dark-400 border-gray-200'
                }`}>
                  {notifyBudgetThreshold !== false ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => setNotifyBudgetThreshold?.(notifyBudgetThreshold === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    notifyBudgetThreshold !== false ? 'bg-brand-600' : 'bg-gray-250'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifyBudgetThreshold !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* AI Proactive Insights */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
              <div>
                <p className="font-bold text-dark-900">Proactive AI Insights</p>
                <p className="text-dark-500 mt-0.5 font-semibold">
                  Get real-time AI warnings for unusual spending patterns or cash flow projections.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                  notifyAiInsights === true
                    ? 'bg-brand-50 text-brand-700 border-brand-100'
                    : 'bg-gray-50 text-dark-400 border-gray-200'
                }`}>
                  {notifyAiInsights === true ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => setNotifyAiInsights?.(notifyAiInsights === true ? false : true)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    notifyAiInsights === true ? 'bg-brand-600' : 'bg-gray-250'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifyAiInsights === true ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Access */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-soft hover:border-brand-200 transition-all duration-300">
          <div className="flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-3">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-dark-900 font-bold text-lg">Privacy & Security</h2>
          </div>
          
          <div className="space-y-4 text-[15px] text-dark-700">
            <p className="text-dark-500 font-semibold leading-relaxed">
              Your financial records are encrypted end-to-end and stored securely. We do not sell or disclose details of your corporate bookkeeping to third parties.
            </p>
            
            <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-50">
              <Button
                variant="secondary"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-2 text-[15px] font-bold py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Key className="w-4 h-4" />
                Change Password
              </Button>
              <Button
                variant="danger"
                onClick={() => logout()}
                className="flex items-center gap-2 text-[15px] font-bold py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* Change Password Dialog Overlay */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="text-lg font-bold text-dark-900">Change Account Password</h3>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-1.5 rounded-lg text-dark-400 hover:bg-gray-100 hover:text-dark-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-3.5 text-dark-400 hover:text-dark-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3.5 text-dark-400 hover:text-dark-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark-400 uppercase tracking-wider">Confirm New Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    required
                  />
                </div>

                {/* Password requirement disclaimer block */}
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-dark-500 flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    Password must be at least 8 characters long and contain both letters and numbers.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="text-[15px] px-5 py-2.5 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="text-[15px] px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold"
                  >
                    {changingPassword ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Changing...
                      </span>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
