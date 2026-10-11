import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Investment } from '../types';
import { INVESTMENT_TYPES, INVESTMENT_STATUS } from '../types';
import { formatCurrency, formatDate, capitalize, todayISO } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState';

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvestments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = investments.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvested = filtered.reduce((s, i) => s + Number(i.amount_invested), 0);
  const totalCurrent = filtered.reduce((s, i) => s + Number(i.current_value), 0);
  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  async function handleSave(form: Partial<Investment>) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount_invested: Number(form.amount_invested),
        current_value: Number(form.current_value),
      };
      if (editing) {
        const { error } = await supabase.from('investments').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investments').insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save investment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('investments').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete investment');
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Total Invested</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Current Value</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Total Return</p>
          <p
            className={`text-xl font-bold ${
              totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {totalReturn >= 0 ? '+' : ''}
            {formatCurrency(totalReturn)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Return %</p>
          <p
            className={`text-xl font-bold ${
              returnPct >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {returnPct >= 0 ? '+' : ''}
            {returnPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search investments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-[140px]"
          >
            <option value="all">All Status</option>
            {INVESTMENT_STATUS.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
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
          Add Investment
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<TrendingUp size={28} />}
            title="No investments found"
            description="Track your association's first investment to monitor growth and returns over time."
            action={
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} />
                Add Investment
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((inv) => {
            const ret = Number(inv.current_value) - Number(inv.amount_invested);
            const pct =
              Number(inv.amount_invested) > 0
                ? (ret / Number(inv.amount_invested)) * 100
                : 0;
            return (
              <div
                key={inv.id}
                className="card p-5 group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{inv.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{capitalize(inv.type)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditing(inv);
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(inv.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`badge ${
                      inv.status === 'active'
                        ? 'bg-blue-50 text-blue-700'
                        : inv.status === 'matured'
                        ? 'bg-emerald-50 text-emerald-700'
                        : inv.status === 'loss'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {capitalize(inv.status)}
                  </span>
                  <span className="text-xs text-slate-400">
                    Since {formatDate(inv.start_date)}
                  </span>
                </div>

                {inv.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{inv.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">Invested</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCurrency(Number(inv.amount_invested))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Current</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCurrency(Number(inv.current_value))}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Return</span>
                  <span
                    className={`text-sm font-bold ${
                      ret >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {ret >= 0 ? '+' : ''}
                    {formatCurrency(ret)} ({pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InvestmentForm
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        investment={editing}
        saving={saving}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Investment"
        message="Are you sure you want to delete this investment record? This action cannot be undone."
      />
    </div>
  );
}

function InvestmentForm({
  open,
  onClose,
  onSave,
  investment,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<Investment>) => void;
  investment: Investment | null;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Investment>>({});

  useEffect(() => {
    if (open) {
      setForm(
        investment || {
          name: '',
          type: 'fixed_deposit',
          amount_invested: 0,
          current_value: 0,
          start_date: todayISO(),
          status: 'active',
          description: '',
        }
      );
    }
  }, [open, investment]);

  const update = (key: keyof Investment, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={investment ? 'Edit Investment' : 'Add Investment'}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Investment Name *</label>
          <input
            className="input"
            value={form.name || ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. City Bank Fixed Deposit"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type *</label>
            <select
              className="input"
              value={form.type || 'fixed_deposit'}
              onChange={(e) => update('type', e.target.value)}
            >
              {INVESTMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {capitalize(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status || 'active'}
              onChange={(e) => update('status', e.target.value)}
            >
              {INVESTMENT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {capitalize(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount Invested (BDT) *</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.amount_invested ?? 0}
              onChange={(e) => update('amount_invested', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Current Value (BDT)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.current_value ?? 0}
              onChange={(e) => update('current_value', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div>
          <label className="label">Start Date *</label>
          <input
            className="input"
            type="date"
            value={form.start_date || todayISO()}
            onChange={(e) => update('start_date', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.description || ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Optional details about this investment"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.name || saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : investment ? 'Update' : 'Add Investment'}
        </button>
      </div>
    </Modal>
  );
}
