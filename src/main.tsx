import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDownLeft, ArrowUpRight, BarChart3, Bell, ChevronDown, CircleDollarSign, FileText, LayoutDashboard, Menu, Plus, Search, Settings, ShieldCheck, WalletCards, X } from 'lucide-react'
import './styles.css'

type Entry = { id: number; date: string; description: string; category: string; amount: number; status: string }

const initialPettyCash: Entry[] = [
  { id: 1, date: 'Oct 10, 2026', description: 'Office supplies', category: 'Operations', amount: 2450, status: 'Approved' },
  { id: 2, date: 'Oct 09, 2026', description: 'Local transport', category: 'Transport', amount: 1200, status: 'Approved' },
  { id: 3, date: 'Oct 07, 2026', description: 'Refreshments', category: 'Events', amount: 1800, status: 'Pending' },
]

const sheets = ['Shareholders', 'Bank Deposited', 'Bank Due', 'Bank Withdraw', 'Bank Due Deposited', 'Bank Capital', 'Investment', 'Selling', 'Cost', 'Add New Petty Cash', 'Cost from Petty Cash']

function App() {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [entries, setEntries] = useState(initialPettyCash)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', category: 'Operations', amount: '' })

  const pettyTotal = useMemo(() => entries.reduce((sum, item) => sum + item.amount, 0), [entries])
  const addEntry = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.description || !form.amount) return
    setEntries([{ id: Date.now(), date: 'Oct 12, 2026', description: form.description, category: form.category, amount: Number(form.amount), status: 'Pending' }, ...entries])
    setForm({ description: '', category: 'Operations', amount: '' })
    setShowForm(false)
    setActive('Cost from Petty Cash')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">F</div><div><strong>FMA</strong><span>Finance Office</span></div><button className="close-menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="workspace"><span>WORKSPACE</span><button>FMA 2025 <ChevronDown size={14} /></button></div>
      <nav><button className={active === 'Dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => { setActive('Dashboard'); setSidebarOpen(false) }}><LayoutDashboard size={18} /> Dashboard</button><p className="nav-label">LEDGERS</p>{sheets.map(sheet => <button key={sheet} className={active === sheet ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(sheet); setSidebarOpen(false) }}>{sheet === 'Add New Petty Cash' ? <Plus size={18} /> : <FileText size={18} />} {sheet}</button>)}<p className="nav-label">SYSTEM</p><button className="nav-item"><Settings size={18} /> Settings</button></nav>
      <div className="admin-card"><div className="avatar">MA</div><div><strong>Master Admin</strong><span>Full access</span></div><ChevronDown size={15} /></div>
    </aside>
    {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}
    <main className="main-content"><header><button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div className="breadcrumbs">FMA 2025 <span>/</span> <b>{active}</b></div><div className="header-actions"><button className="icon-button"><Search size={18} /></button><button className="icon-button notification"><Bell size={18} /><i /></button><div className="header-avatar">MA</div></div></header>
      <div className="page-wrap">{active === 'Dashboard' ? <Dashboard pettyTotal={pettyTotal} entries={entries} onAdd={() => setShowForm(true)} /> : <Ledger title={active} entries={entries} onAdd={() => setShowForm(true)} />}</div>
    </main>
    {showForm && <div className="modal-backdrop"><form className="modal" onSubmit={addEntry}><div className="modal-head"><div><span className="eyebrow">PETTY CASH</span><h2>Add new expense</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}><X size={18} /></button></div><label>Description<input autoFocus value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Stationery" /></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Operations</option><option>Transport</option><option>Events</option><option>Maintenance</option></select></label><label>Amount (BDT)<input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></label><button className="primary full" type="submit"><Plus size={17} /> Add expense</button></form></div>}
  </div>
}

function Dashboard({ pettyTotal, entries, onAdd }: { pettyTotal: number; entries: Entry[]; onAdd: () => void }) { return <><div className="page-heading"><div><span className="eyebrow">MONDAY, OCTOBER 12, 2026</span><h1>Good morning, Admin.</h1><p>Here&apos;s the financial overview for FMA 2025.</p></div><button className="primary" onClick={onAdd}><Plus size={17} /> Add petty cash</button></div><section className="metrics"><Metric label="Total balance" value="৳ 1,248,500" change="+8.4%" icon={<CircleDollarSign />} /><Metric label="Bank deposited" value="৳ 874,200" change="+12.1%" icon={<ArrowDownLeft />} /><Metric label="Total investment" value="৳ 492,000" change="+4.8%" icon={<BarChart3 />} /><Metric label="Petty cash" value={`৳ ${pettyTotal.toLocaleString()}`} change="This month" icon={<WalletCards />} /></section><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-head"><div><h2>Cash flow</h2><p>Income and expenses over the last 6 months</p></div><button className="select-button">Last 6 months <ChevronDown size={14} /></button></div><div className="chart"><div className="chart-y"><span>৳ 200k</span><span>৳ 150k</span><span>৳ 100k</span><span>৳ 50k</span><span>৳ 0</span></div><div className="chart-area"><div className="grid-lines" /> <svg viewBox="0 0 600 220" preserveAspectRatio="none"><path d="M0 170 C65 145, 80 155, 120 120 S190 145, 230 100 S295 125, 340 85 S405 110, 450 65 S520 90, 600 38" fill="none" stroke="#0b8f78" strokeWidth="3" /><path d="M0 205 C70 190, 80 180, 125 185 S190 165, 230 175 S300 160, 345 150 S410 155, 450 135 S520 145, 600 120" fill="none" stroke="#e4a52c" strokeWidth="3" /></svg><div className="chart-x"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div></div><div className="legend"><span><i className="teal-dot" /> Income</span><span><i className="gold-dot" /> Expenses</span></div></section><section className="panel summary-panel"><div className="panel-head"><div><h2>Petty cash</h2><p>Latest expense activity</p></div><button className="text-button" onClick={() => {}}>View all</button></div><div className="cash-balance"><span>Available balance</span><strong>৳ {pettyTotal.toLocaleString()}</strong><small>Updated just now</small></div><div className="activity-list">{entries.slice(0, 3).map(item => <div className="activity" key={item.id}><div className="activity-icon"><ArrowUpRight size={16} /></div><div><strong>{item.description}</strong><span>{item.category} · {item.date}</span></div><b>− ৳ {item.amount.toLocaleString()}</b></div>)}</div></section></div><section className="quick-actions"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Keep your records up to date.</h2></div><button onClick={onAdd}><Plus size={17} /> Add petty cash</button><button><ArrowDownLeft size={17} /> Record deposit</button><button><FileText size={17} /> Open reports</button></section></> }

function Metric({ label, value, change, icon }: { label: string; value: string; change: string; icon: React.ReactNode }) { return <div className="metric"><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><strong>{value}</strong><small><em>{change}</em> vs last month</small></div> }
function Ledger({ title, entries, onAdd }: { title: string; entries: Entry[]; onAdd: () => void }) { return <><div className="page-heading"><div><span className="eyebrow">FINANCIAL LEDGER</span><h1>{title}</h1><p>Review and manage your {title.toLowerCase()} records.</p></div><button className="primary" onClick={onAdd}><Plus size={17} /> Add record</button></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input placeholder="Search records" /></div><button className="select-button">All statuses <ChevronDown size={14} /></button></div><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead><tbody>{entries.map(item => <tr key={item.id}><td>{item.date}</td><td><strong>{item.description}</strong></td><td>{item.category}</td><td className="amount">৳ {item.amount.toLocaleString()}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></tr>)}</tbody></table></section></> }

createRoot(document.getElementById('root')!).render(<App />)
