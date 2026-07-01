import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Trash2, Edit2, Shield, Mail, Calendar,
  Clock, X, CheckCircle, AlertCircle, Loader2, Info
} from 'lucide-react';
import { teamApi } from '../api/team';
import type { TeamMember } from '../types';
import Button from '../components/ui/Button';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Owner' | 'Accountant' | 'Manager' | 'Employee'>('Employee');
  const [status, setStatus] = useState<'Active' | 'Pending'>('Active');

  // Inline Toast notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const res = await teamApi.getTeamMembers();
      setMembers(res.members);
    } catch (err) {
      console.error(err);
      showToast('Failed to load team list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open modal to add member
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setRole('Employee');
    setStatus('Active');
    setIsModalOpen(true);
  };

  // Open modal to edit member
  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email);
    setRole(member.role);
    setStatus(member.status);
    setIsModalOpen(true);
  };

  // Submit Add / Edit Member
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMember) {
        // Edit Member
        const res = await teamApi.updateTeamMember(editingMember.id, {
          name,
          role,
          status,
        });
        showToast('Team member updated successfully.');
        setMembers(prev => prev.map(m => m.id === editingMember.id ? res.member : m));
      } else {
        // Add Member
        const res = await teamApi.addTeamMember({
          name,
          email,
          role,
          status,
        });
        showToast('Invitation sent successfully.');
        setMembers(prev => [...prev, res.member]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save member details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Member
  const handleDeleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to revoke access for this team member?')) return;
    try {
      await teamApi.deleteTeamMember(id);
      showToast('Access revoked successfully.');
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to remove member.', 'error');
    }
  };

  // Role details mapping helper
  const getRoleDesc = (memberRole: string) => {
    switch (memberRole) {
      case 'Owner':
        return 'Full workspace access & financial deletion controls.';
      case 'Accountant':
        return 'Manage budgets, transactions, view reports & audit logs.';
      case 'Manager':
        return 'Set monthly category budgets & monitor recent transactions.';
      case 'Employee':
        return 'Access uploading receipts & listing standard transactions.';
      default:
        return 'Standard read-only user access.';
    }
  };

  // Avatar helper
  const getAvatarInitials = (userName: string) => {
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  };

  // Metrics calculation
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const pendingMembers = members.filter(m => m.status === 'Pending').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section with ambient glow */}
      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-700/50 bg-white dark:bg-dark-800 shadow-soft">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-black text-dark-900 dark:text-white tracking-tight">Team Management</h1>
            <p className="text-[15px] text-dark-400 dark:text-dark-400 font-semibold mt-1">
              Invite your managers, accountants, or partners and grant them specific workspace roles.
            </p>
          </div>
          <div>
            <Button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 text-[15px] shadow-sm py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              <UserPlus className="w-5 h-5" />
              Invite Team Member
            </Button>
          </div>
        </div>

        {/* Dashboard Progress Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-dark-700">
          
          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/50 flex items-center justify-center text-brand-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Total Members</p>
              <h3 className="text-xl font-black text-dark-900 dark:text-white mt-0.5">{totalMembers}</h3>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Active Users</p>
              <h3 className="text-xl font-black text-dark-900 dark:text-white mt-0.5">{activeMembers}</h3>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 rounded-2xl border border-gray-100 dark:border-dark-700/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-wider">Pending Invites</p>
              <h3 className="text-xl font-black text-dark-900 dark:text-white mt-0.5">{pendingMembers}</h3>
            </div>
          </div>

          <div className="p-4 bg-[#F8F5FE] dark:bg-brand-950/20 rounded-2xl border border-[#E5DCFC] dark:border-brand-900/55 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EDE5FC] dark:bg-brand-950/40 text-[#7C3AED] dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <p className="text-[12px] text-[#3B3054] dark:text-brand-350 font-semibold leading-relaxed">
              Define Accountant, Manager, or Employee profiles to secure dashboards.
            </p>
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

      {/* Loading state / Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700/50 shadow-soft">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <span className="text-[15px] text-dark-400 dark:text-dark-400 font-semibold">Loading team members...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => {
            const initials = getAvatarInitials(m.name);
            const isOwner = m.role === 'Owner';
            const isActive = m.status === 'Active';

            // Determine avatar colors based on role
            let avatarClass = 'bg-[#EDE5FC] dark:bg-brand-950/40 text-[#7C3AED] dark:text-brand-400 border-[#E5DCFC] dark:border-brand-900/55';
            let rolePillClass = 'bg-[#EDE5FC] dark:bg-brand-950/40 text-[#7C3AED] dark:text-brand-400 border-[#E5DCFC] dark:border-brand-900/55';
            if (m.role === 'Accountant') {
              avatarClass = 'bg-[#ecfdf5] dark:bg-green-950/20 text-[#16A34A] dark:text-green-400 border-green-100 dark:border-green-900/30';
              rolePillClass = 'bg-[#ecfdf5] dark:bg-green-950/20 text-[#16A34A] dark:text-green-400 border-green-100 dark:border-green-900/30';
            } else if (m.role === 'Manager') {
              avatarClass = 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
              rolePillClass = 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
            } else if (m.role === 'Employee') {
              avatarClass = 'bg-slate-50 dark:bg-dark-700 text-slate-600 dark:text-dark-350 border-slate-200 dark:border-dark-600';
              rolePillClass = 'bg-slate-50 dark:bg-dark-700 text-slate-600 dark:text-dark-350 border-slate-200 dark:border-dark-600';
            }

            return (
              <motion.div
                layout
                key={m.id}
                className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700/50 hover:border-brand-200 dark:hover:border-brand-700 shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header & Avatar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-[16px] shadow-sm ${avatarClass}`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-dark-900 dark:text-white text-[15px] leading-snug">{m.name}</h4>
                        <span className="text-[12px] text-dark-400 dark:text-dark-400 font-bold flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5 opacity-60" />
                          {m.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1.5 rounded-lg text-dark-400 dark:text-dark-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-dark-700 transition-colors"
                        title="Edit Role/Status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 rounded-lg text-dark-400 dark:text-dark-500 hover:text-danger dark:hover:text-rose-400 hover:bg-danger/10 dark:hover:bg-rose-950/20 transition-colors"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status & Role Pill Badges */}
                  <div className="mt-5 flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${rolePillClass}`}>
                      {m.role}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      isActive
                        ? 'bg-[#ecfdf5] dark:bg-green-950/25 text-success dark:text-green-400 border-green-150 dark:border-green-900/30'
                        : 'bg-warning/10 dark:bg-warning/5 text-warning dark:text-amber-400 border-warning/20 dark:border-warning/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                      {m.status}
                    </span>
                  </div>

                  {/* Description Box */}
                  <div className="mt-4 p-3 bg-gray-50/50 dark:bg-dark-900/40 rounded-xl border border-gray-100 dark:border-dark-750 flex items-start gap-2">
                    <Info className="w-4 h-4 text-dark-400 dark:text-dark-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-dark-400 dark:text-dark-400 font-semibold leading-relaxed">
                      {getRoleDesc(m.role)}
                    </p>
                  </div>
                </div>

                {/* Joining date info */}
                {m.created_at && (
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-dark-700 flex items-center justify-between text-[11px] font-bold text-dark-400 dark:text-dark-450">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      Invited Date
                    </span>
                    <span>
                      {new Date(m.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Team Member Modal */}
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
                  {editingMember ? 'Edit Workspace Role' : 'Invite New Team Member'}
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
                  <label className="text-[12px] font-bold text-dark-400 dark:text-dark-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Daw Aye Aye"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700 text-[15px] text-dark-900 dark:text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-dark-400 dark:text-dark-400 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ayeaye@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700 text-[15px] text-dark-900 dark:text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium disabled:opacity-50"
                    required
                    disabled={!!editingMember}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-dark-400 dark:text-dark-400 uppercase tracking-wider">Role Access *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700 text-[15px] text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-dark-400 dark:text-dark-400 uppercase tracking-wider">Invite Status *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700 text-[15px] text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Role Permission Alert block */}
                <div className="p-3 bg-[#F8F5FE] dark:bg-brand-950/20 border border-[#E5DCFC] dark:border-brand-900/50 rounded-xl text-xs text-[#3B3054] dark:text-brand-350 flex gap-2">
                  <Shield className="w-4.5 h-4.5 text-[#7C3AED] dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Role Capabilities:</p>
                    <p className="mt-1 font-medium leading-relaxed">{getRoleDesc(role)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 dark:border-dark-700 flex items-center justify-end gap-3">
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
                        Inviting...
                      </span>
                    ) : (
                      editingMember ? 'Save Changes' : 'Invite Member'
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
