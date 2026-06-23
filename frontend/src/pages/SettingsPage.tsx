import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../api/auth';
import { Shield, Sparkles, User, Briefcase, Key, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, business, setUser, setBusiness, setRole, role, logout } = useAuthStore();

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
    country: '',
  });

  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    showDisclaimer: true,
  });

  const [savingProfile, setSavingProfile] = useState(false);

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
      setUser(res.data.user);
      setBusiness(res.data.business || null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Settings</h1>
        <p className="text-dark-500 mt-1">Manage your account, business preferences, and AI assistant settings.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <section className="bg-white rounded-2xl border border-dark-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-dark-900 font-bold text-lg">Profile Settings</h2>
            </div>
            <div className="space-y-4">
              <Input label="Full Name" value={profile.name} onChange={(e) => setProfile(p => ({...p, name: e.target.value}))} />
              <Input label="Email Address" value={profile.email} disabled className="bg-dark-50 cursor-not-allowed text-dark-400" />
              <Input label="Business Name" value={profile.business_name} onChange={(e) => setProfile(p => ({...p, business_name: e.target.value}))} />
              <Select label="Role" value={role || 'SME Owner'} onChange={(e) => setRole?.(e.target.value)} options={[
                { value: 'SME Owner', label: 'SME Owner' },
                { value: 'Freelancer', label: 'Freelancer' },
                { value: 'Shop Owner', label: 'Shop Owner' },
                { value: 'Accountant / Finance Staff', label: 'Accountant / Finance Staff' },
                { value: 'Admin', label: 'Admin' },
              ]} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-dark-50">
            <Button onClick={saveProfile} loading={savingProfile} className="w-full sm:w-auto">Save Changes</Button>
          </div>
        </section>

        {/* Business Preferences */}
        <section className="bg-white rounded-2xl border border-dark-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-dark-900 font-bold text-lg">Business Preferences</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-dark-800 text-sm font-semibold mb-1">Currency</p>
                <p className="text-dark-500 text-sm font-medium">MMK (Myanmar Kyat) — Fixed for local compliance</p>
              </div>
              <Select label="Business Type" value={prefs.business_type} onChange={(e) => setPrefs(p => ({...p, business_type: e.target.value}))} options={[
                { value: 'Retail', label: 'Retail' },
                { value: 'Freelancer', label: 'Freelancer' },
                { value: 'Service', label: 'Service' },
                { value: 'SME', label: 'SME' },
                { value: 'Other', label: 'Other' },
              ]} />
              <Input label="Country / Region" value={prefs.country || 'Myanmar'} onChange={(e) => setPrefs(p => ({...p, country: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-dark-50">
            <Button variant="secondary" className="w-full sm:w-auto">Save Preferences</Button>
          </div>
        </section>

        {/* AI Assistant Settings */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-dark-100 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-dark-900 font-bold text-lg">AI Assistant Settings</h2>
          </div>
          <div className="space-y-6 text-sm text-dark-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-dark-900">Enable AI Copilot</p>
                <p className="text-dark-500 text-sm mt-0.5">Toggle the in-app AI assistant for smart insights and transaction advice.</p>
              </div>
              <button
                type="button"
                onClick={() => setAiSettings(s => ({...s, enabled: !s.enabled}))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  aiSettings.enabled ? 'bg-brand-600' : 'bg-dark-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    aiSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-dark-50">
              <div>
                <p className="font-semibold text-dark-900">Show AI Disclaimer</p>
                <p className="text-dark-500 text-sm mt-0.5">Display advisor details and guidance warnings inside AI chat responses.</p>
              </div>
              <button
                type="button"
                onClick={() => setAiSettings(s => ({...s, showDisclaimer: !s.showDisclaimer}))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  aiSettings.showDisclaimer ? 'bg-brand-600' : 'bg-dark-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    aiSettings.showDisclaimer ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mt-2">
              <p className="text-brand-800 text-xs font-medium leading-relaxed">
                💡 AI advice is generated automatically based on your financial history. It does not replace certified professional audit or tax filing consultation.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Access */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-dark-100 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-dark-900 font-bold text-lg">Privacy & Security</h2>
          </div>
          <div className="space-y-4 text-sm text-dark-700">
            <p className="text-dark-500 font-medium leading-relaxed">
              Your financial records are encrypted end-to-end and stored securely. We do not Sell or disclose details of your corporate bookkeeping to third parties.
            </p>
            <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-dark-50">
              <Button variant="secondary" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Change Password
              </Button>
              <Button variant="danger" onClick={() => logout()} className="flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-colors duration-250">
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
