import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Pencil, Trash2, Users, Search, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { MEMBER_ROLES, MEMBER_STATUS } from '../types';
import { formatCurrency, formatDate, capitalize, getInitials, todayISO } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleSave(form: Partial<Member>) {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('members').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('members').insert(form);
        if (error) throw error;
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save member');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete member');
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
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
            {MEMBER_STATUS.map((s) => (
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
          <UserPlus size={18} />
          Add Member
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={28} />}
            title="No members found"
            description="Add your first association member to start tracking shares and contributions."
            action={
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <UserPlus size={18} />
                Add Member
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="card p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200">
                    {getInitials(m.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{m.name}</h3>
                    <span
                      className={`badge mt-1 ${
                        m.role === 'member'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {capitalize(m.role)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditing(m);
                      setModalOpen(true);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {m.email && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={14} /> <span className="truncate">{m.email}</span>
                  </div>
                )}
                {m.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={14} /> {m.phone}
                  </div>
                )}
                {m.address && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} /> <span className="truncate">{m.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Shares</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {m.shares} × {formatCurrency(Number(m.share_value))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total Value</p>
                  <p className="text-sm font-bold text-blue-600">
                    {formatCurrency(m.shares * Number(m.share_value))}
                  </p>
                </div>
                <span
                  className={`badge ${
                    m.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {capitalize(m.status)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Joined: {formatDate(m.joined_date)}</p>
            </div>
          ))}
        </div>
      )}

      <MemberForm
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        member={editing}
        saving={saving}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
      />
    </div>
  );
}

function MemberForm({
  open,
  onClose,
  onSave,
  member,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<Member>) => void;
  member: Member | null;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Member>>({});

  useEffect(() => {
    if (open) {
      setForm(
        member || {
          name: '',
          email: '',
          phone: '',
          address: '',
          shares: 0,
          share_value: 0,
          role: 'member',
          status: 'active',
          joined_date: todayISO(),
        }
      );
    }
  }, [open, member]);

  const update = (key: keyof Member, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal open={open} onClose={onClose} title={member ? 'Edit Member' : 'Add Member'} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full Name *</label>
          <input
            className="input"
            value={form.name || ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Rahim Uddin"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email || ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="member@example.com"
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone || ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input
            className="input"
            value={form.address || ''}
            onChange={(e) => update('address', e.target.value)}
            placeholder="House, Road, City"
          />
        </div>
        <div>
          <label className="label">Shares</label>
          <input
            className="input"
            type="number"
            min="0"
            value={form.shares ?? 0}
            onChange={(e) => update('shares', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Share Value (BDT)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.share_value ?? 0}
            onChange={(e) => update('share_value', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={form.role || 'member'}
            onChange={(e) => update('role', e.target.value)}
          >
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {capitalize(r)}
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
            {MEMBER_STATUS.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Joined Date</label>
          <input
            className="input"
            type="date"
            value={form.joined_date || todayISO()}
            onChange={(e) => update('joined_date', e.target.value)}
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
          {saving ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </Modal>
  );
}
