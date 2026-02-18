'use client'

import {
    Building2,
    Calendar,
    Loader2,
    Mail,
    Phone,
    Plus,
    Trash2,
    User,
    Shield,
    Briefcase,
    ChevronRight,
    FileText,
    X,
    CheckCircle2,
    Database,
    ArrowUpRight,
    MapPin,
    Hash
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Subcontractor {
    id: string
    companyName: string
    type: string
    contactPerson: string | null
    contactEmail: string | null
    contactPhone: string | null
    agreementDate: string | null
}

export default function SubcontractorsPage() {
    const { data: session } = useSession()
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        companyName: '',
        type: 'Design',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        agreementDate: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchSubcontractors = async () => {
        try {
            const res = await fetch('/api/subcontractors')
            if (res.ok) {
                const data = await res.json()
                setSubcontractors(data)
            }
        } catch (error) {
            console.error('Failed to fetch subcontractors:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchSubcontractors()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/subcontractors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({
                    companyName: '',
                    type: 'Design',
                    contactPerson: '',
                    contactEmail: '',
                    contactPhone: '',
                    agreementDate: ''
                })
                fetchSubcontractors()
            } else {
                const err = await res.json()
                console.error(`Error: ${err.error || 'Failed to create subcontractor'}`)
            }
        } catch (error) {
            console.error('Failed to create subcontractor:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Termination protocols active. Dissolve partnership with this entity?')) return
        try {
            const res = await fetch(`/api/subcontractors/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchSubcontractors()
            }
        } catch (error) {
            console.error('Failed to delete subcontractor:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Partnership Data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">External Assets</span>
                        <div className="h-px w-8 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Network</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Subcontractor Registry</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                        Management of secondary manufacturing entities, design consultants, and external service agreements.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="premium-btn-primary flex items-center gap-2 py-4 px-8"
                >
                    <Plus className="w-5 h-5" />
                    Register Partnership
                </button>
            </div>

            {/* Subcontractors Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subcontractors.map((sub) => (
                    <div key={sub.id} className="premium-card group overflow-hidden">
                        <div className="p-8 pb-4">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 ${sub.type === 'Design' ? 'bg-indigo-900' : 'bg-slate-900'
                                    } text-white`}>
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                        title="Terminate Partnership"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${sub.type === 'Design' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
                                    }`}>
                                    {sub.type} Division
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-slate-800 transition-colors">
                                    {sub.companyName}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 group/item">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-slate-100 transition-colors">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium">{sub.contactPerson || 'Proprietor Unlisted'}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 group/item">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-slate-100 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium">{sub.contactEmail || 'No Digital Identity'}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 group/item">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover/item:bg-slate-100 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-medium">{sub.contactPhone || 'No Telecom Access'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-slate-100/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {sub.agreementDate ? `Agreement: ${new Date(sub.agreementDate).toLocaleDateString()}` : 'Date Pending'}
                                </span>
                            </div>
                            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {subcontractors.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                        <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-50">
                            <Briefcase className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Pristine Network Registry</h3>
                        <p className="text-slate-400 font-medium text-lg max-w-sm mx-auto">No subcontractors have been registered in the system network yet.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-8 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto"
                        >
                            Initialize Partnership <ChevronRight className="w-4 h-4" />
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
                                <h2 className="text-3xl font-black text-white tracking-tight">Partner Induction</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">External Asset registration</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="relative z-10 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company Entity *</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    placeholder="Enter Official Company Name"
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="input-premium py-4"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Partner Modality *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="input-premium py-4 cursor-pointer"
                                        required
                                    >
                                        <option value="Design">Design Division</option>
                                        <option value="Manufacturing">Manufacturing Div.</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Agreement Date</label>
                                    <input
                                        type="date"
                                        value={formData.agreementDate}
                                        onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                                        className="input-premium py-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Accountable Liaison</label>
                                <input
                                    type="text"
                                    value={formData.contactPerson}
                                    placeholder="Full Name of Primary Contact"
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="input-premium py-4"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Digital Mail</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        placeholder="contact@entity.com"
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="input-premium py-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Telecom Link</label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        placeholder="+91 ..."
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="input-premium py-4"
                                    />
                                </div>
                            </div>

                            <div className="pt-8">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Establishing Protocol...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                                            Authorize Partnership
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
