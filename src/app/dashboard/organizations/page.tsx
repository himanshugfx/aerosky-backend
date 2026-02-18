'use client'

import {
    Building2,
    Loader2,
    Plus,
    Trash2,
    Users,
    Shield,
    ChevronRight,
    Mail,
    Phone,
    MapPin,
    Search,
    Filter,
    Activity,
    ArrowUpRight,
    Settings,
    Database,
    X,
    CheckCircle2
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Organization {
    id: string
    name: string
    email: string
    phone: string
    address?: string
    createdAt: string
    _count?: { users: number }
}

export default function OrganizationsPage() {
    const { data: session } = useSession()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/mobile/organizations', {
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` }
            })
            if (res.ok) {
                const data = await res.json()
                setOrganizations(data)
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) {
            fetchOrganizations()
        }
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ name: '', email: '', phone: '', address: '' })
                fetchOrganizations()
            }
        } catch (error) {
            console.error('Failed to create organization:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Discard this enterprise entity? All associated data will be purged.')) return
        try {
            const res = await fetch(`/api/mobile/organizations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` }
            })
            if (res.ok) {
                fetchOrganizations()
            }
        } catch (error) {
            console.error('Failed to delete organization:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Enterprise Core...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Enterprise Hub</span>
                        <div className="h-px w-8 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization Directory</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Enterprise Entities</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                        Management of registered organizations, enterprise permissions, and cross-platform infrastructure.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="premium-btn-primary flex items-center gap-2 py-4 px-8"
                >
                    <Plus className="w-5 h-5" />
                    Register New Enterprise
                </button>
            </div>

            {/* Organizations Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {organizations.map((org) => (
                    <div key={org.id} className="premium-card group overflow-hidden">
                        <div className="p-8 pb-4">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <button
                                    onClick={() => handleDelete(org.id)}
                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                    title="Purge Entity"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-1 mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-slate-800 transition-colors">
                                    {org.name}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Enterprise</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 group/item">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-slate-100 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium">{org.email}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 group/item">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-slate-100 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium">{org.phone}</p>
                                </div>
                                {org.address && (
                                    <div className="flex items-start gap-3 text-slate-600 group/item">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-slate-100 transition-colors">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed">{org.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(3, org._count?.users || 0))].map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                                            <Users className="w-3 h-3 text-slate-500" />
                                        </div>
                                    ))}
                                    {(org._count?.users || 0) > 3 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                            +{(org._count?.users || 0) - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {org._count?.users || 0} Licensed Personnel
                                </span>
                            </div>
                            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {organizations.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                        <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-50">
                            <Database className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Pristine Entity Registry</h3>
                        <p className="text-slate-400 font-medium text-lg max-w-sm mx-auto">No enterprises have been registered in the system yet. Initialize the first entity to begin operations.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-8 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto"
                        >
                            Initialize First Enterprise <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="px-12 py-10 bg-slate-900 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative z-10 space-y-1">
                                <h2 className="text-3xl font-black text-white tracking-tight">Register Entity</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Enterprise induction protocol</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="relative z-10 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Enterprise Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    placeholder="Enter Official Name"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-premium py-4"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Administrative Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    placeholder="enterprise@domain.com"
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-premium py-4"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Contact Telemetry *</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    placeholder="+1 (000) 000-0000"
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-premium py-4"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Physical Headquarters</label>
                                <textarea
                                    value={formData.address}
                                    rows={3}
                                    placeholder="Enter complete office address..."
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-premium py-4 resize-none"
                                />
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex gap-3">
                                    <Settings className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                                        System protocol: An administrative user will be automatically initialized using the email as identification and phone as the primary access credential.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Initializing Identity...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                            Finalize Enterprise Registry
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-full mt-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    Abort Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
