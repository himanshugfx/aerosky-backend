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
    LayoutGrid,
    LayoutList,
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
    const [searchComponentIn, setSearchComponentIn] = useState('')
    const [searchComponentOut, setSearchComponentOut] = useState('')
    const [isComponentDropdownOpenIn, setIsComponentDropdownOpenIn] = useState(false)
    const [isComponentDropdownOpenOut, setIsComponentDropdownOpenOut] = useState(false)
    const [activeTab, setActiveTab] = useState('All')
    const [bucketFilter, setBucketFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')
    const [modals, setModals] = useState({ in: false, out: false, add: false })
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        componentId: '', quantity: 1, subcontractorId: '', takenOutFor: '', otherSupplierName: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    })
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
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
                    componentId: formData.componentId,
                    type,
                    quantity: Number(formData.quantity),
                    subcontractorId: type === 'IN' ? (formData.subcontractorId === 'other' ? null : formData.subcontractorId || null) : null,
                    takenOutFor: type === 'OUT' ? (formData.takenOutFor || null) : (type === 'IN' && formData.subcontractorId === 'other' ? (formData.otherSupplierName || null) : null),
                    date: `${formData.date}T${formData.time}:00`
                })
            })
            if (res.ok) {
                setModals({ ...modals, in: false, out: false })
                setFormData({ ...formData, componentId: '', quantity: 1, otherSupplierName: '', subcontractorId: '', takenOutFor: '' })
                setSearchComponentIn('')
                setSearchComponentOut('')
                fetchData()
            }
        } finally { setSubmitting(false) }
    }

    const filteredComponents = components.filter(c => {
        const matchesTab = activeTab === 'All' || c.category === activeTab;
        const matchesSearch = c.name.toLowerCase().includes(stockSearch.toLowerCase());
        const matchesBucket = bucketFilter === 'all' 
            ? true 
            : (bucketFilter === 'in_stock' ? c.quantity > 0 : c.quantity === 0);
        return matchesTab && matchesSearch && matchesBucket;
    })

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Logistics Grid</p>
        </div>
    )

    return (
        <div className="space-y-8 animate-slide-up pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">Inventory <span className="text-slate-400">Logistics</span></h1>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 lg:gap-4 w-full md:w-auto">
                    <button onClick={() => setModals({ ...modals, add: true })} className="w-full sm:w-auto btn-premium-ghost border border-slate-200 !py-3.5 px-6 text-[11px] font-black uppercase tracking-widest order-3 sm:order-1">
                        <Plus className="w-4 h-4" /> New Category
                    </button>
                    <button onClick={() => setModals({ ...modals, in: true })} className="w-full sm:w-auto btn-premium-accent bg-emerald-600 hover:bg-emerald-700 !py-3.5 shadow-xl shadow-emerald-500/10 group order-1 sm:order-2">
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        Arrival
                    </button>
                    <button onClick={() => setModals({ ...modals, out: true })} className="w-full sm:w-auto btn-premium-primary !py-3.5 shadow-xl shadow-slate-900/10 group order-2 sm:order-3">
                        <ArrowDownRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                        Usage
                    </button>
                </div>
            </div>

            {/* Global Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total components', value: components.length, icon: Boxes, color: 'indigo', filter: 'all' },
                    { label: 'Components in stock', value: components.filter(c => c.quantity > 0).length, icon: Package, color: 'emerald', filter: 'in_stock' },
                    { label: 'Component out of stock', value: components.filter(c => c.quantity === 0).length, icon: AlertCircle, color: 'rose', filter: 'out_of_stock' },
                    { label: 'Monthly movements', value: transactions.length, icon: Activity, color: 'violet', isScroll: true },
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        onClick={() => {
                            if (stat.filter) setBucketFilter(stat.filter as any);
                            else if (stat.isScroll) document.getElementById('audit-ledger')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`modern-card p-6 lg:p-8 group overflow-hidden relative cursor-pointer transition-all ${stat.filter && bucketFilter === stat.filter ? 'ring-2 ring-indigo-500 shadow-xl scale-[1.02]' : 'hover:-translate-y-1'}`}
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full translate-x-12 -translate-y-12 bg-${stat.color}-500 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative">
                            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center border border-slate-100 mb-6 lg:mb-8 bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6 lg:w-7 lg:h-7" />
                            </div>
                            <p className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Asset Control Bay */}
            <div className="space-y-10">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full lg:w-fit overflow-x-auto no-scrollbar">
                        {['All', 'Manufacturing', 'Marketing', 'Operational'].map(cat => (
                            <button key={cat} onClick={() => setActiveTab(cat)} className={`flex-1 lg:flex-none px-4 lg:px-8 py-2.5 lg:py-3 text-[9px] lg:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === cat ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 lg:max-w-md group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input type="text" placeholder="Scan SKU or component name..." value={stockSearch} onChange={e => setStockSearch(e.target.value)} className="input-modern !pl-14 bg-white shadow-sm" />
                    </div>
                    
                    {/* View Toggle */}
                    <div className="flex p-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid className="w-4.5 h-4.5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutList className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {viewMode === 'grid' ? (
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
                ) : (
                    <div className="modern-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                                        <th className="px-4 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Classification</th>
                                        <th className="px-4 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                                        <th className="px-4 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right hidden sm:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredComponents.map(comp => (
                                        <tr key={comp.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 lg:px-8 py-4 lg:py-6">
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-100 rounded-lg lg:rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shrink-0">
                                                        <Package className="w-4 h-4 lg:w-5 lg:h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 text-xs lg:text-sm truncate">{comp.name}</p>
                                                        <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">UID: {comp.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-8 py-4 lg:py-6 hidden md:table-cell">
                                                <span className="text-[9px] lg:text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                    {comp.category}
                                                </span>
                                            </td>
                                            <td className="px-4 lg:px-8 py-4 lg:py-6">
                                                <div className="flex items-center gap-2 lg:gap-3">
                                                    <p className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter">{comp.quantity}</p>
                                                    <div className="h-1 w-8 lg:h-1.5 lg:w-12 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                                        <div className={`h-full ${comp.quantity > 20 ? 'w-full bg-emerald-500' : comp.quantity > 5 ? 'w-1/2 bg-amber-500' : 'w-1/4 bg-rose-500'}`} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-8 py-4 lg:py-6 text-right hidden sm:table-cell">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${comp.quantity > 5 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 animation-pulse'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${comp.quantity > 5 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{comp.quantity > 5 ? 'Steady' : 'Critical'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Ledger */}
            <div id="audit-ledger" className="modern-card overflow-hidden">
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
                                            <span className="text-xs font-bold text-slate-600">{t.type === 'IN' ? (t.subcontractor?.companyName || t.takenOutFor) : t.takenOutFor}</span>
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
                        <div className="space-y-2 relative">
                            <label className="label-style">Target Asset</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search and select component..." value={searchComponentIn} onChange={e => { setSearchComponentIn(e.target.value); setIsComponentDropdownOpenIn(true); }} onFocus={() => setIsComponentDropdownOpenIn(true)} onBlur={() => setTimeout(() => setIsComponentDropdownOpenIn(false), 200)} className="input-modern !pl-11 w-full" />
                                {isComponentDropdownOpenIn && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
                                        {components.filter(c => c.name.toLowerCase().includes(searchComponentIn.toLowerCase())).length > 0 ? components.filter(c => c.name.toLowerCase().includes(searchComponentIn.toLowerCase())).map(c => (
                                            <div key={c.id} className={`px-4 py-3 cursor-pointer rounded-xl transition-all ${formData.componentId === c.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`} onMouseDown={() => { setFormData({ ...formData, componentId: c.id }); setSearchComponentIn(c.name); setIsComponentDropdownOpenIn(false); }}>
                                                {c.name} <span className="text-[10px] ml-2 font-bold uppercase text-slate-400">({c.category})</span>
                                            </div>
                                        )) : (
                                            <div className="px-4 py-3 text-sm text-slate-400">No components found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2"><label className="label-style">Supply Chain Source</label><select value={formData.subcontractorId} onChange={e => setFormData({ ...formData, subcontractorId: e.target.value })} className="input-modern !appearance-none mb-2"><option value="">Select partner...</option>{subcontractors.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}<option value="other">Others (Specify below)</option></select>{formData.subcontractorId === 'other' && (<input type="text" placeholder="Enter custom supplier name..." value={formData.otherSupplierName} onChange={e => setFormData({ ...formData, otherSupplierName: e.target.value })} className="input-modern" />)}</div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="label-style">Arrival Quantity</label><input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="input-modern" min="1" /></div>
                            <div className="space-y-2"><label className="label-style">Entry Date</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="input-modern" /></div>
                        </div>
                        <div className="flex gap-4"><button type="button" onClick={() => setModals({ ...modals, in: false })} className="btn-premium-ghost flex-1 font-black text-xs uppercase tracking-widest">Cancel</button><button onClick={() => handleTransaction('IN')} disabled={submitting || !formData.componentId || !formData.subcontractorId || (formData.subcontractorId === 'other' && !formData.otherSupplierName)} className="btn-premium-accent !bg-emerald-600 hover:!bg-emerald-500 !shadow-emerald-500/20 flex-[2] font-black text-xs uppercase tracking-widest">{submitting ? 'Syncing...' : 'Finalize Arrival'}</button></div>
                    </div>
                </Modal>
            )}

            {modals.out && (
                <Modal title="Resource Usage" subtitle="Record deployment for operations" onClose={() => setModals({ ...modals, out: false })}>
                    <div className="space-y-8">
                        <div className="space-y-2 relative">
                            <label className="label-style">Deploy Component</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search and select component..." value={searchComponentOut} onChange={e => { setSearchComponentOut(e.target.value); setIsComponentDropdownOpenOut(true); }} onFocus={() => setIsComponentDropdownOpenOut(true)} onBlur={() => setTimeout(() => setIsComponentDropdownOpenOut(false), 200)} className="input-modern !pl-11 w-full" />
                                {isComponentDropdownOpenOut && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
                                        {components.filter(c => c.name.toLowerCase().includes(searchComponentOut.toLowerCase())).length > 0 ? components.filter(c => c.name.toLowerCase().includes(searchComponentOut.toLowerCase())).map(c => (
                                            <div key={c.id} className={`flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl transition-all ${formData.componentId === c.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`} onMouseDown={() => { setFormData({ ...formData, componentId: c.id }); setSearchComponentOut(c.name); setIsComponentDropdownOpenOut(false); }}>
                                                <span>{c.name}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${c.quantity > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>Avl: {c.quantity}</span>
                                            </div>
                                        )) : (
                                            <div className="px-4 py-3 text-sm text-slate-400">No components found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
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

import ClientPortal from '@/components/ClientPortal'

function Modal({ children, title, subtitle, onClose, color = 'slate' }: any) {
    return (
        <ClientPortal selector="body">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 lg:p-6 animate-in fade-in duration-500">
                <div 
                    className="absolute inset-0 z-0" 
                    onClick={onClose}
                />
                <div className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-slide-up border border-white/20 relative z-10 transition-all duration-500">
                    <div className={`p-6 lg:p-12 pb-6 lg:pb-8 flex items-center justify-between relative overflow-hidden ${color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-900'} text-white`}>
                        <div className="relative z-10 space-y-2">
                            <h3 className="text-xl lg:text-3xl font-black tracking-tightest uppercase">{title}</h3>
                            <p className="text-white/60 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">{subtitle}</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 hover:bg-white/20 rounded-xl lg:rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 relative z-10 border border-white/5"><X className="w-5 h-5 lg:w-6 lg:h-6" /></button>
                    </div>
                    <div className="p-6 lg:p-12 pt-6 lg:pt-10">{children}</div>
                </div>
            </div>
        </ClientPortal>
    )
}
