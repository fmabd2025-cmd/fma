import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  TrendingUp,
  RefreshCw,
  X,
} from 'lucide-react';
import type { PageId } from '../types';

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'members', label: 'Members & Shares', icon: <Users size={20} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={20} /> },
  { id: 'investments', label: 'Investments', icon: <TrendingUp size={20} /> },
  { id: 'circular', label: 'Circular Savings', icon: <RefreshCw size={20} /> },
];

export default function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-900/30">
              FMA
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">FMA 2025</p>
              <p className="text-xs text-slate-400 leading-tight">Management System</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                current === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Friends Multipurpose Association
          </p>
          <p className="text-xs text-slate-600 mt-0.5">© 2025 · All rights reserved</p>
        </div>
      </aside>
    </>
  );
}
