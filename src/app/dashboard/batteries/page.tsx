'use client'

import {
    Battery,
    Loader2,
    Plus,
    Trash2,
    Zap,
    Activity,
    ShieldCheck,
    ArrowUpRight,
    X,
    CheckCircle2,
    Database,
    Cpu
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface BatteryItem {
    id: string
    model: string
    ratedCapacity: string
    batteryNumberA: string
    batteryNumberB: string
    createdAt: string
}

export default function BatteriesPage() {
    const { data: session } = useSession()
    const [batteries, setBatteries] = useState<BatteryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        pairNumber: '',
        ratedCapacity: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchBatteries = async () => {
        try {
            const res = await fetch('/api/mobile/batteries')
            if (res.ok) {
                const data = await res.json()
                setBatteries(data)
            }
        } catch (error) {
            console.error('Failed to fetch batteries:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchBatteries()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const pairNum = formData.pairNumber;
            const res = await fetch('/api/mobile/batteries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: `Pair ${pairNum}`,
                    ratedCapacity: formData.ratedCapacity,
                    batteryNumberA: `${pairNum}A`,
                    batteryNumberB: `${pairNum}B`
                })
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({
                    pairNumber: '',
                    ratedCapacity: ''
                })
                fetchBatteries()
            }
        } catch (error) {
            console.error('Failed to create battery:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently de-register this energy cell pair?')) return
        try {
            await fetch(`/api/mobile/batteries/${id}`, { method: 'DELETE' })
            fetchBatteries()
        } catch (error) {
            console.error('Failed to delete battery:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-slate-900 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Propulsion Energy Sync</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Energy Manifest</h2>
                    <p className="text-slate-500 font-medium">Monitoring and management of propulsion power systems</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="premium-btn-primary flex items-center gap-2 py-4 px-8"
                >
                    <Plus className="w-5 h-5" />
                    Initialize Power Cell
                </button>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-6 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pairs</p>
                        <p className="text-3xl font-black">{batteries.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5" />
                    </div>
                </div>
                <div className="premium-card p-6 border-t-4 border-t-emerald-500 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Status</p>
                        <p className="text-3xl font-black text-slate-900">Optimal</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                </div>
                <div className="premium-card p-6 border-t-4 border-t-indigo-500 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Cycle</p>
                        <p className="text-3xl font-black text-slate-900">{batteries.length > 0 ? 'Synchronized' : 'Standby'}</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Activity className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Batteries Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {batteries.map((battery) => (
                    <div key={battery.id} className="premium-card p-8 group relative overflow-hidden bg-white hover:border-slate-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-700"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl group-hover:bg-indigo-500 transition-colors">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => handleDelete(battery.id)}
                                    className="w-10 h-10 bg-white text-slate-300 hover:text-red-500 border border-slate-100 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 hover:border-red-100 shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Dual Cell Pair</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-4">
                                {battery.batteryNumberA} <span className="text-slate-300 mx-1">+</span> {battery.batteryNumberB}
                            </h3>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    {battery.ratedCapacity || 'Standard'}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                                    <Cpu className="w-3.5 h-3.5" />
                                    BMS Active
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {batteries.length === 0 && (
                <div className="premium-card p-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 mx-auto border border-slate-100 shadow-inner">
                        <Battery className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">No Propulsion Manifest</h3>
                    <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs mx-auto">Propulsion energy cells must be registered before flight operations can be authorized.</p>
                </div>
            )}

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="px-10 py-8 bg-slate-900 flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-white tracking-tight">Register Power Cell</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">New Propulsion Unit Initiation</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hardware Pair Number *</label>
                                <input
                                    type="number"
                                    value={formData.pairNumber}
                                    onChange={(e) => setFormData({ ...formData, pairNumber: e.target.value })}
                                    placeholder="e.g. 01"
                                    className="input-premium py-4"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rated Capacity (mAh) *</label>
                                <input
                                    type="text"
                                    value={formData.ratedCapacity}
                                    onChange={(e) => setFormData({ ...formData, ratedCapacity: e.target.value })}
                                    placeholder="e.g. 22000 mAh"
                                    className="input-premium py-4"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 px-6 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 rounded-2xl transition-all border border-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-4 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Initializing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Commit Power Cell
                                        </>
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
