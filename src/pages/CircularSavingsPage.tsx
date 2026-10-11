import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Users as UsersIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CircularSaving, CircularContribution, Member } from '../types';
import { CIRCULAR_STATUS, CONTRIBUTION_STATUS } from '../types';
import { formatCurrency, formatDate, capitalize, todayISO, getInitials } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState';

export default function CircularSavingsPage() {
  const [circulars, setCirculars] = useState<CircularSaving[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<CircularContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<CircularSaving | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CircularSaving | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [deleteContribId, setDeleteContribId] = useState<string | null>(null);
  const [savingContrib, setSavingContrib] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cycRes, memRes] = await Promise.all([
        supabase.from('circular_savings').select('*').order('created_at', { ascending: false }),
        supabase.from('members').select('*').order('name', { ascending: true }),
      ]);
      if (cycRes.error) throw cycRes.error;
      if (memRes.error) throw memRes.error;
      setCirculars(cycRes.data || []);
      setMembers(memRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load circular savings');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContributions = useCallback(async (cycleId: string) => {
    try {
      const { data, error } = await supabase
        .from('circular_contributions')
        .select('*, member:members(*)')
        .eq('circular_id', cycleId)
        .order('contribution_date', { ascending: false });
      if (error) throw error;
      setContributions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contributions');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedCycle) {
      loadContributions(selectedCycle.id);
    }
  }, [selectedCycle, loadContributions]);

  async function handleSaveCycle(form: Partial<CircularSaving>) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        total_amount: Number(form.total_amount),
        contribution_per_member: Number(form.contribution_per_member),
        cycle_number: Number(form.cycle_number),
      };
      if (editing) {
        const { error } = await supabase.from('circular_savings').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('circular_savings').insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save cycle');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCycle(id: string) {
    try {
      const { error } = await supabase.from('circular_savings').delete().eq('id', id);
      if (error) throw error;
      if (selectedCycle?.id === id) setSelectedCycle(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete cycle');
    }
  }

  async function handleSaveContribution(form: Partial<CircularContribution>) {
    if (!selectedCycle) return;
    setSavingContrib(true);
    try {
      const payload = {
        circular_id: selectedCycle.id,
        member_id: form.member_id,
        amount: Number(form.amount),
        contribution_date: form.contribution_date || todayISO(),
        status: form.status || 'paid',
      };
      const { error } = await supabase.from('circular_contributions').insert(payload);
      if (error) throw error;
      setContribModalOpen(false);
      await loadContributions(selectedCycle.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setSavingContrib(false);
    }
  }

  async function handleDeleteContribution(id: string) {
    try {
      const { error } = await supabase.from('circular_contributions').delete().eq('id', id);
      if (error) throw error;
      if (selectedCycle) await loadContributions(selectedCycle.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contribution');
    }
  }

  async function handleUpdateContributionStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('circular_contributions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      if (selectedCycle) await loadContributions(selectedCycle.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  // Detail view for a selected cycle
  if (selectedCycle) {
    const totalCollected = contributions.reduce((s, c) => s + Number(c.amount), 0);
    const paidCount = contributions.filter((c) => c.status === 'paid').length;

    return (
      <div className="space-y-5 animate-fadeIn">
        <button
          onClick={() => setSelectedCycle(null)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={18} />
          Back to Cycles
        </button>

        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-200">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCycle.name}</h2>
                  <p className="text-sm text-slate-500">Cycle #{selectedCycle.cycle_number}</p>
                </div>
              </div>
              <span
                className={`badge ${
                  selectedCycle.status === 'active'
                    ? 'bg-blue-50 text-blue-700'
                    : selectedCycle.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {capitalize(selectedCycle.status)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(selectedCycle);
                  setModalOpen(true);
                }}
                className="btn-secondary"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button onClick={() => setDeleteId(selectedCycle.id)} className="btn-danger">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Target Amount</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(Number(selectedCycle.total_amount))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Collected</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Per Member / Month</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(Number(selectedCycle.contribution_per_member))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Contributions</p>
              <p className="text-lg font-bold text-slate-900">
                {paidCount} / {contributions.length}
              </p>
            </div>
          </div>
          <div className="flex gap-6 mt-4 text-sm text-slate-500">
            <span>Start: {formatDate(selectedCycle.start_date)}</span>
            <span>End: {formatDate(selectedCycle.end_date)}</span>
          </div>

          {/* Progress bar */}
          {Number(selectedCycle.total_amount) > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (totalCollected / Number(selectedCycle.total_amount)) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {((totalCollected / Number(selectedCycle.total_amount)) * 100).toFixed(1)}% of
                target collected
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Contributions</h3>
          <button onClick={() => setContribModalOpen(true)} className="btn-primary">
            <Plus size={18} />
            Add Contribution
          </button>
        </div>

        {contributions.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<UsersIcon size={28} />}
              title="No contributions yet"
              description="Record the first contribution for this cycle to start tracking member payments."
              action={
                <button onClick={() => setContribModalOpen(true)} className="btn-primary">
                  <Plus size={18} />
                  Add Contribution
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
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Member</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-bold">
                            {c.member ? getInitials(c.member.name) : '?'}
                          </div>
                          <span className="font-medium text-slate-800">
                            {c.member?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDate(c.contribution_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {formatCurrency(Number(c.amount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={c.status}
                          onChange={(e) => handleUpdateContributionStatus(c.id, e.target.value)}
                          className={`text-xs font-medium rounded-full border-0 px-2.5 py-1 cursor-pointer focus:ring-2 focus:ring-blue-300 ${
                            c.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {CONTRIBUTION_STATUS.map((s) => (
                            <option key={s} value={s}>
                              {capitalize(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteContribId(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <CycleForm
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSaveCycle}
          cycle={editing}
          saving={saving}
        />

        <ContributionForm
          open={contribModalOpen}
          onClose={() => setContribModalOpen(false)}
          onSave={handleSaveContribution}
          members={members}
          saving={savingContrib}
        />

        <ConfirmDialog
          open={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId && handleDeleteCycle(deleteId)}
          title="Delete Cycle"
          message="Deleting this cycle will also delete all its contributions. This cannot be undone."
        />
        <ConfirmDialog
          open={deleteContribId !== null}
          onClose={() => setDeleteContribId(null)}
          onConfirm={() => deleteContribId && handleDeleteContribution(deleteContribId)}
          title="Delete Contribution"
          message="Are you sure you want to delete this contribution record?"
        />
      </div>
    );
  }

  // List view of all cycles
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Savings Cycles</h2>
          <p className="text-sm text-slate-500">Manage circular savings and track member contributions</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          New Cycle
        </button>
      </div>

      {circulars.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<RefreshCw size={28} />}
            title="No savings cycles yet"
            description="Create your first circular savings cycle to start collecting member contributions."
            action={
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} />
                New Cycle
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {circulars.map((cyc) => {
            const cycContributions = contributions.filter((c) => c.circular_id === cyc.id);
            const collected = cycContributions.reduce((s, c) => s + Number(c.amount), 0);
            const progress =
              Number(cyc.total_amount) > 0
                ? Math.min(100, (collected / Number(cyc.total_amount)) * 100)
                : 0;
            return (
              <div
                key={cyc.id}
                className="card p-5 group hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedCycle(cyc)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-200">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{cyc.name}</h3>
                      <p className="text-xs text-slate-500">Cycle #{cyc.cycle_number}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`badge ${
                      cyc.status === 'active'
                        ? 'bg-blue-50 text-blue-700'
                        : cyc.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {cyc.status === 'active' && <Clock size={10} className="mr-1" />}
                    {cyc.status === 'completed' && <Check size={10} className="mr-1" />}
                    {capitalize(cyc.status)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(cyc.start_date)} — {formatDate(cyc.end_date)}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Target</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(Number(cyc.total_amount))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Per Member</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(Number(cyc.contribution_per_member))}
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {progress.toFixed(0)}% collected · Click to view details
                </p>
              </div>
            );
          })}
        </div>
      )}

      <CycleForm
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSaveCycle}
        cycle={editing}
        saving={saving}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDeleteCycle(deleteId)}
        title="Delete Cycle"
        message="Deleting this cycle will also delete all its contributions. This cannot be undone."
      />
    </div>
  );
}

function CycleForm({
  open,
  onClose,
  onSave,
  cycle,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<CircularSaving>) => void;
  cycle: CircularSaving | null;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<CircularSaving>>({});

  useEffect(() => {
    if (open) {
      setForm(
        cycle || {
          name: '',
          cycle_number: 1,
          total_amount: 0,
          contribution_per_member: 0,
          start_date: todayISO(),
          end_date: '',
          status: 'active',
        }
      );
    }
  }, [open, cycle]);

  const update = (key: keyof CircularSaving, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal open={open} onClose={onClose} title={cycle ? 'Edit Cycle' : 'New Savings Cycle'}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="label">Cycle Name *</label>
            <input
              className="input"
              value={form.name || ''}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Winter Savings 2025"
            />
          </div>
          <div>
            <label className="label">Cycle #</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.cycle_number ?? 1}
              onChange={(e) => update('cycle_number', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Target Amount (BDT)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.total_amount ?? 0}
              onChange={(e) => update('total_amount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">Per Member (BDT)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.contribution_per_member ?? 0}
              onChange={(e) => update('contribution_per_member', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              className="input"
              type="date"
              value={form.start_date || todayISO()}
              onChange={(e) => update('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              className="input"
              type="date"
              value={form.end_date || ''}
              onChange={(e) => update('end_date', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status || 'active'}
            onChange={(e) => update('status', e.target.value)}
          >
            {CIRCULAR_STATUS.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
          </select>
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
          {saving ? 'Saving...' : cycle ? 'Update' : 'Create Cycle'}
        </button>
      </div>
    </Modal>
  );
}

function ContributionForm({
  open,
  onClose,
  onSave,
  members,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<CircularContribution>) => void;
  members: Member[];
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<CircularContribution>>({});

  useEffect(() => {
    if (open) {
      setForm({
        member_id: members[0]?.id || '',
        amount: 0,
        contribution_date: todayISO(),
        status: 'paid',
      });
    }
  }, [open, members]);

  const update = (key: keyof CircularContribution, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal open={open} onClose={onClose} title="Add Contribution">
      <div className="space-y-4">
        <div>
          <label className="label">Member *</label>
          <select
            className="input"
            value={form.member_id || ''}
            onChange={(e) => update('member_id', e.target.value)}
          >
            <option value="">Select a member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={form.contribution_date || todayISO()}
              onChange={(e) => update('contribution_date', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status || 'paid'}
            onChange={(e) => update('status', e.target.value)}
          >
            {CONTRIBUTION_STATUS.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.member_id || saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Add Contribution'}
        </button>
      </div>
    </Modal>
  );
}
