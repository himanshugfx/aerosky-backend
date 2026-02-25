'use client'

import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    Building2,
    ChevronRight,
    Clock,
    History,
    Layers,
    Loader2,
    Package,
    Plus,
    Search,
    Shield,
    TrendingDown,
    TrendingUp,
    User as UserIcon,
    Wrench,
    X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Component {
    id: string; name: string; description: string | null; quantity: number; category: string;
}

interface Transaction {
    id: string; type: 'IN' | 'OUT'; quantity: number; date: string;
    subcontractor?: { companyName: string }; user?: { fullName: string; username: string };
    takenOutFor?: string; component: { name: string };
}

interface Subcontractor {
    id: string; companyName: string;
}

export default function InventoryPage() {
    const { data: session } = useSession()
    const [components, setComponents] = useState<Component[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [stockSearch, setStockSearch] = useState('')
    const [activeTab, setActiveTab] = useState('All')
    const [modals, setModals] = useState({ in: false, out: false, add: false })
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        componentId: '', quantity: 1, subcontractorId: '', takenOutFor: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    })
    const [compForm, setCompForm] = useState({ name: '', description: '', category: 'Operational' })

    const fetchData = async () => {
        try {
            const [cRes, tRes, sRes] = await Promise.all([
                fetch('/api/inventory/components'),
                fetch(`/api/inventory/transactions${searchTerm ? `?search=${searchTerm}` : ''}`),
                fetch('/api/subcontractors')
            ])
            if (cRes.ok) setComponents(await cRes.json())
            if (tRes.ok) setTransactions(await tRes.json())
            if (sRes.ok) setSubcontractors(await sRes.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { if (session) fetchData() }, [session, searchTerm])

    const handleTransaction = async (type: 'IN' | 'OUT') => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/inventory/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData, type, quantity: Number(formData.quantity),
                    subcontractorId: type === 'IN' ? (formData.subcontractorId || null) : null,
                    takenOutFor: type === 'OUT' ? (formData.takenOutFor || null) : null,
                    date: `${formData.date}T${formData.time}:00`
                })
            })
            if (res.ok) {
                setModals({ ...modals, in: false, out: false })
                setFormData({ ...formData, componentId: '', quantity: 1 })
                fetchData()
            }
        } finally { setSubmitting(false) }
    }

    const filteredComponents = components.filter(c =>
        (activeTab === 'All' || c.category === activeTab) &&
        c.name.toLowerCase().includes(stockSearch.toLowerCase())
    )

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Logistics Grid</p>
        </div>
    )

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Sector Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="status-badge status-badge-success">Logistics Core</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AeroSky Assets</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Inventory <span className="text-slate-400">Logistics</span></h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                        Precision tracking of aerospace components, manufacturing consumables, and operational hardware across the AeroSky network.
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => setModals({ ...modals, add: true })} className="btn-premium-ghost border border-slate-200 !py-4 px-6 text-[11px] font-black uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> New Category
                    </button>
                    <button onClick={() => setModals({ ...modals, in: true })} className="btn-premium-accent bg-emerald-600 hover:bg-emerald-700 !py-4 shadow-xl shadow-emerald-500/20 group">
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        Stock Arrival
                    </button>
                    <button onClick={() => setModals({ ...modals, out: true })} className="btn-premium-primary !py-4 shadow-xl shadow-slate-900/20 group">
                        <ArrowDownRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                        Record Usage
                    </button>
                </div>
            </div>

            {/* Global Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total components', value: components.length, icon: Boxes, color: 'indigo' },
                    { label: 'Active stock units', value: components.reduce((a, c) => a + c.quantity, 0), icon: Package, color: 'violet' },
                    { label: 'Low Stock warnings', value: components.filter(c => c.quantity <= 5).length, icon: AlertCircle, color: 'rose' },
                    { label: 'Monthly movements', value: transactions.length, icon: Activity, color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="modern-card p-8 group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full translate-x-12 -translate-y-12 bg-${stat.color}-500 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-100 mb-8 bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Asset Control Bay */}
            <div className="space-y-10">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full lg:w-fit">
                        {['All', 'Manufacturing', 'Marketing', 'Operational'].map(cat => (
                            <button key={cat} onClick={() => setActiveTab(cat)} className={`flex-1 lg:flex-none px-8 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === cat ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 lg:max-w-md group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input type="text" placeholder="Scan SKU or component name..." value={stockSearch} onChange={e => setStockSearch(e.target.value)} className="input-modern !pl-14 bg-white shadow-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {filteredComponents.map(comp => (
                        <div key={comp.id} className="modern-card group flex flex-col hover:border-indigo-600/20">
                            <div className="p-10 flex-1">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                                        <Package className="w-7 h-7" />
                                    </div>
                                    <div className={`status-badge ${comp.quantity > 5 ? 'status-badge-success' : 'status-badge-error'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${comp.quantity > 5 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                                        {comp.quantity > 5 ? 'Steady' : 'Critical'}
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">{comp.category}</p>
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{comp.name}</h4>
                            </div>
                            <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex items-end justify-between group-hover:bg-white transition-colors">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Level</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{comp.quantity} <span className="text-xs text-slate-400 font-bold uppercase ml-1">Units</span></p>
                                </div>
                                <div className="h-1 w-16 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${comp.quantity > 20 ? 'w-full bg-emerald-500' : comp.quantity > 5 ? 'w-1/2 bg-amber-500' : 'w-1/4 bg-rose-500'}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audit Ledger */}
            <div className="modern-card overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-8 bg-slate-50/30">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                            <History className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Ledger</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Permanent Transaction History
                            </p>
                        </div>
                    </div>
                    <div className="relative w-full xl:max-w-lg group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input type="text" placeholder="Scan ledger for component, personnel or unit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-modern !pl-16 !py-4.5 bg-white" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900">
                                <th colSpan={2} className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type & Asset</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Volume</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Operational Detail</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Synchronization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                            {transactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="w-20 pl-10 py-7">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.type === 'IN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'}`}>
                                            {t.type === 'IN' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <p className="font-black text-slate-900 text-base tracking-tight uppercase">{t.component.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <UserIcon className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.user?.fullName || 'System Automated'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-center">
                                        <span className={`text-xl font-black tracking-tighter ${t.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>{t.type === 'IN' ? '+' : '-'}{t.quantity}</span>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400">
                                                {t.type === 'IN' ? <Building2 className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{t.type === 'IN' ? t.subcontractor?.companyName : t.takenOutFor}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                        <p className="text-sm font-black text-slate-900 tracking-tight">{new Date(t.date).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Modals Implementation */}
            {modals.add && (
                <Modal title="Register Component" subtitle="Define a new inventory resource" onClose={() => setModals({ ...modals, add: false })}>
                    <form onSubmit={async (e) => { e.preventDefault(); setSubmitting(true); await fetch('/api/inventory/components', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compForm) }); setModals({ ...modals, add: false }); fetchData(); setSubmitting(false) }} className="space-y-8">
                        <div className="space-y-2"><label className="label-style">Unique Component Name</label><input type="text" value={compForm.name} onChange={e => setCompForm({ ...compForm, name: e.target.value })} className="input-modern" required /></div>
                        <div className="space-y-2"><label className="label-style">Logistics Category</label><select value={compForm.category} onChange={e => setCompForm({ ...compForm, category: e.target.value })} className="input-modern !appearance-none"><option>Operational</option><option>Manufacturing</option><option>Marketing</option></select></div>
                        <div className="space-y-2"><label className="label-style">Technical Dossier / Description</label><textarea value={compForm.description || ''} onChange={e => setCompForm({ ...compForm, description: e.target.value })} className="input-modern h-32 resize-none" /></div>
                        <div className="flex gap-4"><button type="button" onClick={() => setModals({ ...modals, add: false })} className="btn-premium-ghost flex-1 font-black text-xs uppercase tracking-widest">Cancel</button><button type="submit" disabled={submitting} className="btn-premium-accent flex-[2] font-black text-xs uppercase tracking-widest">{submitting ? 'Processing...' : 'Register Asset Type'}</button></div>
                    </form>
                </Modal>
            )}

            {modals.in && (
                <Modal title="Stock Arrival" subtitle="Log incoming inventory logistics" color="emerald" onClose={() => setModals({ ...modals, in: false })}>
                    <div className="space-y-8">
                        <div className="space-y-2"><label className="label-style">Target Asset</label><select value={formData.componentId} onChange={e => setFormData({ ...formData, componentId: e.target.value })} className="input-modern !appearance-none"><option value="">Select component type...</option>{components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div className="space-y-2"><label className="label-style">Supply Chain Source</label><select value={formData.subcontractorId} onChange={e => setFormData({ ...formData, subcontractorId: e.target.value })} className="input-modern !appearance-none"><option value="">Select partner...</option>{subcontractors.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="label-style">Arrival Quantity</label><input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="input-modern" min="1" /></div>
                            <div className="space-y-2"><label className="label-style">Entry Date</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="input-modern" /></div>
                        </div>
                        <div className="flex gap-4"><button type="button" onClick={() => setModals({ ...modals, in: false })} className="btn-premium-ghost flex-1 font-black text-xs uppercase tracking-widest">Cancel</button><button onClick={() => handleTransaction('IN')} disabled={submitting || !formData.componentId || !formData.subcontractorId} className="btn-premium-accent !bg-emerald-600 hover:!bg-emerald-500 !shadow-emerald-500/20 flex-[2] font-black text-xs uppercase tracking-widest">{submitting ? 'Syncing...' : 'Finalize Arrival'}</button></div>
                    </div>
                </Modal>
            )}

            {modals.out && (
                <Modal title="Resource Usage" subtitle="Record deployment for operations" onClose={() => setModals({ ...modals, out: false })}>
                    <div className="space-y-8">
                        <div className="space-y-2"><label className="label-style">Deploy Component</label><select value={formData.componentId} onChange={e => setFormData({ ...formData, componentId: e.target.value })} className="input-modern !appearance-none"><option value="">Select from stock...</option>{components.map(c => <option key={c.id} value={c.id}>{c.name} (Avl: {c.quantity})</option>)}</select></div>
                        <div className="space-y-2"><label className="label-style">Deployment Purpose</label><input type="text" placeholder="e.g. Flight-7 Maintenance Burst" value={formData.takenOutFor} onChange={e => setFormData({ ...formData, takenOutFor: e.target.value })} className="input-modern" /></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="label-style">Dispatch Quantity</label><input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="input-modern" min="1" /></div>
                            <div className="space-y-2"><label className="label-style">Registry Date</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="input-modern" /></div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-center gap-4">
                            <Shield className="w-6 h-6 text-slate-400 shrink-0" />
                            <p className="text-[10px] font-black text-slate-500 uppercase leading-loose">Personnel: {session?.user?.name}. This movement is strictly monitored and logged for organizational compliance.</p>
                        </div>
                        <div className="flex gap-4"><button type="button" onClick={() => setModals({ ...modals, out: false })} className="btn-premium-ghost flex-1 font-black text-xs uppercase tracking-widest">Cancel</button><button onClick={() => handleTransaction('OUT')} disabled={submitting || !formData.componentId || !formData.takenOutFor} className="btn-premium-primary flex-[2] font-black text-xs uppercase tracking-widest">{submitting ? 'Logging...' : 'Authorize Dispatch'}</button></div>
                    </div>
                </Modal>
            )}

            <style jsx global>{`
                .label-style { display: block; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin-left: 8px; margin-bottom: 6px; }
            `}</style>
        </div>
    )
}

function Modal({ children, title, subtitle, onClose, color = 'slate' }: any) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-slide-up border border-white/20">
                <div className={`p-12 pb-8 flex items-center justify-between relative overflow-hidden ${color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-900'} text-white`}>
                    <div className="relative z-10 space-y-2">
                        <h3 className="text-3xl font-black tracking-tightest uppercase">{title}</h3>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{subtitle}</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 relative z-10 border border-white/5"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-12 pt-10">{children}</div>
            </div>
        </div>
    )
}
