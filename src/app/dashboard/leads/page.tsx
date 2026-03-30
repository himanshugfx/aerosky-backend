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
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="status-badge status-badge-success">Active Pipeline</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Engines Online</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tightest">Lead <span className="text-slate-400 font-medium">Intelligence</span></h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                        Strategic lead management and funnel optimization. Monitor acquisition velocity and conversion metrics across all segments.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full lg:w-auto btn-premium-primary !py-4 lg:!py-5 shadow-2xl shadow-orange-500/20 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    Initialize Lead
                </button>
            </div>

            {/* View Toggle */}
            <div className="flex p-1.5 bg-slate-100 rounded-[1.25rem] w-full lg:w-fit overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 lg:flex-none px-4 lg:px-8 py-2.5 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LayoutList className="w-4 h-4" /> Pipeline Ledger
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex-1 lg:flex-none px-4 lg:px-8 py-2.5 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CalendarIcon className="w-4 h-4" /> Calendar
                </button>
            </div>

            {viewMode === 'list' ? (
                <>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MetricCard 
                    label="Total Acquisition" 
                    value={stats?.totalLeads || 0} 
                    icon={Target} 
                    color="orange" 
                />
                <MetricCard 
                    label="Conversion Success" 
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
            <div className="flex flex-col lg:row gap-4 lg:gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        className="input-modern !pl-14 lg:!pl-16 !py-4 lg:!py-5 shadow-sm bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <select 
                        className="flex-1 lg:flex-none input-modern !py-4 lg:!py-5 !px-6 lg:!px-8 min-w-0 lg:min-w-[200px] font-black uppercase text-[10px] lg:text-[11px] tracking-widest appearance-none bg-white cursor-pointer"
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

            {/* Leads Table */}
            <div className="modern-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 lg:px-8 py-4 lg:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-4 lg:px-8 py-4 lg:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">Company</th>
                                <th className="px-4 lg:px-8 py-4 lg:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stage</th>
                                <th className="px-4 lg:px-8 py-4 lg:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Value</th>
                                <th className="px-4 lg:px-8 py-4 lg:py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden lg:table-cell">Discovery</th>
                                <th className="px-4 lg:px-8 py-4 lg:py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 lg:px-8 py-4 lg:py-6">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-900 rounded-xl lg:rounded-2xl flex items-center justify-center text-[10px] lg:text-[11px] font-black text-white shrink-0">
                                                {lead.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <Link href={`/dashboard/leads/${lead.id}`} className="block text-xs lg:text-sm font-black text-slate-900 hover:text-orange-600 transition-colors truncate">{lead.name || 'Unnamed Lead'}</Link>
                                                <div className="text-[10px] lg:text-[11px] font-medium text-slate-400 truncate">{lead.email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-8 py-4 lg:py-6 hidden md:table-cell">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <Building2 className="w-4 h-4 opacity-40" />
                                            <span className="text-xs uppercase tracking-tight truncate">{lead.company || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-8 py-4 lg:py-6">
                                        <div className="flex items-center gap-2">
                                            {lead.stage ? (
                                                <>
                                                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0" style={{ backgroundColor: lead.stage.color }} />
                                                    <span className="text-[9px] lg:text-[10px] font-black text-slate-900 uppercase tracking-widest">{lead.stage.name}</span>
                                                </>
                                            ) : (
                                                <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-8 py-4 lg:py-6">
                                        <div className="text-xs lg:text-sm font-black text-slate-900">₹{(lead.value || 0).toLocaleString('en-IN')}</div>
                                    </td>
                                    <td className="px-4 lg:px-8 py-4 lg:py-6 text-slate-400 hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 opacity-40" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                                {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 lg:px-8 py-4 lg:py-6 text-right">
                                        <button className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all">
                                            <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            ) : (
                <FollowUpCalendar />
            )}

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-slide-up border border-white/20">
                        <div className="p-6 lg:p-12 pb-6 lg:pb-8 flex items-center justify-between relative overflow-hidden bg-[#1e293b] text-white">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-[80px] rounded-full translate-x-32 -translate-y-32" />
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-2xl lg:text-4xl font-black tracking-tightest uppercase italic">New Inquiry</h3>
                                <p className="text-white/40 text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                    Lead Acquisition Registry <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-orange-400" />
                                </p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 lg:w-14 lg:h-14 bg-white/10 hover:bg-white/20 rounded-xl lg:rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 relative z-10 border border-white/5">
                                <Plus className="w-5 h-5 lg:w-7 lg:h-7 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleAddLead} className="p-6 lg:p-12 space-y-6 lg:y-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Name</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="input-modern shadow-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="email@company.com"
                                        className="input-modern shadow-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91..."
                                        className="input-modern shadow-sm"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization</label>
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        className="input-modern shadow-sm"
                                        value={formData.company}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Pipeline Value (INR)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="input-modern shadow-sm"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Origin</label>
                                    <select
                                        className="input-modern shadow-sm appearance-none bg-white font-bold text-sm"
                                        value={formData.source}
                                        onChange={e => setFormData({ ...formData, source: e.target.value })}
                                    >
                                        <option value="">Select Origin</option>
                                        <option value="Website">Website</option>
                                        <option value="Reference">Reference</option>
                                        <option value="Cold calls">Cold calls</option>
                                        <option value="Custom">Custom / Other</option>
                                    </select>
                                </div>
                                {formData.source === 'Custom' && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[11px] font-black text-orange-600 uppercase tracking-widest ml-1">Specify Origin</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Industry Expo 2024"
                                            className="input-modern shadow-sm border-orange-100 bg-orange-50/10 focus:border-orange-600"
                                            value={customSource}
                                            onChange={e => setCustomSource(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Funnel Stage</label>
                                    <select
                                        className="input-modern shadow-sm appearance-none bg-white font-bold text-sm"
                                        value={formData.stageId}
                                        onChange={e => setFormData({ ...formData, stageId: e.target.value })}
                                    >
                                        <option value="">No Stage</option>
                                        {stages.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="order-2 lg:order-1 px-10 py-4 lg:py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] lg:text-[11px] hover:text-slate-900 transition-colors"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="order-1 lg:order-2 flex-1 btn-premium-primary !py-4 lg:!py-5 shadow-2xl shadow-orange-500/20"
                                >
                                    {formSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <span className="flex items-center gap-2 lg:gap-3 justify-center text-xs lg:text-base font-black">Authorize Lead <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" /></span>
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
    return (
        <div className="modern-card p-6 lg:p-10 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 rounded-full translate-x-12 -translate-y-12 bg-${color}-600 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative flex items-center gap-4 lg:gap-8">
                <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[2rem] border border-${color}-100 flex items-center justify-center bg-${color}-50 text-${color}-600 shadow-sm transition-all duration-500 group-hover:bg-${color}-600 group-hover:text-white shrink-0`}>
                    <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div>
                    <p className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <p className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
                </div>
            </div>
        </div>
    )
}
