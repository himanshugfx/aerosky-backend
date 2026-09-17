'use client'

import {
    Users,
    TrendingUp,
    Filter,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    Building2,
    Search,
    ChevronRight,
    Loader2,
    Calendar,
    DollarSign,
    Target,
    LayoutList,
    Calendar as CalendarIcon
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import FollowUpCalendar from '@/components/FollowUpCalendar'

interface Lead {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
    value?: number
    source: string
    stageId: string
    createdAt: string
    stage: {
        name: string
        color: string
    }
}

interface FunnelStats {
    totalLeads: number
    wonLeads: number
    totalValue: { _sum: { value: number | null } }
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [stages, setStages] = useState<any[]>([])
    const [stats, setStats] = useState<FunnelStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStage, setFilterStage] = useState('all')
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

    const fetchData = async () => {
        try {
            const res = await fetch('/api/funnel')
            const data = await res.json()
            setStages(data.stages || [])
            setStats(data.stats || null)
            
            const leadsRes = await fetch('/api/leads')
            const leadsData = await leadsRes.json()
            setLeads(Array.isArray(leadsData) ? leadsData : [])
        } catch (error) {
            console.error('Failed to fetch lead data:', error)
        } finally {
            setLoading(false)
        }
    }

    const [formSubmitting, setFormSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        value: 0,
        source: 'Website',
        stageId: ''
    })
    const [customSource, setCustomSource] = useState('')

    useEffect(() => {
        if (stages.length > 0 && !formData.stageId) {
            setFormData(prev => ({ ...prev, stageId: stages[0].id }))
        }
    }, [stages])

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormSubmitting(true)
        try {
            const finalData = { ...formData, source: formData.source === 'Custom' ? customSource : formData.source }
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            })
            if (res.ok) {
                setShowAddModal(false)
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                    value: 0,
                    source: 'Website',
                    stageId: stages[0]?.id || ''
                })
                setCustomSource('')
                fetchData()
            }
        } catch (error) {
            console.error('Failed to add lead:', error)
        } finally {
            setFormSubmitting(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                             (lead.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesStage = filterStage === 'all' || lead.stageId === filterStage
        return matchesSearch && matchesStage
    })

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin" />
            <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Funnel Telemetry</p>
        </div>
    )

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Track enquiries, pipeline stages, and conversion metrics</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-premium-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Lead</span>
                </button>
            </div>

            {/* View Toggle */}
            <div className="flex p-1 bg-slate-200/60 rounded-lg w-fit">
                <button
                    onClick={() => setViewMode('list')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <LayoutList className="w-3.5 h-3.5" /> Pipeline View
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <CalendarIcon className="w-3.5 h-3.5" /> Calendar View
                </button>
            </div>

            {viewMode === 'list' ? (
                <>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard 
                    label="Total Inquiries" 
                    value={stats?.totalLeads || 0} 
                    icon={Target} 
                    color="orange" 
                />
                <MetricCard 
                    label="Converted" 
                    value={stats?.wonLeads || 0} 
                    icon={TrendingUp} 
                    color="emerald" 
                />
                <MetricCard 
                    label="Pipeline Value" 
                    value={`₹${(stats?.totalValue?._sum?.value || 0).toLocaleString('en-IN')}`} 
                    icon={DollarSign} 
                    color="blue" 
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search leads by name or company..."
                        className="input-modern !pl-10 !py-2 text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        className="input-modern !py-2 !px-3 min-w-[150px] text-xs bg-white cursor-pointer"
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                    >
                        <option value="all">All Stages</option>
                        {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leads Table / Pipeline List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                <th className="px-5 py-3">Lead Info</th>
                                <th className="px-5 py-3">Company</th>
                                <th className="px-5 py-3">Value</th>
                                <th className="px-5 py-3">Stage</th>
                                <th className="px-5 py-3">Origin</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                                        No leads found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-slate-900 text-sm">{lead.name}</div>
                                            <div className="text-slate-400 text-xs flex items-center gap-2 mt-0.5">
                                                {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                                                {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-slate-700">{lead.company || '—'}</td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                                            {lead.value ? `₹${lead.value.toLocaleString('en-IN')}` : '—'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span 
                                                className="px-2.5 py-1 rounded-full text-[11px] font-medium inline-block border"
                                                style={{ 
                                                    borderColor: lead.stage?.color ? `${lead.stage.color}40` : '#cbd5e1',
                                                    backgroundColor: lead.stage?.color ? `${lead.stage.color}15` : '#f1f5f9',
                                                    color: lead.stage?.color || '#475569'
                                                }}
                                            >
                                                {lead.stage?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">{lead.source}</td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Link 
                                                href={`/dashboard/leads/${lead.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                            >
                                                View <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            ) : (
                <FollowUpCalendar />
            )}

            {/* Add Lead Modal - Clean & Blur-Free */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0"
                        onClick={() => setShowAddModal(false)} 
                    />
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 relative z-10">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">New Lead Inquiry</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Enter contact and qualification details</p>
                            </div>
                            <button 
                                onClick={() => setShowAddModal(false)} 
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleAddLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Contact Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        required
                                        className="input-modern"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="email@company.com"
                                        className="input-modern"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91..."
                                        className="input-modern"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Organization</label>
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        className="input-modern"
                                        value={formData.company}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Pipeline Value (INR)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="input-modern"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Lead Origin</label>
                                    <select
                                        className="input-modern bg-white"
                                        value={formData.source}
                                        onChange={e => setFormData({ ...formData, source: e.target.value })}
                                    >
                                        <option value="Website">Website</option>
                                        <option value="Reference">Reference</option>
                                        <option value="Cold calls">Cold calls</option>
                                        <option value="Custom">Custom / Other</option>
                                    </select>
                                </div>
                                {formData.source === 'Custom' && (
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-medium text-orange-600">Specify Origin</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Industry Expo 2024"
                                            className="input-modern"
                                            value={customSource}
                                            onChange={e => setCustomSource(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-medium text-slate-700">Funnel Stage</label>
                                    <select
                                        className="input-modern bg-white"
                                        value={formData.stageId}
                                        onChange={e => setFormData({ ...formData, stageId: e.target.value })}
                                    >
                                        <option value="">Select Stage</option>
                                        {stages.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {formSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span>Save Lead</span>
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

function MetricCard({ label, value, icon: Icon, color }: any) {
    const colorClasses: Record<string, { bg: string, text: string, border: string }> = {
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    }
    const theme = colorClasses[color] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }

    return (
        <div className="modern-card p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
            </div>
        </div>
    )
}
