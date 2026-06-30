import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, ArrowLeft, User, Building2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

const INDUSTRIES = [
  { value: 'retail', label: 'Retail' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'services', label: 'Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'transport', label: 'Transport & Delivery' },
  { value: 'other', label: 'Other' },
];

// Role options for self-registration (team members are invited separately)
const ACCOUNT_TYPES = [
  {
    value: 'owner',
    label: 'SME Owner',
    description: 'Business owner with full access to all features',
    icon: Building2,
  },
  {
    value: 'personal',
    label: 'Personal User',
    description: 'Solo individual tracking personal finances',
    icon: User,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    industry: 'retail',
    role: 'owner',          // ← actual backend role value
    description: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const setField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,             // ← send role to backend
        business_name: form.business_name || form.name + "'s Workspace",
        industry: form.industry,
        description: form.description,
      });
      // Always use the role returned from backend — never the UI string
      login(res.user, res.business, res.access_token, res.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.value === form.role) || ACCOUNT_TYPES[0];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FDFDFD] dark:bg-dark-900 transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-400/20 dark:bg-brand-500/10 blur-[120px] pointer-events-none animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-400/15 dark:bg-brand-500/5 blur-[100px] pointer-events-none animate-blob-reverse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-dark-500 hover:text-brand-600 dark:text-dark-400 dark:hover:text-brand-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="FinanceAI" className="w-16 h-16 mb-5 drop-shadow-xl" />
          <h1 className="text-dark-900 dark:text-white text-3xl font-extrabold tracking-tight">Create your account</h1>
          <p className="text-dark-500 dark:text-dark-300 text-sm mt-2 font-medium">
            {step === 1 ? 'Step 1 of 2 — Personal details' : 'Step 2 of 2 — Workspace profile'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-dark-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/80 dark:border-dark-700/50 rounded-3xl p-8 shadow-soft">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 mb-5 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleStep1}
                className="space-y-4"
              >
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                />

                {/* Account Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-dark-700 dark:text-dark-300 block mb-2">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ACCOUNT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = form.role === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setField('role', type.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                              : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:border-brand-300 dark:hover:border-brand-600'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold leading-tight">{type.label}</span>
                          <span className="text-[10px] text-dark-400 dark:text-dark-500 leading-tight">{type.description}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Invitation-only notice */}
                  <div className="mt-3 flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                    <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">🔑</span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                      <span className="font-bold">Accountant, Manager & Employee</span> roles are invitation-only.
                      An SME Owner invites team members from <span className="font-bold">Team Management</span>.
                      If you received an invitation email, register using the same email address.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    required
                    hint="At least 8 characters with a letter and number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-9 text-dark-400 hover:text-brand-600 dark:text-dark-500 dark:hover:text-brand-400 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  required
                />
                <Button type="submit" size="lg" className="w-full mt-2">
                  Continue →
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Show selected account type badge */}
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold
                  ${form.role === 'owner'
                    ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/30 dark:border-brand-700 dark:text-brand-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300'
                  }`}>
                  {React.createElement(selectedType.icon, { className: 'w-4 h-4' })}
                  <span>{selectedType.label}</span>
                </div>

                <Input
                  label={form.role === 'personal' ? 'Workspace Name' : 'Business Name'}
                  type="text"
                  placeholder={form.role === 'personal' ? 'e.g. My Finances' : 'My Shop / Studio'}
                  value={form.business_name}
                  onChange={(e) => setField('business_name', e.target.value)}
                  required
                />
                <Select
                  label="Industry"
                  value={form.industry}
                  onChange={(e) => setField('industry', e.target.value)}
                  options={INDUSTRIES}
                />
                <Input
                  label="Description (optional)"
                  type="text"
                  placeholder="Brief description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button type="submit" size="lg" loading={loading} className="flex-1">
                    {loading ? 'Creating…' : 'Create Account'}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-dark-500 dark:text-dark-300 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
