'use client'

import {
    AlertCircle,
    CheckCircle,
    Clock,
    FileText,
    HelpCircle,
    Loader2,
    MessageCircle,
    MessageSquare,
    Plus,
    Send,
    Shield,
    ChevronRight,
    ArrowUpRight,
    Search,
    Filter,
    X,
    CheckCircle2,
    LifeBuoy,
    User,
    Building2,
    Calendar,
    AlertTriangle,
    Zap,
    Lock
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Ticket {
    id: string
    subject: string
    status: string
    priority: string
    createdAt: string
    updatedAt: string
    user?: { fullName: string }
    organization?: { name: string }
    hasNewReply?: boolean
    _count?: { messages: number }
}

const statusConfig: Record<string, { icon: any, color: string, bg: string, ring: string }> = {
    OPEN: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
    IN_PROGRESS: { icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' },
    RESOLVED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
    CLOSED: { icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50', ring: 'ring-slate-200' },
}

const priorityConfig: Record<string, { color: string, bg: string, label: string }> = {
    LOW: { color: 'text-slate-500', bg: 'bg-slate-50', label: 'Routine' },
    NORMAL: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Standard' },
    HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High Priority' },
    URGENT: { color: 'text-red-600', bg: 'bg-red-50', label: 'Critical Ops' },
}

export default function SupportPage() {
    const { data: session } = useSession()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ subject: '', message: '', priority: 'NORMAL' })
    const [submitting, setSubmitting] = useState(false)

    const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/mobile/support')
            if (res.ok) {
                const data = await res.json()
                setTickets(data)
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchTickets()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ subject: '', message: '', priority: 'NORMAL' })
                fetchTickets()
            }
        } catch (error) {
            console.error('Failed to create ticket:', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Support Channels...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#1e293b] text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Support Channel</span>
                        <div className="h-px w-8 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SuperAdmin Direct</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Command Support Link</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                        {isSuperAdmin
                            ? 'Administration of direct assistance requests and platform operational support.'
                            : 'Encrypted communication channel with the platform Super Admin for immediate operational assistance.'}
                    </p>
                </div>
                {!isSuperAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="premium-btn-primary flex items-center gap-2 py-4 px-8"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Secure Chat Link
                    </button>
                )}
            </div>

            {/* Main Ledger Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase transition-all duration-300">
                            Communication Ledger
                        </h2>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">
                            {tickets.length} CHANNELS
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Transmissions..."
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                            />
                        </div>
                        <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto border-none">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Subject Topic</th>
                                    {isSuperAdmin && (
                                        <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Origin Identity</th>
                                    )}
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Channel Status</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Priority Level</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Telemetry</th>
                                    <th className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Last Sync</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tickets.map((ticket) => {
                                    const status = statusConfig[ticket.status] || statusConfig.OPEN
                                    const StatusIcon = status.icon
                                    const priority = priorityConfig[ticket.priority] || priorityConfig.NORMAL

                                    return (
                                        <tr key={ticket.id} className="group hover:bg-slate-50/50 transition-colors duration-300">
                                            <td className="px-8 py-6">
                                                <Link href={`/dashboard/support/${ticket.id}`} className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-900 group-hover:text-slate-700 transition-colors leading-none">
                                                            {ticket.subject}
                                                        </p>
                                                        {!isSuperAdmin && ticket.hasNewReply && (
                                                            <div className="flex items-center gap-1.5 pt-1">
                                                                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Incoming Signal</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            {isSuperAdmin && (
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                                                            {ticket.user?.fullName?.charAt(0)}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-900">{ticket.user?.fullName}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{ticket.organization?.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${status.bg} ${status.color} ${status.ring}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {ticket.status.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${priority.bg} ${priority.color}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${priority.color.replace('text-', 'bg-')}`}></div>
                                                    {priority.label}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-500">
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-black">{ticket._count?.messages || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-slate-900">{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Sync</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {tickets.length === 0 && (
                        <div className="text-center py-24 bg-slate-50/30">
                            <div className="w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-50">
                                <LifeBuoy className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Secure Link Idle</h3>
                            <p className="text-slate-400 font-medium text-lg max-w-sm mx-auto">
                                {isSuperAdmin ? 'No transmission records found in the repository.' : 'Establish a direct link with the Super Admin to receive immediate assistance.'}
                            </p>
                            {!isSuperAdmin && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-8 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto"
                                >
                                    Open Channel <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e293b]/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="px-12 py-10 bg-[#1e293b] flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative z-10 space-y-1">
                                <h2 className="text-3xl font-black text-white tracking-tight">Direct Support Link</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Start Secure Communication</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="relative z-10 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Chat Topic *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    placeholder="What do you need help with?"
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="input-premium py-4"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Priority *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(priorityConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: key })}
                                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.priority === key
                                                ? 'bg-orange-600 border-orange-600 text-white shadow-lg'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={5}
                                    placeholder="Describe your situation in detail..."
                                    className="input-premium py-4 resize-none"
                                    required
                                />
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl shadow-orange-600/30 hover:bg-orange-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Opening Channel...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            Start Chat
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-full mt-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
