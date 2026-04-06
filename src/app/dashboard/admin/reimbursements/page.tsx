'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    Download,
    FileText,
    Image as ImageIcon,
    Loader2,
    CheckCircle,
    Calendar,
    User,
    Search,
    TrendingUp,
    Receipt,
    Wallet,
    ShieldCheck,
    Filter
} from 'lucide-react'
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

export default function AdminReimbursementsPage() {
    const { data: session } = useSession()
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

    const fetchReimbursements = async () => {
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
        }
    }

    useEffect(() => {
        if (session) fetchReimbursements()
    }, [session])

    const exportToExcel = () => {
        const dataToExport = reimbursements.map(r => ({
            'Description': r.name,
            'Agent': r.user?.fullName || r.user?.username,
            'Category': r.category,
            'Amount (INR)': r.amount,
            'Date': new Date(r.date).toLocaleDateString(),
            'Status': r.status,
            'Submitted At': new Date(r.createdAt).toLocaleString()
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Enterprise_Ledger')
        XLSX.writeFile(wb, `AeroSys_Enterprise_Audit_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            case 'completed': return 'bg-orange-50 text-orange-600 border border-orange-100'
            case 'rejected': return 'bg-red-50 text-red-600 border border-red-100'
            default: return 'bg-amber-50 text-amber-600 border border-amber-100'
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

    const filtered = reimbursements.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-orange-600 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Enterprise Vault</p>
            </div>
        )
    }

    if (!isAdmin) return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldCheck className="w-16 h-16 text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-900">Restricted Domain</h2>
            <p className="text-slate-500 mt-2">Personnel credentials insufficient for enterprise auditing.</p>
        </div>
    )

    return (
        <div className="space-y-8 animate-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">Administrative <span className="text-slate-400 font-medium">Hub</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic px-1">Enterprise-Wide Financial Oversight</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={exportToExcel}
                        className="flex-1 md:flex-none btn-premium border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-6"
                    >
                        <Download className="w-4 h-4" />
                        Audit Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Ledger Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <Receipt className="w-4 h-4" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Enterprise Ledger</h3>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search by name or agent..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-white border border-slate-200 outline-none w-64 pl-9 pr-4 py-2.5 text-xs font-bold rounded-xl focus:ring-4 focus:ring-slate-100/50 transition-all" 
                            />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="premium-card p-24 flex flex-col items-center justify-center text-center">
                            <FileText className="w-16 h-16 text-slate-100 mb-6" />
                            <h3 className="text-lg font-bold text-slate-900">No Records Detected</h3>
                            <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs">Zero entries found matching current criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filtered.map((item) => (
                                <div key={item.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between group hover:border-slate-300 transition-all">
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shrink-0">
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-extrabold text-slate-900 text-base truncate">{item.name}</h4>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-600 uppercase">
                                                    <User className="w-3 h-3" />
                                                    {item.user?.fullName}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.date).toLocaleDateString()}
                                                </div>
                                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{item.category}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-50">
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{item.amount.toLocaleString('en-IN')}</span>
                                            <div className="relative mt-1">
                                                {updatingId === item.id && (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute -left-5 top-1/2 -translate-y-1/2" />
                                                )}
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                    disabled={updatingId === item.id}
                                                    className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider appearance-none cursor-pointer pr-8 outline-none border transition-all ${getStatusStyles(item.status)}`}
                                                >
                                                    <option value="Pending">Pending Audit</option>
                                                    <option value="Approved">Approve Payment</option>
                                                    <option value="Completed">Payment Disbursed</option>
                                                    <option value="Rejected">Void / Reject</option>
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                    <Filter className="w-2.5 h-2.5" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {item.billData && (
                                            <button
                                                onClick={() => {
                                                    const win = window.open()
                                                    win?.document.write(`
                                                        <body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
                                                            <div style="position:fixed; top:20px; left:20px; color:white; background:rgba(255,255,255,0.1); padding:10px 20px; border-radius:10px; font-size:12px; font-weight:bold; letter-spacing:1px;">DOCUMENT PREVIEW: ${item.name.toUpperCase()}</div>
                                                            <iframe src="${item.billData}" frameborder="0" style="width:90%; height:85%; border-radius:1.5rem; background:white; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);" allowfullscreen></iframe>
                                                        </body>
                                                    `)
                                                }}
                                                className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                title="View Document"
                                            >
                                                <ImageIcon className="w-6 h-6" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Financial Insights Sidebar */}
                <div className="space-y-8">
                    <div className="premium-card p-10 bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 blur-[80px] rounded-full -mr-24 -mt-24"></div>
                        <h3 className="text-xl font-black tracking-tight mb-8">Enterprise Audit</h3>

                        <div className="space-y-6">
                            <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pending Disbursement</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black tracking-tighter">₹{reimbursements.filter(r => r.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</span>
                                    <TrendingUp className="w-4 h-4 text-orange-500" />
                                </div>
                            </div>
                            <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Approved Total</p>
                                <div className="flex items-baseline gap-2 text-emerald-400">
                                    <span className="text-3xl font-black tracking-tighter">₹{reimbursements.filter(r => r.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</span>
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Completed (Paid)</p>
                                <div className="flex items-baseline gap-2 text-slate-200">
                                    <span className="text-3xl font-black tracking-tighter">₹{reimbursements.filter(r => r.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-8 bg-orange-50 border-orange-100">
                        <ShieldCheck className="w-8 h-8 text-orange-600 mb-4" />
                        <h4 className="font-black text-orange-900 text-sm uppercase tracking-tight">Compliance Protocol</h4>
                        <p className="text-xs font-medium text-orange-700/70 mt-2 leading-relaxed">
                            All status changes are logged locally and synchronized with the aeronautical fiscal ledger. Ensure all evidentiary documents are verified before approval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
