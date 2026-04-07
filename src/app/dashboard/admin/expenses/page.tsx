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
    Search,
    TrendingUp,
    Receipt,
    Wallet,
    ShieldCheck,
    Filter,
    Plus,
    Trash2,
    Edit3,
    X,
    Building2,
    Truck,
    Lightbulb,
    Target,
    Users,
    Coffee
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface Expense {
    id: string
    description: string
    amount: number
    date: string
    category: string
    paymentMethod?: string
    status: string
    attachment?: string
    createdAt: string
}

const CATEGORIES = [
    { name: 'Office Rent', icon: Building2, color: 'text-blue-500' },
    { name: 'Logistics', icon: Truck, color: 'text-orange-500' },
    { name: 'Utilities', icon: Lightbulb, color: 'text-yellow-500' },
    { name: 'Marketing', icon: Target, color: 'text-red-500' },
    { name: 'Salaries', icon: Users, color: 'text-indigo-500' },
    { name: 'Miscellaneous', icon: Coffee, color: 'text-slate-500' },
]

export default function ExpenseTrackerPage() {
    const { data: session } = useSession()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: CATEGORIES[0].name,
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
        attachment: ''
    })

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'OPERATIONS_MANAGER'

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses')
            if (res.ok) {
                const data = await res.json()
                setExpenses(data)
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session && isAdmin) fetchExpenses()
    }, [session, isAdmin])

    const handleSumbit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const method = editingExpense ? 'PATCH' : 'POST'
            const body = editingExpense ? { id: editingExpense.id, ...formData } : formData

            const res = await fetch('/api/expenses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                await fetchExpenses()
                closeModal()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to save expense')
            }
        } catch (error) {
            console.error('Failed to save expense:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense record?')) return

        try {
            const res = await fetch(`/api/expenses?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setExpenses(prev => prev.filter(e => e.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    const exportToExcel = () => {
        const dataToExport = expenses.map(e => ({
            'Description': e.description,
            'Category': e.category,
            'Amount (INR)': e.amount,
            'Date': new Date(e.date).toLocaleDateString(),
            'Payment Method': e.paymentMethod,
            'Status': e.status,
            'Recorded At': new Date(e.createdAt).toLocaleString()
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses_Ledger')
        XLSX.writeFile(wb, `AeroSky_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const openModal = (expense: Expense | null = null) => {
        if (expense) {
            setEditingExpense(expense)
            setFormData({
                description: expense.description,
                amount: expense.amount.toString(),
                date: new Date(expense.date).toISOString().split('T')[0],
                category: expense.category,
                paymentMethod: expense.paymentMethod || 'Bank Transfer',
                status: expense.status,
                attachment: expense.attachment || ''
            })
        } else {
            setEditingExpense(null)
            setFormData({
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                category: CATEGORIES[0].name,
                paymentMethod: 'Bank Transfer',
                status: 'Paid',
                attachment: ''
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingExpense(null)
    }

    const getCategoryIcon = (category: string) => {
        const cat = CATEGORIES.find(c => c.name === category)
        const Icon = cat?.icon || Coffee
        return <Icon className={`w-5 h-5 ${cat?.color || 'text-slate-400'}`} />
    }

    const filtered = expenses.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-orange-600 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs tracking-widest">Encrypting Financial Stream</p>
            </div>
        )
    }

    if (!isAdmin) return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldCheck className="w-16 h-16 text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-900">Restricted Domain</h2>
            <p className="text-slate-500 mt-2">Personnel credentials insufficient for enterprise financial oversight.</p>
        </div>
    )

    return (
        <div className="space-y-10 animate-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">Expense <span className="text-slate-400 font-medium">Tracker</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic px-1">Enterprise-Wide Expenditure Management</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={exportToExcel}
                        className="flex-1 md:flex-none btn-premium border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-6 h-12"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Audit Report
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex-1 md:flex-none btn-premium bg-slate-900 text-white hover:bg-slate-800 px-6 h-12 shadow-xl shadow-slate-900/10"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="premium-card p-6 bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 blur-[40px] rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150 duration-700"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" /> Monthly Burn
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tighter text-slate-900">₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="premium-card p-6 bg-white overflow-hidden relative group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Settled (Paid)
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tighter text-slate-900">₹{expenses.filter(e => e.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="premium-card p-6 bg-white overflow-hidden relative group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 text-orange-500 animate-spin" /> Unpaid Liabilities
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tighter text-slate-900">₹{expenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="premium-card p-6 bg-slate-900 text-white overflow-hidden relative group border-0 shadow-2xl shadow-slate-900/20">
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-orange-600 opacity-20 blur-[50px] rounded-full"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Receipt className="w-3 h-3 text-orange-500" /> Recorded Entries
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tighter">{expenses.length}</span>
                        <span className="text-xs font-bold text-slate-400">Ledger Marks</span>
                    </div>
                </div>
            </div>

            {/* Main Ledger Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Ledger</h3>
                    </div>
                    <div className="relative group w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Identify records..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 outline-none w-full sm:w-80 pl-11 pr-4 py-3 text-xs font-bold rounded-2xl focus:ring-4 focus:ring-slate-100 transition-all shadow-sm" 
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="premium-card p-24 flex flex-col items-center justify-center text-center border-dashed border-2">
                        <FileText className="w-16 h-16 text-slate-100 mb-6" />
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Zero Correlation Detected</h3>
                        <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs">No records found matching current organizational parameters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.map((item) => (
                            <div key={item.id} className="premium-card p-6 flex flex-col lg:flex-row lg:items-center justify-between group hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shrink-0">
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-extrabold text-slate-900 text-lg tracking-tight truncate group-hover:text-orange-600 transition-colors">{item.description}</h4>
                                        <div className="flex flex-wrap items-center gap-4 mt-1.5">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wide">
                                                {item.category}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                                <Wallet className="w-3.5 h-3.5 text-slate-300" />
                                                {item.paymentMethod}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 mt-6 lg:mt-0 pt-6 lg:pt-0 border-t lg:border-0 border-slate-100">
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{item.amount.toLocaleString('en-IN')}</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 mt-1 rounded-md uppercase tracking-wider ${item.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.status === 'Paid' ? 'SETTLED' : 'PENDING'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openModal(item)}
                                            className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl flex items-center justify-center transition-all"
                                            title="Edit Records"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl flex items-center justify-center transition-all"
                                            title="Delete Record"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {item.attachment && (
                                            <button
                                                onClick={() => {
                                                    const win = window.open()
                                                    win?.document.write(`<iframe src="${item.attachment}" width="100%" height="100%"></iframe>`)
                                                }}
                                                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                                                title="View Evidence"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" onClick={closeModal} />
                    <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_120px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingExpense ? 'Refine Record' : 'Record Expenditure'}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Fiscal Stream</p>
                                </div>
                                <button onClick={closeModal} className="p-3 bg-slate-100 text-slate-500 hover:text-black rounded-2xl transition-all hover:rotate-90">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSumbit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block italic">Ledger Description</label>
                                        <input 
                                            required
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="e.g. Server Infrastructure Maintenance"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block italic">Transaction Amount (₹)</label>
                                            <input 
                                                required
                                                type="number"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block italic">Registry Date</label>
                                            <input 
                                                required
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none select-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block italic">Expense Category</label>
                                            <select 
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-wider focus:bg-white focus:border-orange-500 outline-none appearance-none"
                                            >
                                                {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block italic">Payment Gateway</label>
                                            <select 
                                                value={formData.paymentMethod}
                                                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-wider focus:bg-white focus:border-orange-500 outline-none"
                                            >
                                                <option>Bank Transfer</option>
                                                <option>Cash</option>
                                                <option>Corporate Card</option>
                                                <option>Digital Wallet</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block italic">Fulfillment Status</label>
                                        <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl">
                                            {['Paid', 'Pending'].map(status => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status })}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === status ? 'bg-white shadow-md text-orange-600 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {status === 'Paid' ? 'Settled' : 'Unpaid'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingExpense ? 'Refine Mark' : 'Commit to Ledger'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
