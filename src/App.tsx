import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import TransactionsPage from './pages/TransactionsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import CircularSavingsPage from './pages/CircularSavingsPage';
import type { PageId } from './types';

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  members: 'Members & Shareholders',
  transactions: 'Financial Transactions',
  investments: 'Investment Portfolio',
  circular: 'Circular Savings',
};

const PAGE_SUBTITLES: Record<PageId, string> = {
  dashboard: 'Overview of your association at a glance',
  members: 'Manage members and their shareholding details',
  transactions: 'Track all income and expense records',
  investments: 'Monitor investment performance and returns',
  circular: 'Manage circular savings cycles and contributions',
};

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = (p: PageId) => {
    setPage(p);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {PAGE_TITLES[page]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
              {PAGE_SUBTITLES[page]}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'members' && <MembersPage />}
          {page === 'transactions' && <TransactionsPage />}
          {page === 'investments' && <InvestmentsPage />}
          {page === 'circular' && <CircularSavingsPage />}
        </main>
      </div>
    </div>
  );
}
