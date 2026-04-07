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
    Clock
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
            const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
                    <p className="text-gray-600">Manage and track organizational expenses</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'analytics' : 'list')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {viewMode === 'list' ? <BarChart3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {expenses.filter(e => e.status === 'pending').length}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}
            </div>

            {/* Expense List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-12">
                        <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                        <p className="text-gray-600">Get started by adding your first expense.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">${expense.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => startEdit(expense)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-red-600 hover:text-red-900"
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
                    <div className="text-sm text-gray-700">
                        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalExpenses)} of {totalExpenses} expenses
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchExpenses(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => fetchExpenses(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingExpense(null)
                                    resetForm()
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {PAYMENT_METHODS.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false)
                                        setEditingExpense(null)
                                        resetForm()
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {editingExpense ? 'Update' : 'Add'} Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
