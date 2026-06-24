import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, setRole } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    industry: 'retail',
    role: 'SME Owner',
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
        business_name: form.business_name,
        industry: form.industry,
        description: form.description,
      });
      setRole(form.role);
      login(res.user, res.business, res.access_token, res.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#FDFDFD' }}>
      {/* Matching landing page blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-400/20 blur-[120px] pointer-events-none animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-400/15 blur-[100px] pointer-events-none animate-blob-reverse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-dark-500 hover:text-brand-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30 mb-5"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
            <div className="w-7 h-7 rounded-full border-[3px] border-white border-t-transparent animate-spin" />
          </div>
          <h1 className="text-dark-900 text-3xl font-extrabold tracking-tight">Create your account</h1>
          <p className="text-dark-500 text-sm mt-2 font-medium">
            {step === 1 ? 'Step 1 of 2 — Personal details' : 'Step 2 of 2 — Business profile'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-soft">
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

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
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
              <div>
                <label className="text-sm font-semibold text-dark-700 block mb-2">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all"
                >
                  <option>SME Owner</option>
                  <option>Freelancer</option>
                  <option>Shop Owner</option>
                  <option>Accountant / Finance Staff</option>
                  <option>Admin</option>
                </select>
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
                  className="absolute right-3 top-9 text-dark-400 hover:text-brand-600 transition-colors"
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
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Business Name"
                type="text"
                placeholder="My Shop / Freelance Studio"
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
                placeholder="Brief description of your business"
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
            </form>
          )}

          <p className="text-center text-dark-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-500 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
