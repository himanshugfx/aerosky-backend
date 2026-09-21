'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate } from '@/lib/date'
import {
    ChevronLeft,
    Mail,
    Phone,
    Building2,
    Calendar,
    Clock,
    Plus,
    Send,
    Loader2,
    CheckCircle2,
    StickyNote,
    History,
    MoreVertical,
    TrendingUp,
    MapPin,
    AlertCircle
} from 'lucide-react'

interface Lead {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
    value?: number
    source: string
    stageId: string
    notes?: string
    stage: { name: string, color: string }
    activities: any[]
    followUps: any[]
    createdAt: string
}

export default function LeadDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [lead, setLead] = useState<Lead | null>(null)
    const [loading, setLoading] = useState(true)
    const [newNote, setNewNote] = useState('')
    const [addingNote, setAddingNote] = useState(false)
    const [showFollowUpModal, setShowFollowUpModal] = useState(false)
    const [followUpData, setFollowUpData] = useState({
        title: '',
        description: '',
        scheduledAt: ''
    })

    const fetchLead = async () => {
        try {
            const res = await fetch(`/api/leads/${id}`)
            if (res.ok) {
                const data = await res.json()
                setLead(data)
            } else {
                router.push('/dashboard/leads')
            }
        } catch (error) {
            console.error('Failed to fetch lead:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLead()
    }, [id])

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newNote.trim()) return
        setAddingNote(true)
        try {
            await fetch(`/api/leads/${id}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'NOTE', content: newNote })
            })
            setNewNote('')
            fetchLead()
        } catch (error) {
            console.error('Failed to add note:', error)
        } finally {
            setAddingNote(false)
        }
    }

    const handleScheduleFollowUp = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/leads/${id}/follow-ups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(followUpData)
            })
            if (res.ok) {
                setShowFollowUpModal(false)
                setFollowUpData({ title: '', description: '', scheduledAt: '' })
                fetchLead()
            }
        } catch (error) {
            console.error('Failed to schedule follow-up:', error)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Lead Neural Profile</p>
        </div>
    )

    if (!lead) return null

    return (
        <div className="space-y-10 animate-slide-up pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black uppercase text-[10px] tracking-widest">
                    <ChevronLeft className="w-4 h-4" /> Back to Pipeline
                </button>
                <div className="flex gap-4">
                    <button onClick={() => setShowFollowUpModal(true)} className="btn-premium-secondary !py-3 !px-6">Schedule Follow-up</button>
                    <button className="btn-premium-primary !py-3 !px-6">Convert to Order</button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Profile Card */}
                <div className="xl:col-span-2 space-y-10">
                    <div className="modern-card p-8 relative overflow-hidden">
                        <div className="relative flex items-start justify-between">
                            <div className="flex gap-8">
                                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-slate-900/30">
                                    {lead.name?.charAt(0) || '?'}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tightest">{lead.name || 'Unnamed Lead'}</h1>
                                        {lead.stage ? (
                                            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100" style={{ backgroundColor: lead.stage.color + '10', color: lead.stage.color }}>
                                                {lead.stage.name}
                                            </span>
                                        ) : (
                                            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-400">
                                                Unassigned
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                            <Building2 className="w-4 h-4 opacity-40" />
                                            <span className="text-sm">{lead.company || 'Private Entity'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                            <Mail className="w-4 h-4 opacity-40" />
                                            <span className="text-sm">{lead.email || 'No email provided'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                            <TrendingUp className="w-4 h-4 opacity-40 text-orange-600" />
                                            <span className="text-sm font-bold uppercase tracking-tightest italic">{lead.source || 'MANUAL'}</span>
                                        </div>
                                        {lead.phone && (
                                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                <Phone className="w-4 h-4 opacity-40" />
                                                <span className="text-sm">{lead.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 text-right">Potential Value</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter text-right">₹{(lead.value || 0).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Discovery & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="modern-card p-10 space-y-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                <History className="w-4 h-4 text-orange-600" /> Interaction Stats
                            </h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <span className="text-sm font-bold text-slate-400">Registry Date</span>
                                    <span className="text-sm font-black text-slate-900">{formatDate(lead.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-400">Account ID</span>
                                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">{lead.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        </div>

                        <div className="modern-card p-10 flex flex-col">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 mb-8">
                                <StickyNote className="w-4 h-4 text-orange-600" /> Internal Notes
                            </h3>
                            <form onSubmit={handleAddNote} className="space-y-4 flex-1 flex flex-col">
                                <textarea
                                    className="input-modern flex-1 !p-6 !rounded-[2rem] text-sm font-medium leading-relaxed resize-none bg-slate-50/50"
                                    placeholder="Append operational notes or mission requirements..."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={addingNote || !newNote.trim()}
                                    className="btn-premium-primary !py-4 flex items-center justify-center gap-3"
                                >
                                    {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Commit Note</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="modern-card p-10 space-y-10">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <History className="w-4 h-4 text-orange-600" /> Interaction Timeline
                        </h3>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                            {lead.activities.map((activity, idx) => (
                                <div key={activity.id} className="relative pl-14 group">
                                    <div className="absolute left-0 top-0 w-10 h-10 rounded-2xl bg-white border-2 border-slate-50 flex items-center justify-center text-slate-400 group-hover:border-orange-200 group-hover:text-orange-600 transition-all">
                                        {activity.type === 'NOTE' ? <StickyNote className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-slate-900">{activity.type}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {new Date(activity.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/30 p-4 rounded-2xl border border-slate-50/50">
                                            {activity.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Follow-ups */}
                <div className="space-y-10">
                    <div className="modern-card p-6 bg-slate-900 text-white overflow-hidden relative">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                            Next Steps <TrendingUp className="w-4 h-4 text-orange-400" />
                        </h3>
                        <div className="space-y-6">
                            {lead.followUps.length === 0 ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                                        <AlertCircle className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p className="text-sm font-bold text-white/40">No pending follow-ups</p>
                                </div>
                            ) : (
                                lead.followUps.map(f => (
                                    <div key={f.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                        <p className="text-sm font-black mb-2">{f.title}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> {new Date(f.scheduledAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Follow-up Modal - Clean & Blur-Free */}
            {showFollowUpModal && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0" 
                        onClick={() => setShowFollowUpModal(false)} 
                    />
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 relative z-10">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Schedule Follow-up</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Set a reminder or engagement note</p>
                            </div>
                            <button 
                                onClick={() => setShowFollowUpModal(false)} 
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleFollowUp} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">Objective *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Technical Proposal Review"
                                    required
                                    className="input-modern"
                                    value={followUpData.title}
                                    onChange={e => setFollowUpData({ ...followUpData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="input-modern"
                                    value={followUpData.scheduledAt}
                                    onChange={e => setFollowUpData({ ...followUpData, scheduledAt: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700">Details / Notes</label>
                                <textarea
                                    className="input-modern h-24 resize-none"
                                    placeholder="Add any context or talking points..."
                                    value={followUpData.description}
                                    onChange={e => setFollowUpData({ ...followUpData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFollowUpModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                                >
                                    Save Follow-up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
