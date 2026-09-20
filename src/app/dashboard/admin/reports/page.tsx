'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { 
    FileText, 
    Plus, 
    Search, 
    Filter, 
    Download, 
    Calendar, 
    Tag, 
    User, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Shield, 
    Trash2, 
    Eye, 
    X, 
    Loader2, 
    Upload, 
    FileCheck, 
    BarChart3, 
    TrendingUp, 
    DollarSign, 
    Plane, 
    Building2,
    RefreshCw,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Report {
    id: string
    title: string
    description: string
    category: string
    status: string
    period?: string | null
    attachment?: string | null
    fileName?: string | null
    fileSize?: string | null
    tags?: string | null
    userId: string
    createdAt: string
    updatedAt: string
    user: {
        id: string
        fullName?: string | null
        username: string
        email?: string | null
        role: string
    }
}

interface Metrics {
    totalReports: number
    recentCount: number
    operationsCount: number
    financialCount: number
    complianceCount: number
}

const CATEGORIES = [
    'All',
    'Financial',
    'Operations',
    'Drone Fleet',
    'Safety & Compliance',
    'Team & HR',
    'General'
]

const STATUS_OPTIONS = ['published', 'draft', 'archived']

export default function ReportsPage() {
    const { data: session, status: sessionStatus } = useSession()
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATION'].includes(session?.user?.role || '')

    const [reports, setReports] = useState<Report[]>([])
    const [metrics, setMetrics] = useState<Metrics>({
        totalReports: 0,
        recentCount: 0,
        operationsCount: 0,
        financialCount: 0,
        complianceCount: 0
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [viewingReport, setViewingReport] = useState<Report | null>(null)
    const [deletingReportId, setDeletingReportId] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'Operations',
        period: '',
        status: 'published',
        tags: '',
        description: '',
        attachment: '',
        fileName: '',
        fileSize: ''
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchReports = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchQuery.trim()) params.set('search', searchQuery.trim())
            if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory)
            if (selectedStatus && selectedStatus !== 'All') params.set('status', selectedStatus)

            const res = await fetch(`/api/admin/reports?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setReports(data.reports || [])
                if (data.metrics) setMetrics(data.metrics)
            } else {
                console.error('Failed to fetch reports')
            }
        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAdmin) {
            fetchReports()
        }
    }, [isAdmin, selectedCategory, selectedStatus])

    // Debounced search
    useEffect(() => {
        if (!isAdmin) return
        const timer = setTimeout(() => {
            fetchReports()
        }, 350)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Handle File Upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 3.5 * 1024 * 1024) {
            setActionError('File size exceeds 3.5MB. Please upload a file smaller than 3.5MB.')
            return
        }

        const formattedSize = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
            : `${(file.size / 1024).toFixed(1)} KB`

        const reader = new FileReader()
        reader.onload = () => {
            setFormData(prev => ({
                ...prev,
                attachment: reader.result as string,
                fileName: file.name,
                fileSize: formattedSize
            }))
            setActionError(null)
        }
        reader.onerror = () => {
            setActionError('Failed to read selected file.')
        }
        reader.readAsDataURL(file)
    }

    const removeAttachment = () => {
        setFormData(prev => ({
            ...prev,
            attachment: '',
            fileName: '',
            fileSize: ''
        }))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleCreateReport = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionError(null)
        setActionSuccess(null)
        setActionLoading(true)

        try {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            let data: any = {}
            const contentType = res.headers.get('content-type') || ''
            if (contentType.includes('application/json')) {
                data = await res.json()
            } else {
                const text = await res.text()
                console.warn('Non-JSON server response:', res.status, text)
                data = { error: text || `Server error (HTTP ${res.status})` }
            }

            if (res.ok) {
                setActionSuccess('Report successfully compiled and saved.')
                setIsCreateModalOpen(false)
                // Reset form
                setFormData({
                    title: '',
                    category: 'Operations',
                    period: '',
                    status: 'published',
                    tags: '',
                    description: '',
                    attachment: '',
                    fileName: '',
                    fileSize: ''
                })
                fetchReports()
            } else {
                setActionError(data?.error || data?.message || `Failed to create report (HTTP ${res.status})`)
            }
        } catch (error: any) {
            console.error('Report submission network error:', error)
            setActionError(error?.message || 'Network error occurred while submitting report.')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteReport = async (id: string) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setReports(prev => prev.filter(r => r.id !== id))
                if (viewingReport?.id === id) setViewingReport(null)
                setDeletingReportId(null)
                fetchReports()
            } else {
                alert('Failed to delete report.')
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('Failed to delete report.')
        } finally {
            setActionLoading(false)
        }
    }

    const downloadAttachment = (report: Report) => {
        if (!report.attachment) return
        const a = document.createElement('a')
        a.href = report.attachment
        a.download = report.fileName || `${report.title.replace(/\s+/g, '_')}_Report.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    // Unauthorized state
    if (sessionStatus !== 'loading' && !isAdmin) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full premium-card p-10 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center mx-auto text-rose-600 shadow-sm">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
                        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                            Administrative report repository is strictly restricted to personnel with Administration or Executive credentials.
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const getCategoryBadgeClass = (category: string) => {
        switch (category.toLowerCase()) {
            case 'financial':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200'
            case 'operations':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200'
            case 'drone fleet':
                return 'bg-sky-50 text-sky-700 border-sky-200'
            case 'safety & compliance':
                return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'team & hr':
                return 'bg-purple-50 text-purple-700 border-purple-200'
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">
                        Administrative <span className="text-slate-400 font-medium">Reports</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                        EXECUTIVE AUDITING & STRATEGIC INTELLIGENCE DOSSIER
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => fetchReports()}
                        disabled={loading}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center"
                        title="Refresh Reports"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => {
                            setActionError(null)
                            setIsCreateModalOpen(true)
                        }}
                        className="btn-premium-primary !px-6 !py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/10 flex-1 md:flex-initial"
                    >
                        <Plus className="w-4 h-4" />
                        Compile New Report
                    </button>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="premium-card p-6 border-l-4 border-l-slate-900 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Dossiers</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.totalReports}</h3>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {metrics.recentCount} compiled this month
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                <div className="premium-card p-6 border-l-4 border-l-indigo-600 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operations & Fleet</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.operationsCount}</h3>
                        <p className="text-[10px] font-bold text-indigo-600 mt-1">Flight & Maintenance</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Plane className="w-6 h-6" />
                    </div>
                </div>

                <div className="premium-card p-6 border-l-4 border-l-emerald-600 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial & Audits</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.financialCount}</h3>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1">Fiscal Balances & Costs</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="premium-card p-6 border-l-4 border-l-amber-600 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance & Safety</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.complianceCount}</h3>
                        <p className="text-[10px] font-bold text-amber-600 mt-1">Regulatory & Safety Logs</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Shield className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="premium-card p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search Input */}
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search title, content, author, tags..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 pt-3">
                    {CATEGORIES.map((cat) => {
                        const active = selectedCategory === cat
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    active 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                            >
                                {cat}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Reports Content List */}
            {loading ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading administrative dossiers...</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="premium-card p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900">No Reports Found</h3>
                        <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
                            {searchQuery || selectedCategory !== 'All' 
                                ? 'No administrative reports match your active filter criteria.' 
                                : 'No executive reports have been recorded yet. Click "Compile New Report" to author the first record.'}
                        </p>
                    </div>
                    {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
                        <button
                            onClick={() => {
                                setSearchQuery('')
                                setSelectedCategory('All')
                                setSelectedStatus('All')
                            }}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => {
                        const authorName = report.user?.fullName || report.user?.username || 'Executive Officer'
                        const initial = authorName.charAt(0).toUpperCase()
                        const hasFile = Boolean(report.attachment)
                        const dateStr = new Date(report.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })

                        return (
                            <div
                                key={report.id}
                                className="premium-card p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group border border-slate-200/80 hover:border-slate-400"
                            >
                                <div className="space-y-4">
                                    {/* Top Meta */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getCategoryBadgeClass(report.category)}`}>
                                            {report.category}
                                        </span>
                                        {report.period && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                {report.period}
                                            </span>
                                        )}
                                    </div>

                                    {/* Title & Preview */}
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-slate-800 transition-colors line-clamp-1">
                                            {report.title}
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                                            {report.description}
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    {report.tags && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {report.tags.split(',').map((t, idx) => (
                                                <span key={idx} className="text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                                    #{t.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Attached Document Card */}
                                    {hasFile && (
                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{report.fileName || 'Attached Document'}</p>
                                                    {report.fileSize && <p className="text-[10px] text-slate-400 font-semibold">{report.fileSize}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => downloadAttachment(report)}
                                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                                title="Download Attachment"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Author & Action Footer */}
                                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                            {initial}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 leading-tight">{authorName}</p>
                                            <p className="text-[10px] font-medium text-slate-400">{dateStr}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setViewingReport(report)}
                                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                                            title="View Report Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to delete "${report.title}"?`)) {
                                                    handleDeleteReport(report.id)
                                                }
                                            }}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                            title="Delete Report"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Report Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-8 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Compile Administrative Report</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Author a new strategic intelligence document</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {actionError && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{actionError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateReport} className="space-y-5">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Report Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Q3 Fleet Performance & Financial Overview"
                                    className="input-premium py-3"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="input-premium py-3 cursor-pointer"
                                    >
                                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Period */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Reporting Period</label>
                                    <input
                                        type="text"
                                        value={formData.period}
                                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                        placeholder="e.g. Q3 2026 or Sept 2026"
                                        className="input-premium py-3"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="input-premium py-3 cursor-pointer"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                {/* Tags */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Tags (Comma Separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="Audit, Q3, Fleet, Safety"
                                        className="input-premium py-3"
                                    />
                                </div>
                            </div>

                            {/* Detailed Description / Summary */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Executive Summary & Detailed Notes *</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide comprehensive details, findings, audit results, and recommendations..."
                                    className="input-premium py-3 leading-relaxed"
                                />
                            </div>

                            {/* File Upload / Attachment */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Attach File / Document (PDF, Image, Spreadsheet up to 3.5MB)</label>
                                {formData.attachment ? (
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileCheck className="w-6 h-6 text-emerald-600" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{formData.fileName}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold">{formData.fileSize}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeAttachment}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
                                    >
                                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-800">Click to upload document attachment</p>
                                        <p className="text-[10px] text-slate-400 mt-1">PDF, Excel, Word, PNG, JPG (Max 3.5MB)</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.csv"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !formData.title.trim() || !formData.description.trim()}
                                    className="btn-premium-primary !px-8 !py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        'Publish Report'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Report Detail Modal */}
            {viewingReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-8 space-y-6">
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getCategoryBadgeClass(viewingReport.category)}`}>
                                        {viewingReport.category}
                                    </span>
                                    {viewingReport.period && (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {viewingReport.period}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100">
                                        {viewingReport.status}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{viewingReport.title}</h2>
                            </div>
                            <button
                                onClick={() => setViewingReport(null)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Author & Timestamp bar */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                    {(viewingReport.user?.fullName || viewingReport.user?.username || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900">
                                        {viewingReport.user?.fullName || viewingReport.user?.username}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-400">
                                        {viewingReport.user?.role?.replace('_', ' ')} • {viewingReport.user?.email}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiled On</p>
                                <p className="text-xs font-bold text-slate-700">
                                    {new Date(viewingReport.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Description / Content Body */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Executive Summary & Findings</h4>
                            <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-200/80 text-slate-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                {viewingReport.description}
                            </div>
                        </div>

                        {/* Tags */}
                        {viewingReport.tags && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {viewingReport.tags.split(',').map((t, idx) => (
                                        <span key={idx} className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                            #{t.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Attachment Download */}
                        {viewingReport.attachment && (
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileCheck className="w-6 h-6 text-emerald-600" />
                                    <div>
                                        <p className="text-xs font-black text-emerald-900">{viewingReport.fileName || 'Report Document'}</p>
                                        <p className="text-[10px] text-emerald-600 font-semibold">{viewingReport.fileSize || 'Attached file'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadAttachment(viewingReport)}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    if (confirm(`Delete "${viewingReport.title}"?`)) {
                                        handleDeleteReport(viewingReport.id)
                                    }
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Report
                            </button>
                            <button
                                onClick={() => setViewingReport(null)}
                                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
