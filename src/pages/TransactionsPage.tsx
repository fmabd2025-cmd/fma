import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Transaction, Member } from '../types';
import { TRANSACTION_CATEGORIES } from '../types';
import { formatCurrency, formatDate, capitalize, todayISO } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, memRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('members').select('id, name').order('name', { ascending: true }),
      ]);
      if (txRes.error) throw txRes.error;
      if (memRes.error) throw memRes.error;
      setTransactions(txRes.data || []);
      setMembers(memRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  async function handleSave(form: Partial<Transaction>) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        member_id: form.member_id || null,
      };
      if (editing) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete transaction');
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Income</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Net Balance</p>
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input max-w-[140px]"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ArrowLeftRight size={28} />}
            title="No transactions found"
            description="Record your first income or expense transaction to start tracking the association's finances."
            action={
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} />
                Add Transaction
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpCircle size={12} className="mr-1" />
                        ) : (
                          <ArrowDownCircle size={12} className="mr-1" />
                        )}
                        {capitalize(tx.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{capitalize(tx.category)}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {tx.description || '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(tx.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(tx);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TransactionForm
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        transaction={editing}
        members={members}
        saving={saving}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}

function TransactionForm({
  open,
  onClose,
  onSave,
  transaction,
  members,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<Transaction>) => void;
  transaction: Transaction | null;
  members: Member[];
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Transaction>>({});

  useEffect(() => {
    if (open) {
      setForm(
        transaction || {
          type: 'income',
          category: 'dues',
          amount: 0,
          description: '',
          date: todayISO(),
          member_id: '',
        }
      );
    }
  }, [open, transaction]);

  const update = (key: keyof Transaction, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Type *</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => update('type', 'income')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                form.type === 'income'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ArrowUpCircle size={16} className="inline mr-1.5" />
              Income
            </button>
            <button
              type="button"
              onClick={() => update('type', 'expense')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                form.type === 'expense'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ArrowDownCircle size={16} className="inline mr-1.5" />
              Expense
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category *</label>
            <select
              className="input"
              value={form.category || 'dues'}
              onChange={(e) => update('category', e.target.value)}
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {capitalize(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (BDT) *</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.amount ?? 0}
              onChange={(e) => update('amount', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={form.description || ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Optional note about this transaction"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input
              className="input"
              type="date"
              value={form.date || todayISO()}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Linked Member</label>
            <select
              className="input"
              value={form.member_id || ''}
              onChange={(e) => update('member_id', e.target.value)}
            >
              <option value="">— None —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
        </button>
      </div>
    </Modal>
  );
}
