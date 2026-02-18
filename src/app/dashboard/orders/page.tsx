'use client'

import {
    Activity,
    AlertCircle,
    ArrowRight,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    Download,
    FileText,
    Layers,
    Loader2,
    MoreVertical,
    Package,
    Paperclip,
    Plus,
    Search,
    Settings,
    Shield,
    ShoppingCart,
    Tag,
    Upload,
    X,
    XCircle,
    TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface OrderUpload {
    id: string
    fileData: string
    fileName: string
}

interface Order {
    id: string
    contractNumber: string
    clientName: string
    clientSegment: string
    orderDate: string
    contractValue: number
    currency: string
    droneModel: string
    droneType: string
    weightClass: string
    manufacturingStage: string
    bomReadiness: string
    dgcaFaaCertificationStatus: string
    createdAt: string
    uploads?: OrderUpload[]
}

const stageConfig: Record<string, { color: string, ring: string, badge: string, icon: any }> = {
    'In Design': { color: 'text-indigo-600', ring: 'ring-indigo-100', badge: 'status-badge-info', icon: Layers },
    'Assembling': { color: 'text-amber-600', ring: 'ring-amber-100', badge: 'status-badge-warning', icon: Settings },
    'Testing': { color: 'text-purple-600', ring: 'ring-purple-100', badge: 'status-badge-info', icon: Activity },
    'Delivered': { color: 'text-emerald-600', ring: 'ring-emerald-100', badge: 'status-badge-success', icon: CheckCircle },
}

export default function OrdersPage() {
    const { data: session } = useSession()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('All')
    const [formData, setFormData] = useState({
        contractNumber: '',
        clientName: '',
        clientSegment: 'Commercial',
        droneModel: '',
        droneType: 'Multi-rotor',
        weightClass: 'Small',
        contractValue: '',
        orderDate: new Date().toISOString().split('T')[0],
        manufacturingStage: 'In Design',
        bomReadiness: 'Not Ready',
        dgcaFaaCertificationStatus: 'Pending',
        uploads: [] as { fileData: string, fileName: string }[]
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/mobile/orders')
            if (res.ok) {
                const data = await res.json()
                setOrders(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchOrders()
    }, [session])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newUploads = await Promise.all(Array.from(files).map(file => {
            return new Promise<{ fileData: string, fileName: string }>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    resolve({ fileData: reader.result as string, fileName: file.name })
                }
                reader.readAsDataURL(file)
            })
        }))

        setFormData(prev => ({ ...prev, uploads: [...prev.uploads, ...newUploads] }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.contractNumber || !formData.clientName || !formData.droneModel) {
            alert('Please fill in required fields')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    contractValue: parseFloat(formData.contractValue) || 0,
                    orderDate: new Date(formData.orderDate).toISOString(),
                })
            })

            if (res.ok) {
                setShowModal(false)
                setFormData({
                    contractNumber: '', clientName: '', clientSegment: 'Commercial', droneModel: '',
                    droneType: 'Multi-rotor', weightClass: 'Small', contractValue: '',
                    orderDate: new Date().toISOString().split('T')[0], manufacturingStage: 'In Design',
                    bomReadiness: 'Not Ready', dgcaFaaCertificationStatus: 'Pending', uploads: []
                })
                fetchOrders()
            }
        } catch (error) {
            console.error('Submit failed:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDownload = async (order: Order) => {
        try {
            const res = await fetch(`/api/orders/download?ids=${order.id}&format=pdf`);
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${order.contractNumber}_Specification.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        }
    }

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.droneModel.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'All') return matchesSearch;
        if (activeTab === 'Active') return matchesSearch && o.manufacturingStage !== 'Delivered';
        if (activeTab === 'Delivered') return matchesSearch && o.manufacturingStage === 'Delivered';
        return matchesSearch;
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                    <ShoppingCart className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Accessing Global Ledger</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-slide-up pb-20">
            {/* Contextual Navigation */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="status-badge status-badge-info">Manufacturing Hub</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Pipeline</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Manufacturing <span className="text-slate-400">Ledger</span></h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                        Monitor high-precision airframe production, contract fulfillment, and real-time manufacturing telemetry.
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-premium-accent !py-4 shadow-2xl shadow-indigo-600/20 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    Initialize Production
                </button>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Live Pipeline', value: orders.length, icon: ShoppingCart, trend: '+3 Active', color: 'indigo' },
                    { label: 'In Assembly', value: orders.filter(o => ['Assembling', 'Testing'].includes(o.manufacturingStage)).length, icon: Settings, trend: 'Optimal', color: 'amber' },
                    { label: 'Vetted Units', value: orders.filter(o => o.manufacturingStage === 'Delivered').length, icon: CheckCircle, trend: '100% Quality', color: 'emerald' },
                    { label: 'AUM Value', value: `₹${(orders.reduce((acc, o) => acc + o.contractValue, 0) / 1000000).toFixed(1)}M`, icon: TrendingUp, trend: 'Net Growth', color: 'violet' },
                ].map((stat, i) => (
                    <div key={i} className="modern-card p-8 group overflow-hidden">
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:rotate-3 transition-all duration-500 ${stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                        stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                            stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                                    }`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-tight">{stat.trend}</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stage Control Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Scan for contract, client or airframe model..."
                        className="input-modern !pl-14 bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {['All', 'Active', 'Delivered'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset Ledger Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredOrders.map((order) => {
                    const stage = stageConfig[order.manufacturingStage] || stageConfig['In Design']
                    return (
                        <div key={order.id} className="modern-card group flex flex-col hover:border-indigo-600/20">
                            <div className="p-10 flex-1">
                                <div className="flex items-start justify-between mb-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                            <Shield className="w-3 h-3" />
                                            <span>Secure Instance</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tightest group-hover:text-indigo-600 transition-colors uppercase">{order.contractNumber}</h3>
                                    </div>
                                    <div className={`status-badge ${stage.badge} scale-110`}>
                                        <stage.icon className="w-3 h-3" />
                                        {order.manufacturingStage}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100 text-slate-400">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Client</p>
                                            <p className="text-sm font-bold text-slate-700">{order.clientName}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:bg-slate-50 transition-colors">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Layers className="w-3 h-3" /> Platform
                                            </p>
                                            <p className="text-sm font-black text-slate-900">{order.droneModel}</p>
                                        </div>
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:bg-slate-50 transition-colors">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3" /> Value
                                            </p>
                                            <p className="text-sm font-black text-indigo-600">₹{order.contractValue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                <div className="flex gap-5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                        <Calendar className="w-3.5 h-3.5" /> {new Date(order.orderDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                                        <Paperclip className="w-3.5 h-3.5" /> {order.uploads?.length || 0} Assets
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownload(order)}
                                    className="w-10 h-10 bg-white text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm flex items-center justify-center group/btn"
                                >
                                    <Download className="w-4.5 h-4.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* System Modal: Resource Initialization */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden animate-slide-up border border-white/20">
                        {/* Modal Header */}
                        <div className="p-12 pb-8 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Plus className="w-64 h-64 rotate-12" />
                            </div>
                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Initialize Operational Instance</span>
                                </div>
                                <h3 className="text-4xl font-black tracking-tightest uppercase">New Manufacturing <span className="text-slate-500 font-medium">Contract</span></h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 relative z-10 border border-white/5">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 pt-10 grid md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Primary Configuration */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Contract Metadata</h4>
                                    <div className="space-y-2">
                                        <label className="label-style">Contract Number</label>
                                        <input type="text" placeholder="e.g. AS-IND-2024-001" value={formData.contractNumber} onChange={e => setFormData({ ...formData, contractNumber: e.target.value })} className="input-modern" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-style">Enterprise Client</label>
                                        <input type="text" placeholder="Partner organization name" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="input-modern" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="label-style">Sector</label>
                                            <select value={formData.clientSegment} onChange={e => setFormData({ ...formData, clientSegment: e.target.value })} className="input-modern !appearance-none">
                                                <option>Commercial</option>
                                                <option>Defense</option>
                                                <option>Logistics</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-style">Contract Value (₹)</label>
                                            <input type="number" placeholder="Net INR" value={formData.contractValue} onChange={e => setFormData({ ...formData, contractValue: e.target.value })} className="input-modern" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Configuration */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Technical Specification</h4>
                                    <div className="space-y-2">
                                        <label className="label-style">Platform Model</label>
                                        <input type="text" placeholder="e.g. AeroX-Heavy" value={formData.droneModel} onChange={e => setFormData({ ...formData, droneModel: e.target.value })} className="input-modern" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="label-style">Airframe</label>
                                            <select value={formData.droneType} onChange={e => setFormData({ ...formData, droneType: e.target.value })} className="input-modern">
                                                <option>Multi-rotor</option>
                                                <option>Fixed-wing</option>
                                                <option>VTOL</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-style">Commission Date</label>
                                            <input type="date" value={formData.orderDate} onChange={e => setFormData({ ...formData, orderDate: e.target.value })} className="input-modern" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Asset Upload */}
                            <div className="md:col-span-2 space-y-6 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Documentation</h4>
                                <div className="flex gap-8">
                                    <label className="w-1/3 flex flex-col items-center justify-center p-10 bg-white border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-indigo-500 transition-all group">
                                        <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-600 mb-4 transition-all" />
                                        <p className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-[0.1em]">Attach Specs</p>
                                        <input type="file" className="hidden" multiple onChange={handleFileChange} />
                                    </label>
                                    <div className="flex-1 space-y-3">
                                        {formData.uploads.map((u, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 bg-indigo-50 flex items-center justify-center rounded-xl">
                                                        <FileText className="w-4.5 h-4.5 text-indigo-600" />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700">{u.fileName}</span>
                                                </div>
                                                <button type="button" onClick={() => setFormData(p => ({ ...p, uploads: p.uploads.filter((_, idx) => idx !== i) }))}>
                                                    <XCircle className="w-5 h-5 text-slate-200 hover:text-rose-500 transition-colors" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-premium-ghost flex-1 !py-5 uppercase tracking-widest text-xs font-black">Hold Request</button>
                                <button type="submit" disabled={submitting} className="btn-premium-accent flex-[2] !py-5 uppercase tracking-widest text-xs font-black shadow-2xl shadow-indigo-600/20">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Production Cycle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .label-style {
                    display: block;
                    font-size: 10px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    margin-left: 8px;
                }
            `}</style>
        </div>
    )
}
