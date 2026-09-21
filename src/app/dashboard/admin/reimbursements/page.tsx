'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    Download,
    FileText,
    Image as ImageIcon,
    Loader2,
    CheckCircle,
    Clock,
    XCircle,
    Calendar,
    User,
    Search,
    TrendingUp,
    Receipt,
    Wallet,
    ShieldCheck,
    Filter,
    Eye,
    AlertCircle,
    RefreshCw
} from 'lucide-react'
import { ReceiptModal } from '@/components/ReceiptModal'
import { formatDate, formatDateTime } from '@/lib/date'
import * as XLSX from 'xlsx'

interface Reimbursement {
    id: string
    name: string
    category?: string
    amount: number
    date: string
    billData: string
    status: string
    userId: string
    createdAt: string
    user: {
        fullName: string
        username: string
        role: string
    }
}

type StatusFilterType = 'ALL' | 'Pending' | 'Approved' | 'Completed' | 'Rejected'

export default function AdminReimbursementsPage() {
    const { data: session } = useSession()
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL')
    const [selectedReceipt, setSelectedReceipt] = useState<Reimbursement | null>(null)

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATION'

    const fetchReimbursements = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true)
        try {
            const res = await fetch('/api/reimbursements')
            if (res.ok) {
                const data = await res.json()
                setReimbursements(data)
            }
        } catch (error) {
            console.error('Failed to fetch reimbursements:', error)
        } finally {
            setLoading(false)
            if (isManualRefresh) setRefreshing(false)
        }
    }

    useEffect(() => {
        if (session) fetchReimbursements()
    }, [session])

    const exportToExcel = () => {
        const dataToExport = filtered.map(r => ({
            'Purpose / Description': r.name,
            'Team Member': r.user?.fullName || r.user?.username || 'Unknown',
            'Role': r.user?.role || 'N/A',
            'Category': r.category || 'General',
            'Amount (INR)': r.amount,
            'Expense Date': formatDate(r.date),
            'Status': r.status,
            'Submitted At': formatDateTime(r.createdAt),
            'Has Receipt': r.billData ? 'Yes' : 'No'
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Team_Reimbursements')
        XLSX.writeFile(wb, `AeroSky_Team_Reimbursements_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': 
                return {
                    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    dot: 'bg-emerald-500',
                    label: 'Approved'
                }
            case 'completed': 
                return {
                    pill: 'bg-blue-50 text-blue-700 border-blue-200',
                    dot: 'bg-blue-500',
                    label: 'Disbursed'
                }
            case 'rejected': 
                return {
                    pill: 'bg-rose-50 text-rose-700 border-rose-200',
                    dot: 'bg-rose-500',
                    label: 'Rejected'
                }
            default: 
                return {
                    pill: 'bg-amber-50 text-amber-700 border-amber-200',
                    dot: 'bg-amber-500',
                    label: 'Pending Audit'
                }
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id)
        try {
            const res = await fetch('/api/reimbursements', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })
            if (res.ok) {
                setReimbursements(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
            } else {
                const errData = await res.json()
                alert(`Error: ${errData.error || 'Failed to update status'}`)
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    // Counts for tabs
    const counts = {
        all: reimbursements.length,
        pending: reimbursements.filter(r => r.status.toLowerCase() === 'pending').length,
        approved: reimbursements.filter(r => r.status.toLowerCase() === 'approved').length,
        completed: reimbursements.filter(r => r.status.toLowerCase() === 'completed').length,
        rejected: reimbursements.filter(r => r.status.toLowerCase() === 'rejected').length,
    }

    // Financial calculations
    const stats = {
        pendingAmount: reimbursements.filter(r => r.status.toLowerCase() === 'pending').reduce((acc, curr) => acc + curr.amount, 0),
        approvedAmount: reimbursements.filter(r => r.status.toLowerCase() === 'approved').reduce((acc, curr) => acc + curr.amount, 0),
        completedAmount: reimbursements.filter(r => r.status.toLowerCase() === 'completed').reduce((acc, curr) => acc + curr.amount, 0),
        totalAmount: reimbursements.reduce((acc, curr) => acc + curr.amount, 0),
    }

    const filtered = reimbursements.filter(r => {
        const matchesSearch = 
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.user?.fullName && r.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.user?.username && r.user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'ALL' || r.status.toLowerCase() === statusFilter.toLowerCase()

        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-orange-600 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Reimbursement Records...</p>
            </div>
        )
    }

    if (!isAdmin) return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldCheck className="w-16 h-16 text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-900">Restricted Domain</h2>
            <p className="text-slate-500 mt-2">Personnel credentials insufficient for administrative reimbursement auditing.</p>
        </div>
    )

    return (
        <div className="space-y-8 animate-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                            Administration Domain
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs font-semibold text-slate-500">Team Auditing</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                        Team <span className="text-orange-600">Reimbursements</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        Review, verify receipts, and disburse reimbursement claims submitted by team members from Operations.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => fetchReimbursements(true)}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        title="Refresh Claims"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 text-slate-500" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Pending Audit</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">₹{stats.pendingAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] font-semibold text-amber-600 mt-1">{counts.pending} claim{counts.pending === 1 ? '' : 's'} awaiting review</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Approved Reserve</span>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">₹{stats.approvedAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-1">{counts.approved} claim{counts.approved === 1 ? '' : 's'} ready to disburse</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Disbursed Total</span>
                        <Wallet className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">₹{stats.completedAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] font-semibold text-blue-600 mt-1">{counts.completed} paid claim{counts.completed === 1 ? '' : 's'}</div>
                </div>

                <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">All Claims</span>
                        <Receipt className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-black text-white">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] font-semibold text-slate-300 mt-1">{counts.all} total claim{counts.all === 1 ? '' : 's'} logged</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-5">
                {/* Search and Status Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                statusFilter === 'ALL'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>All</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {counts.all}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('Pending')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                statusFilter === 'Pending'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>Pending</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'Pending' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'}`}>
                                {counts.pending}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('Approved')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                statusFilter === 'Approved'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>Approved</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'Approved' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                                {counts.approved}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('Completed')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                statusFilter === 'Completed'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>Disbursed</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'Completed' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}>
                                {counts.completed}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('Rejected')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                statusFilter === 'Rejected'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>Rejected</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'Rejected' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'}`}>
                                {counts.rejected}
                            </span>
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative group min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by member, purpose, category..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 outline-none w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all" 
                        />
                    </div>
                </div>

                {/* Ledger Claims List */}
                {filtered.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <FileText className="w-12 h-12 text-slate-200 mb-4" />
                        <h3 className="text-base font-bold text-slate-900">No Reimbursement Claims Found</h3>
                        <p className="text-slate-400 text-xs mt-1 max-w-sm">
                            {searchTerm || statusFilter !== 'ALL' 
                                ? 'No entries match your current search or filter criteria.' 
                                : 'No claims have been submitted by team members from Operations yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((item) => {
                            const badge = getStatusBadge(item.status)
                            const memberName = item.user?.fullName || item.user?.username || 'Team Member'
                            const memberRole = item.user?.role || 'OPERATIONS'

                            return (
                                <div 
                                    key={item.id} 
                                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md"
                                >
                                    {/* Left: Member & Claim details */}
                                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                                        {/* Avatar initials */}
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-sm shrink-0">
                                            {memberName.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                                                    {item.name}
                                                </h4>
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                    {item.category || 'General'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-bold text-slate-800">{memberName}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.2 bg-slate-50 border border-slate-200 rounded">
                                                        {memberRole}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>Expense: {formatDate(item.date)}</span>
                                                </div>

                                                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Filed: {formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Amount, Status Dropdown, Receipt Action */}
                                    <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                        {/* Amount */}
                                        <div className="text-left lg:text-right">
                                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                                ₹{item.amount.toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Claim Amount
                                            </div>
                                        </div>

                                        {/* Status Selector */}
                                        <div className="relative">
                                            {updatingId === item.id && (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 absolute -left-5 top-1/2 -translate-y-1/2" />
                                            )}
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                disabled={updatingId === item.id}
                                                className={`text-[11px] font-bold px-3 py-2 rounded-xl uppercase tracking-wider appearance-none cursor-pointer pr-8 outline-none border transition-all shadow-sm ${badge.pill}`}
                                            >
                                                <option value="Pending">Pending Audit</option>
                                                <option value="Approved">Approve Payment</option>
                                                <option value="Completed">Payment Disbursed</option>
                                                <option value="Rejected">Void / Reject</option>
                                            </select>
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <Filter className="w-3 h-3" />
                                            </div>
                                        </div>

                                        {/* Receipt View Button */}
                                        {item.billData ? (
                                            <button
                                                onClick={() => setSelectedReceipt(item)}
                                                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
                                                title="Inspect Supporting Receipt"
                                            >
                                                <Eye className="w-4 h-4 text-orange-600" />
                                                <span className="hidden sm:inline">Receipt</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                                                No Receipt
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {selectedReceipt && (
                <ReceiptModal
                    isOpen={!!selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                    title={selectedReceipt.name}
                    billData={selectedReceipt.billData}
                    amount={selectedReceipt.amount}
                    date={selectedReceipt.date}
                    category={selectedReceipt.category}
                    status={selectedReceipt.status}
                />
            )}
        </div>
    )
}
