import { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  ArrowLeftRight,
  RefreshCw,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Member, Transaction, Investment, CircularSaving } from '../types';
import { formatCurrency, formatDate, capitalize, getInitials } from '../lib/utils';
import { ErrorState, LoadingState } from '../components/EmptyState';

interface DashboardData {
  members: Member[];
  transactions: Transaction[];
  investments: Investment[];
  circulars: CircularSaving[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [membersRes, transactionsRes, investmentsRes, circularsRes] = await Promise.all([
          supabase.from('members').select('*').order('created_at', { ascending: false }),
          supabase.from('transactions').select('*').order('date', { ascending: false }).limit(8),
          supabase.from('investments').select('*').order('created_at', { ascending: false }),
          supabase.from('circular_savings').select('*').order('created_at', { ascending: false }),
        ]);

        if (membersRes.error) throw membersRes.error;
        if (transactionsRes.error) throw transactionsRes.error;
        if (investmentsRes.error) throw investmentsRes.error;
        if (circularsRes.error) throw circularsRes.error;

        setData({
          members: membersRes.data || [],
          transactions: transactionsRes.data || [],
          investments: investmentsRes.data || [],
          circulars: circularsRes.data || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error || 'No data available'} />;

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const totalShareValue = data.members.reduce(
    (sum, m) => sum + m.shares * Number(m.share_value),
    0
  );

  const totalInvested = data.investments.reduce(
    (sum, i) => sum + Number(i.amount_invested),
    0
  );
  const totalCurrentValue = data.investments.reduce(
    (sum, i) => sum + Number(i.current_value),
    0
  );
  const investmentReturn = totalCurrentValue - totalInvested;
  const activeCirculars = data.circulars.filter((c) => c.status === 'active').length;

  const recentTx = data.transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet size={22} />}
          label="Current Balance"
          value={formatCurrency(balance)}
          tone="blue"
          sub={`${data.transactions.length} transactions`}
        />
        <StatCard
          icon={<Users size={22} />}
          label="Total Members"
          value={data.members.length.toString()}
          tone="emerald"
          sub={`${data.members.filter((m) => m.status === 'active').length} active`}
        />
        <StatCard
          icon={<PieChart size={22} />}
          label="Total Share Value"
          value={formatCurrency(totalShareValue)}
          tone="amber"
          sub={`${data.members.reduce((s, m) => s + m.shares, 0)} shares issued`}
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Investment Portfolio"
          value={formatCurrency(totalCurrentValue)}
          tone="purple"
          sub={investmentReturn >= 0 ? `+${formatCurrency(investmentReturn)} return` : `${formatCurrency(investmentReturn)} loss`}
        />
      </div>

      {/* Income / Expense / Circular summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Income</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Circular Cycles</p>
              <p className="text-xl font-bold text-slate-900">{activeCirculars}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions + top members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <ArrowLeftRight size={18} className="text-slate-400" />
          </div>
          {recentTx.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{capitalize(tx.category)}</p>
                      <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Top Shareholders</h3>
            <Users size={18} className="text-slate-400" />
          </div>
          {data.members.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No members yet</p>
          ) : (
            <div className="space-y-2">
              {[...data.members]
                .sort((a, b) => b.shares * Number(b.share_value) - a.shares * Number(a.share_value))
                .slice(0, 5)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-bold">
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.shares} shares</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {formatCurrency(m.shares * Number(m.share_value))}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Investment overview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Investment Overview</h3>
          <Clock size={18} className="text-slate-400" />
        </div>
        {data.investments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No investments yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.investments.slice(0, 6).map((inv) => {
              const ret = Number(inv.current_value) - Number(inv.amount_invested);
              const pct = Number(inv.amount_invested) > 0
                ? (ret / Number(inv.amount_invested)) * 100
                : 0;
              return (
                <div key={inv.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{inv.name}</p>
                    <span className={`badge ${inv.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {capitalize(inv.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{capitalize(inv.type)}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Return</span>
                    <span className={ret >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {ret >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const tones: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700 shadow-blue-200',
    emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-200',
    amber: 'from-amber-500 to-amber-700 shadow-amber-200',
    purple: 'from-violet-500 to-violet-700 shadow-violet-200',
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tones[tone]} text-white flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
