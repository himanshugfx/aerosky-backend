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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">Partner <span className="text-slate-400 font-medium">Network</span></h1>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full md:w-auto btn-premium-primary !py-3.5 lg:!py-4 shadow-2xl shadow-orange-500/10 group flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                    Register Partnership
                </button>
            </div>

            {/* Subcontractors Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subcontractors.map((sub) => (
                    <div key={sub.id} className="premium-card group overflow-hidden">
                        <div className="p-6 lg:p-8 pb-4">
                            <div className="flex items-start justify-between mb-6 lg:mb-8">
                                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 ${sub.type === 'Design' ? 'bg-indigo-900' : 'bg-slate-900'
                                    } text-white`}>
                                    <Building2 className="w-6 h-6 lg:w-7 lg:h-7" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="p-2.5 lg:p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                        title="Terminate Partnership"
                                    >
                                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6 lg:mb-8">
                                <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${sub.type === 'Design' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
                                    }`}>
                                    {sub.type} Division
                                </span>
                                <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight group-hover:text-slate-800 transition-colors">
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

                        <div className="mt-6 lg:mt-8 px-6 lg:px-8 py-4 lg:py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-slate-100/50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-xs">
                                    {sub.agreementDate ? `${new Date(sub.agreementDate).toLocaleDateString()}` : 'Date Pending'}
                                </span>
                            </div>
                            <button className="p-2 lg:p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                                <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Partner Induction</h2>
                                    <p className="text-xs text-slate-500">Register external entity or contractor</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Company Name *</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    placeholder="Enter company entity name"
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="input-modern"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Partner Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="input-modern cursor-pointer"
                                        required
                                    >
                                        <option value="Design">Design Division</option>
                                        <option value="Manufacturing">Manufacturing Division</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Agreement Date</label>
                                    <input
                                        type="date"
                                        value={formData.agreementDate}
                                        onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                                        className="input-modern"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Contact Person</label>
                                <input
                                    type="text"
                                    value={formData.contactPerson}
                                    placeholder="Primary contact full name"
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="input-modern"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Contact Email</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        placeholder="contact@entity.com"
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="input-modern"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        placeholder="+91..."
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="input-modern"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-premium-primary"
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                        </span>
                                    ) : (
                                        'Save Partner'
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
