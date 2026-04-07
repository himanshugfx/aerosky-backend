'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    Plus,
    Edit,
    Trash2,
    Download,
    Upload,
    Search,
    Filter,
    Calendar,
    DollarSign,
    CreditCard,
    Receipt,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    FileText,
    Image as ImageIcon,
    X,
    Check,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    Clock,
    XCircle
} from 'lucide-react'
import { FileUploader } from '@/components/FileUploader'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Expense {
    id: string
    description: string
    amount: number
    date: string
    category: string
    paymentMethod?: string
    status: string
    paymentStatus: string
    attachment?: string
    createdAt: string
    updatedAt: string
}

interface ExpenseFormData {
    description: string
    amount: string
    date: string
    category: string
    paymentMethod: string
    paymentStatus: string
    attachment: string
}

const EXPENSE_CATEGORIES = [
    'Office Supplies',
    'Travel',
    'Equipment',
    'Software',
    'Marketing',
    'Training',
    'Maintenance',
    'Utilities',
    'Insurance',
    'Legal',
    'Consulting',
    'Other'
]

const PAYMENT_METHODS = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Cheque',
    'Digital Wallet',
    'Other'
]

export default function ExpensesPage() {
    const { data: session } = useSession()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [showFilters, setShowFilters] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list')

    const [formData, setFormData] = useState<ExpenseFormData>({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Office Supplies',
        paymentMethod: 'Credit Card',
        paymentStatus: 'unpaid',
        attachment: ''
    })

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATION'

    const fetchExpenses = async (page = 1) => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search: searchTerm,
                ...(categoryFilter && { category: categoryFilter }),
                ...(statusFilter && { status: statusFilter }),
                ...(dateRange.start && { startDate: dateRange.start }),
                ...(dateRange.end && { endDate: dateRange.end })
            })

            const res = await fetch(`/api/expenses?${params}`)
            if (res.ok) {
                const data = await res.json()
                setExpenses(data.expenses)
                setTotalPages(data.pagination.pages)
                setTotalExpenses(data.pagination.total)
                setCurrentPage(page)
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session && isAdmin) {
            fetchExpenses()
        }
    }, [session, isAdmin, searchTerm, categoryFilter, statusFilter, dateRange])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const method = editingExpense ? 'PUT' : 'POST'
            const payload = editingExpense
                ? { ...formData, id: editingExpense.id }
                : formData

            const res = await fetch('/api/expenses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setShowForm(false)
                setEditingExpense(null)
                resetForm()
                fetchExpenses(currentPage)
            }
        } catch (error) {
            console.error('Failed to save expense:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchExpenses(currentPage)
            }
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Office Supplies',
            paymentMethod: 'Credit Card',
            paymentStatus: 'unpaid',
            attachment: ''
        })
    }

    const startEdit = (expense: Expense) => {
        setEditingExpense(expense)
        setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0],
            category: expense.category,
            paymentMethod: expense.paymentMethod || 'Credit Card',
            paymentStatus: expense.paymentStatus || 'unpaid',
            attachment: expense.attachment || ''
        })
        setShowForm(true)
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You need administration privileges to access the expense tracker.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-orange-600 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Expense Data</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">Expense <span className="text-slate-400 font-medium">Tracker</span></h1>
                    <p className="text-slate-400 text-sm font-medium">Monitor and manage organizational expenditures</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full md:w-auto btn-premium-primary !py-3.5 lg:!py-4 shadow-2xl shadow-orange-500/10 group flex items-center justify-center gap-3"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                        Add Expense
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card p-8 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2">Total Expenses</p>
                        <p className="text-3xl font-black text-slate-900">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-slate-600" />
                    </div>
                </div>
                <div className="premium-card p-8 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2">This Month</p>
                        <p className="text-3xl font-black text-slate-900">
                            ₹{expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                </div>
                <div className="premium-card p-8 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2">Pending</p>
                        <p className="text-3xl font-black text-slate-900">
                            {expenses.filter(e => e.status === 'pending').length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="premium-card p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-premium pl-12 py-4"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-6 py-4 text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-200"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="input-premium py-4 bg-white"
                            >
                                <option value="">All Categories</option>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium py-4 bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="input-premium pl-12 py-4"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="input-premium pl-12 py-4"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Expense List */}
            <div className="premium-card overflow-hidden">
                {expenses.length === 0 ? (
                    <div className="p-24 flex flex-col items-center justify-center text-center">
                        <Receipt className="w-16 h-16 text-slate-400 mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No expenses found</h3>
                        <p className="text-slate-600">Get started by adding your first expense.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Payment</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-900">{expense.description}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-900">₹{expense.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="status-badge status-badge-info">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                                            {new Date(expense.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`status-badge ${
                                                expense.status === 'approved' ? 'status-badge-success' :
                                                expense.status === 'rejected' ? 'status-badge-error' :
                                                'status-badge-warning'
                                            }`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`status-badge ${
                                                expense.paymentStatus === 'paid' ? 'status-badge-success' : 'status-badge-error'
                                            }`}>
                                                {expense.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => startEdit(expense)}
                                                    className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="w-8 h-8 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 font-medium">
                        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalExpenses)} of {totalExpenses} expenses
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchExpenses(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-slate-900 font-bold px-4">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => fetchExpenses(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="premium-card p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                                <p className="text-slate-400 text-sm font-medium">Provide detailed expense information</p>
                            </div>
                            <button onClick={() => {
                                setShowForm(false)
                                setEditingExpense(null)
                                resetForm()
                            }} className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center transition-all">
                                <XCircle className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Description *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Office Stationery Purchase"
                                        className="input-premium py-4"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Amount (INR) *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="input-premium pl-12 py-4"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Category *</label>
                                    <select
                                        className="input-premium py-4 bg-white"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Payment Method *</label>
                                    <select
                                        className="input-premium py-4 bg-white"
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        required
                                    >
                                        {PAYMENT_METHODS.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Payment Status *</label>
                                    <select
                                        className="input-premium py-4 bg-white"
                                        value={formData.paymentStatus}
                                        onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                                        required
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Expense Date *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                    <div className="relative">
                                        {/* Display formatted date */}
                                        <div className="absolute inset-0 pl-12 py-4 flex items-center bg-white rounded-2xl border border-slate-200 pointer-events-none">
                                            {formData.date ? (() => {
                                                const [year, month, day] = formData.date.split('-');
                                                return `${day}/${month}/${year}`;
                                            })() : 'DD/MM/YYYY'}
                                        </div>
                                        {/* Invisible native picker on top */}
                                        <input
                                            type="date"
                                            className="input-premium pl-12 py-4 w-full opacity-0 cursor-pointer"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false)
                                        setEditingExpense(null)
                                        resetForm()
                                    }}
                                    className="px-10 py-4 text-slate-500 font-extrabold uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-10 py-4 bg-slate-800 text-white font-extrabold uppercase tracking-widest text-[10px] hover:bg-slate-700 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
