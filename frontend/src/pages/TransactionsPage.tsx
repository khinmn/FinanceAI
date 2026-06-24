import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { transactionsApi } from '../api/transactions';
import { categoriesApi } from '../api/categories';
import { uploadApi } from '../api/upload';
import type { Transaction, Category, TransactionFormData } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) + ' MMK';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'mobile', label: 'Mobile Payment' },
  { value: 'other', label: 'Other' },
];

const emptyForm: TransactionFormData = {
  type: 'expense',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  category_id: null,
  payment_method: 'cash',
  note: '',
  receipt_url: null,
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const res = await uploadApi.uploadReceipt(file);
      setForm((f) => ({ ...f, receipt_url: res.receipt_url }));
      showToast('Receipt uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'File upload failed.', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    const headers = ['Date', 'Type', 'Description', 'Category', 'Payment Method', 'Amount', 'Note', 'Receipt URL'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.description,
      t.category_name,
      t.payment_method,
      t.amount,
      t.note || '',
      t.receipt_url ? `http://127.0.0.1:5000${t.receipt_url}` : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report exported successfully!');
  };

  const loadCategories = useCallback(async () => {
    const res = await categoriesApi.list();
    setCategories(res.categories);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list({
        page,
        per_page: 15,
        search,
        type: typeFilter || undefined,
      });
      setTransactions(res.transactions);
      setTotalPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingTx(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      description: tx.description,
      date: tx.date,
      category_id: tx.category_id,
      payment_method: tx.payment_method,
      note: tx.note || '',
      receipt_url: tx.receipt_url || null,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (editingTx) {
        const res = await transactionsApi.update(editingTx.id, form);
        setModalOpen(false);
        if (res.budget_alert) {
          showToast('Warning: Expense exceeds monthly category budget!', 'error');
        } else {
          showToast('Transaction updated successfully!');
        }
      } else {
        const res = await transactionsApi.create(form);
        setModalOpen(false);
        if (res.budget_alert) {
          showToast('Warning: Expense exceeds monthly category budget!', 'error');
        } else {
          showToast('Transaction added successfully!');
        }
      }
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await transactionsApi.delete(deleteId);
      setDeleteId(null);
      showToast('Transaction deleted.');
      load();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete transaction.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-4">


      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center min-w-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search transactions…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
              className="pl-9 pr-8 py-2 rounded-xl bg-white border border-gray-200 text-dark-800 text-sm placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 w-44 lg:w-56 transition-all"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-brand-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl">
            {['', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === t
                    ? t === 'income'
                      ? 'bg-success/15 text-success'
                      : t === 'expense'
                      ? 'bg-danger/15 text-danger'
                      : 'bg-brand-100 text-brand-700 border border-brand-200'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={exportToCSV} variant="secondary" size="sm">
            Export CSV
          </Button>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats and Alerts Bar */}
      <div className="flex items-center gap-4 min-h-[36px]">
        <div className="text-dark-500 text-xs font-semibold flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
          {total} transaction{total !== 1 ? 's' : ''} found
        </div>
        
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 max-w-lg"
            >
              <div className={`flex items-center justify-between px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${
                toast.type === 'success'
                  ? 'bg-success/10 border-success/20 text-success'
                  : 'bg-danger/10 border-danger/20 text-danger'
              }`}>
                <span className="flex items-center gap-1.5">
                  <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
                  {toast.message}
                </span>
                <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 font-bold">
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-400/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-dark-400 text-sm">No transactions found.</p>
            <button onClick={openAdd} className="text-brand-600 font-semibold text-sm mt-2 hover:text-brand-500 transition-colors">
              Add your first transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Method</th>
                  <th className="text-right px-4 py-3.5 text-dark-500 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {transactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors group"
                    >
                      <td className="px-4 py-3 text-dark-400 whitespace-nowrap text-xs font-medium">{tx.date}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-dark-800 font-semibold truncate flex items-center gap-2">
                          {tx.description}
                          {tx.receipt_url && (
                            <a
                              href={`http://127.0.0.1:5000${tx.receipt_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-50 border border-brand-200 text-[10px] text-brand-600 font-bold hover:bg-brand-100 transition-colors"
                              title="Click to view receipt"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📎 Receipt
                            </a>
                          )}
                        </p>
                        {tx.note && <p className="text-dark-400 text-xs truncate">{tx.note}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tx.category_color }} />
                          <span className="text-dark-500 text-xs truncate max-w-[100px]">{tx.category_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-dark-400 text-xs capitalize">{tx.payment_method}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-success' : 'text-danger'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(tx)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-brand-600 hover:bg-brand-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(tx.id)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-gray-200 text-dark-500 hover:text-brand-600 hover:border-brand-300 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-dark-500 text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white border border-gray-200 text-dark-500 hover:text-brand-600 hover:border-brand-300 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTx ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium">
              {formError}
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="text-dark-700 text-sm font-semibold block mb-1.5">Type</label>
            <div className="flex gap-2">
              {(['income', 'expense'] as const).map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => { setForm((f) => ({ ...f, type: t, category_id: null })); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    form.type === t
                      ? t === 'income'
                        ? 'bg-success/15 text-success border-success/30'
                        : 'bg-danger/15 text-danger border-danger/30'
                      : 'bg-gray-50 text-dark-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Input label="Amount (K)" type="number" placeholder="e.g. 50000" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required min="1" />
          <Input label="Description" type="text" placeholder="e.g. Monthly rent payment" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          <Input label="Date" type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />

          <Select label="Category" value={form.category_id ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null }))}
            options={[{ value: '', label: 'Select category (optional)' }, ...filteredCategories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Select label="Payment Method" value={form.payment_method}
            onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as TransactionFormData['payment_method'] }))}
            options={PAYMENT_METHODS}
          />
          <Input label="Note (optional)" type="text" placeholder="Additional details…" value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />

          {/* Receipt File Uploader */}
          <div>
            <label className="text-dark-700 text-sm font-semibold block mb-1.5">Receipt Attachment (optional)</label>
            {form.receipt_url ? (
              <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-800 text-sm">
                <span className="truncate max-w-[200px] font-medium">Receipt Attached ({form.receipt_url.split('/').pop()})</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, receipt_url: null }))} className="text-xs text-danger font-bold hover:underline">Remove</button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-dark-200 hover:border-brand-400 rounded-xl p-4 transition-all text-center cursor-pointer bg-dark-50/50 hover:bg-white group">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" disabled={uploadingFile} />
                <p className="text-xs text-dark-500 font-semibold group-hover:text-brand-600 transition-colors">
                  {uploadingFile ? 'Uploading...' : 'Drag & drop or click to upload receipt (PDF, JPG, PNG)'}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} className="flex-1">
              {editingTx ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Transaction" maxWidth="max-w-sm">
        <p className="text-dark-600 text-sm mb-5">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteLoading} className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
