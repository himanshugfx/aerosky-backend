'use client'

import {
    Loader2,
    Mail,
    Phone,
    Plus,
    Trash2,
    Users,
    Search,
    MoreVertical,
    Briefcase,
    ShieldCheck,
    MapPin,
    ArrowUpRight,
    XCircle,
    UserPlus,
    BadgeCheck,
    ChevronRight
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string
    position: string
    accessId?: string
    user?: { role: string }
}

const roleBadgeConfig: Record<string, string> = {
    'ADMIN': 'badge-primary',
    'SUPER_ADMIN': 'badge-primary',
    'OPERATIONS_MANAGER': 'badge-secondary',
    'QA_MANAGER': 'badge-warning',
    'PILOT': 'badge-success',
    'TECHNICIAN': 'badge-secondary',
    'VIEWER': 'badge-secondary',
}

export default function TeamPage() {
    const { data: session } = useSession()
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', position: '', accessId: '', role: 'VIEWER' })
    const [submitting, setSubmitting] = useState(false)

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/mobile/team')
            if (res.ok) {
                const data = await res.json()
                setTeam(data)
            }
        } catch (error) {
            console.error('Failed to fetch team:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchTeam()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ name: '', email: '', phone: '', position: '', accessId: '', role: 'VIEWER' })
                fetchTeam()
            }
        } catch (error) {
            console.error('Failed to create team member:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently remove this member from the organization?')) return
        try {
            await fetch(`/api/mobile/team/${id}`, { method: 'DELETE' })
            fetchTeam()
        } catch (error) {
            console.error('Failed to delete team member:', error)
        }
    }

    const filteredTeam = team.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.position.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-slate-900 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Personnel Directory</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organization Team</h2>
                    <p className="text-slate-500 font-medium">Manage personnel access and operational roles</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="premium-btn-primary flex items-center gap-3 py-3 px-6 text-sm"
                >
                    <UserPlus className="w-5 h-5" />
                    Onboard Member
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Personnel', value: team.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Remote Pilots', value: team.filter(m => m.user?.role === 'PILOT').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Operations Unit', value: team.filter(m => m.user?.role !== 'VIEWER').length, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-6 flex items-center gap-5">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search personnel by name, email, or position..."
                        className="input-premium pl-12 py-3 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800">
                                <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel Identity</th>
                                <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commissioned Role</th>
                                <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Communications</th>
                                <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Access</th>
                                <th className="text-right px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTeam.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                <span className="text-lg font-extrabold">{member.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 text-base leading-tight">{member.name}</p>
                                                {member.accessId && (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <BadgeCheck className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">REF ID: {member.accessId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{member.position || 'N/A'}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Duty</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                                                <Mail className="w-3.5 h-3.5 text-blue-500" /> {member.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                                                <Phone className="w-3.5 h-3.5 text-emerald-500" /> {member.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`badge ${roleBadgeConfig[member.user?.role || 'VIEWER']}`}>
                                            {member.user?.role?.replace('_', ' ') || 'VIEWER'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-90"
                                            title="Revoke Access"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTeam.length === 0 && (
                    <div className="text-center py-24 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">No Personnel Found</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">Initialize organizational growth by onboarding your first team member.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="px-10 py-8 bg-slate-900 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-extrabold text-white tracking-tight">Onboard Personnel</h3>
                                <p className="text-slate-400 text-sm font-medium">Provision new organization access</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90">
                                <XCircle className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Legal Name *</label>
                                <input
                                    type="text"
                                    placeholder="Full identity"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-premium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Reference/Access ID *</label>
                                <input
                                    type="text"
                                    placeholder="Employee / Staff ID"
                                    value={formData.accessId}
                                    onChange={(e) => setFormData({ ...formData, accessId: e.target.value })}
                                    className="input-premium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Operational Position</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lead Engineer"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="input-premium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Primary Email</label>
                                    <input
                                        type="email"
                                        placeholder="Corporate email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-premium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-premium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">System Privilege *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input-premium"
                                    required
                                >
                                    <option value="ADMIN">Administrator</option>
                                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                                    <option value="QA_MANAGER">QA Manager</option>
                                    <option value="PILOT">Remote Pilot</option>
                                    <option value="TECHNICIAN">Technician</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold text-blue-700 leading-normal">
                                    Credentials will be auto-generated. Username: <span className="underline italic">Email Address</span>. Temporary Key: <span className="underline italic">Phone Number</span>.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-8 py-4 text-slate-500 font-extrabold uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-slate-900 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Finalize Onboarding <ChevronRight className="w-4 h-4" /></>
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
