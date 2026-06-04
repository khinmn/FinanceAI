import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../api/auth';

export default function SettingsPage() {
  const { user, business, setUser, setBusiness, setRole, role } = useAuthStore();

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
      // ignore; keep UX simple for demo
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-slate-900 text-2xl font-semibold">Settings</h1>
            <p className="text-slate-500 text-sm">Manage your account, business, and AI preferences.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-slate-900 font-semibold mb-3">Profile Settings</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <Input label="Full name" value={profile.name} onChange={(e) => setProfile(p => ({...p, name: e.target.value}))} />
              <Input label="Email" value={profile.email} onChange={(e) => setProfile(p => ({...p, email: e.target.value}))} />
              <Input label="Business name" value={profile.business_name} onChange={(e) => setProfile(p => ({...p, business_name: e.target.value}))} />
              <Select label="Role" value={role || 'SME Owner'} onChange={(e) => setRole?.(e.target.value)} options={[
                { value: 'SME Owner', label: 'SME Owner' },
                { value: 'Freelancer', label: 'Freelancer' },
                { value: 'Shop Owner', label: 'Shop Owner' },
                { value: 'Accountant / Finance Staff', label: 'Accountant / Finance Staff' },
                { value: 'Admin', label: 'Admin' },
              ]} />

              <div className="flex gap-3 mt-3">
                <Button onClick={saveProfile} loading={savingProfile}>Save Changes</Button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-slate-900 font-semibold mb-3">Business Preferences</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-slate-800 font-medium">Currency</p>
                <p className="text-slate-600 text-sm">MMK (Myanmar Kyat) — fixed</p>
              </div>
              <div>
                <Select label="Business type" value={prefs.business_type} onChange={(e) => setPrefs(p => ({...p, business_type: e.target.value}))} options={[
                  { value: 'Retail', label: 'Retail' },
                  { value: 'Freelancer', label: 'Freelancer' },
                  { value: 'Service', label: 'Service' },
                  { value: 'SME', label: 'SME' },
                  { value: 'Other', label: 'Other' },
                ]} />
              </div>
              <Input label="Country" value={prefs.country} onChange={(e) => setPrefs(p => ({...p, country: e.target.value}))} />
              <div className="flex gap-3 mt-3">
                <Button variant="secondary">Save Preferences</Button>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-slate-900 font-semibold mb-3">AI Assistant Settings</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Enable AI Assistant</p>
                  <p className="text-slate-600 text-sm">Toggle the in-app AI assistant for suggestions.</p>
                </div>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={aiSettings.enabled} onChange={(e) => setAiSettings(s => ({...s, enabled: e.target.checked}))} className="h-5 w-9 rounded-full bg-slate-200" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Show AI disclaimer</p>
                  <p className="text-slate-600 text-sm">Display advisory inside AI responses.</p>
                </div>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={aiSettings.showDisclaimer} onChange={(e) => setAiSettings(s => ({...s, showDisclaimer: e.target.checked}))} className="h-5 w-9 rounded-full bg-slate-200" />
                </label>
              </div>

              <p className="text-slate-500 text-sm">AI suggestions are for guidance only and do not replace professional financial advice.</p>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-slate-900 font-semibold mb-3">Privacy & Security</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p>Your financial data is protected and never shared without consent. Use strong passwords and keep your account secure.</p>
              <div className="flex gap-3 mt-3">
                <Button variant="secondary">Change Password</Button>
                <Button variant="danger" onClick={() => { /* logout handled by header/sidebar */ }}>Logout</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
