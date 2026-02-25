'use client'

import {
    Activity,
    Calendar,
    ChevronRight,
    Eye,
    Link as LinkIcon,
    Loader2,
    Plane,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    X,
    Cpu,
    Compass,
    Signal,
    Box
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Drone {
    id: string
    modelName: string
    webPortalLink?: string
    createdAt: string
    accountableManager?: { name: string }
    manufacturedUnits?: any[]
}

export default function DronesPage() {
    const { data: session } = useSession()
    const [drones, setDrones] = useState<Drone[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({ modelName: '', webPortalLink: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchDrones = async () => {
        try {
            const res = await fetch('/api/mobile/drones')
            if (res.ok) {
                const data = await res.json()
                setDrones(data)
            }
        } catch (error) {
            console.error('Failed to fetch drones:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchDrones()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/drones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ modelName: '', webPortalLink: '' })
                fetchDrones()
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Decommission this aircraft from active fleet registry? This action is irreversible.')) return
        try {
            await fetch(`/api/mobile/drones/${id}`, { method: 'DELETE' })
            fetchDrones()
        } catch (error) {
            console.error('Failed to delete drone:', error)
        }
    }

    const filteredDrones = drones.filter(d =>
        d.modelName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin" />
            <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Fleet Data</p>
        </div>
    )

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Mission Briefing Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="status-badge status-badge-success">Operational Fleet</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SkyControl Active</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tightest">Aerial <span className="text-slate-400 font-medium">Assets</span></h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                        Precision management of the AeroSky aerial fleet. Monitor specifications, deployment readiness, and technical compliance for all registered UAV units.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-premium-primary !py-5 shadow-2xl shadow-orange-500/20 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    Register Unit
                </button>
            </div>

            {/* Fleet Telemetry Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Active Fleet Size', value: drones.length, icon: Plane, color: 'orange' },
                    { label: 'Deployment Ready', value: drones.length, icon: Signal, color: 'emerald' },
                    { label: 'Compliance Health', value: '100%', icon: ShieldCheck, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className="modern-card p-10 group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 rounded-full translate-x-12 -translate-y-12 bg-${stat.color === 'orange' ? 'orange' : stat.color}-600 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative flex items-center gap-8">
                            <div className={`w-16 h-16 rounded-[2rem] border border-${stat.color === 'orange' ? 'orange' : stat.color}-100 flex items-center justify-center bg-${stat.color === 'orange' ? 'orange' : stat.color}-50 text-${stat.color === 'orange' ? 'orange' : stat.color}-600 shadow-sm transition-all duration-500 group-hover:bg-${stat.color === 'orange' ? 'orange' : stat.color}-600 group-hover:text-white`}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tactical Filter */}
            <div className="relative max-w-xl group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                <input
                    type="text"
                    placeholder="Search fleet by model, manufacturer or serial..."
                    className="input-modern !pl-16 !py-5 shadow-sm bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Aircraft Deployment Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredDrones.map((drone) => (
                    <div key={drone.id} className="modern-card group flex flex-col border-t-0 p-2">
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-10">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-900 group-hover:scale-110 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-sm relative">
                                    <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Plane className="w-8 h-8 relative z-10" />
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/dashboard/drones/${drone.id}`}
                                        className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                        title="System Diagnostics"
                                    >
                                        <Eye className="w-4.5 h-4.5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(drone.id)}
                                        className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                        title="Decommission Unit"
                                    >
                                        <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">UAV Systems</span>
                                        <div className="flex-1 h-[1px] bg-slate-100" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors uppercase">{drone.modelName}</h3>
                                </div>

                                {drone.accountableManager && (
                                    <div className="flex items-center gap-4 py-4 px-5 bg-slate-50 border border-slate-100 rounded-3xl group-hover:bg-white transition-colors">
                                        <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-[11px] font-black text-white uppercase shadow-lg shadow-slate-900/20">
                                            {drone.accountableManager.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-black text-slate-800 leading-tight truncate">{drone.accountableManager.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Mission Commander</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commissioned</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-800">{new Date(drone.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Box className="w-3.5 h-3.5 text-orange-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manufactured Units</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-800">{drone.manufacturedUnits?.length || 0} Registered Units</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDrones.length === 0 && (
                <div className="text-center py-32 modern-card bg-slate-50/30 border-dashed border-2 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-center mb-8">
                        <Plane className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Deployment Candidates Found</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mt-3">Register new aircraft units to expand your organization's aerial capabilities.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-slide-up border border-white/20">
                        <div className="p-12 pb-8 flex items-center justify-between relative overflow-hidden bg-[#1e293b] text-white">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-[80px] rounded-full translate-x-32 -translate-y-32" />
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-4xl font-black tracking-tightest uppercase italic">Fleet Entry</h3>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                    Aircraft Specification Registry <ShieldCheck className="w-4 h-4 text-orange-400" />
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 relative z-10 border border-white/5">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-10">
                            <div className="grid gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Aircraft Model Designation *</label>
                                    <div className="relative">
                                        <Plane className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="e.g. AeroX Phantom X1"
                                            value={formData.modelName}
                                            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                            className="input-modern !pl-16 shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Manufacturer Telemetry Portal</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="url"
                                            placeholder="https://telemetry.manufacturer.com"
                                            value={formData.webPortalLink}
                                            onChange={(e) => setFormData({ ...formData, webPortalLink: e.target.value })}
                                            className="input-modern !pl-16 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50/40 border border-orange-100 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-2xl rounded-full" />
                                <ShieldCheck className="w-8 h-8 text-orange-600 shrink-0 mt-1 relative z-10" />
                                <div className="relative z-10">
                                    <p className="text-sm font-black text-orange-900 mb-2 uppercase tracking-tight">Compliance Authentication</p>
                                    <p className="text-xs font-medium text-orange-700/80 leading-relaxed uppercase tracking-tighter">
                                        Registration initializes the digital twin protocol. All maintenance logs and structural inspections will be synchronized with this identifier.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:text-slate-900 transition-colors"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn-premium-primary !py-5 shadow-2xl shadow-orange-500/20"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <span className="flex items-center gap-3">Authorize Registry <ChevronRight className="w-5 h-5" /></span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
