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
    }, [session, searchTerm, categoryFilter, statusFilter, dateRange])

    const resetForm = () => {
        setFormData({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Office Supplies',
            paymentMethod: 'Credit Card',
            attachment: ''
        })
        setEditingExpense(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.description || !formData.amount || !formData.date) {
            alert('Please fill in all required fields')
            return
        }

        if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount')
            return
        }

        setSubmitting(true)
        try {
            const url = editingExpense ? '/api/expenses' : '/api/expenses'
            const method = editingExpense ? 'PUT' : 'POST'
            const body = editingExpense
                ? { ...formData, id: editingExpense.id }
                : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setShowForm(false)
                resetForm()
                fetchExpenses(currentPage)
            } else {
                const errorData = await res.json()
                alert(`Error: ${errorData.error}`)
            }
        } catch (error) {
            console.error('Failed to save expense:', error)
            alert('Failed to save expense')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense)
        setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            date: new Date(expense.date).toISOString().split('T')[0],
            category: expense.category,
            paymentMethod: expense.paymentMethod || 'Credit Card',
            attachment: expense.attachment || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchExpenses(currentPage)
            } else {
                alert('Failed to delete expense')
            }
        } catch (error) {
            console.error('Failed to delete expense:', error)
            alert('Failed to delete expense')
        }
    }

    const handleFileUpload = (files: string[]) => {
        if (files.length > 0) {
            setFormData(prev => ({ ...prev, attachment: files[0] }))
        }
    }

    const exportToExcel = () => {
        const dataToExport = expenses.map(expense => ({
            'Date': new Date(expense.date).toLocaleDateString(),
            'Description': expense.description,
            'Category': expense.category,
            'Amount': expense.amount,
            'Payment Method': expense.paymentMethod || 'N/A',
            'Status': expense.status
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
        XLSX.writeFile(wb, `AeroSys_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF()

        // Add title
        doc.setFontSize(16)
        doc.text('AeroSys Expense Report', 20, 20)

        // Add summary
        doc.setFontSize(12)
        doc.text(`Total Expenses: ₹${getTotalAmount().toLocaleString()}`, 20, 35)
        doc.text(`Date Range: ${dateRange.start || 'All'} to ${dateRange.end || 'Present'}`, 20, 45)
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 55)

        let yPosition = 70

        // Add expenses
        expenses.forEach((expense, index) => {
            if (yPosition > 270) { // New page if needed
                doc.addPage()
                yPosition = 20
            }

            doc.setFontSize(10)
            doc.text(`${index + 1}. ${new Date(expense.date).toLocaleDateString()} - ${expense.description}`, 20, yPosition)
            doc.text(`   Category: ${expense.category} | Amount: ₹${expense.amount.toLocaleString()} | Status: ${expense.status}`, 20, yPosition + 8)

            yPosition += 20
        })

        doc.save(`AeroSys_Expenses_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const getTotalAmount = () => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0)
    }

    const getCategoryBreakdown = () => {
        const breakdown: { [key: string]: number } = {}
        expenses.forEach(expense => {
            breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount
        })
        return Object.entries(breakdown).sort(([,a], [,b]) => b - a)
    }

    if (!isAdmin) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You need administration privileges to access the expense tracker.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
                    <p className="text-gray-600">Manage and track organizational expenses</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'analytics' : 'list')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {viewMode === 'list' ? <BarChart3 className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                        {viewMode === 'list' ? 'Analytics' : 'List View'}
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Expense
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <>
                    {/* Filters and Search */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search expenses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Excel
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <FileText className="h-4 w-4" />
                                    PDF
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Categories</option>
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{getTotalAmount().toLocaleString()}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">This Month</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ₹{expenses.filter(e => {
                                            const expenseDate = new Date(e.date)
                                            const now = new Date()
                                            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
                                        }).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {expenses.filter(e => e.status === 'Pending').length}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                                <p className="text-gray-600">Loading expenses...</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {expenses.map((expense) => (
                                                <tr key={expense.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(expense.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {expense.description}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {expense.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        ₹{expense.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {expense.paymentMethod || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            expense.status === 'Paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {expense.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEdit(expense)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(expense.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            {expense.attachment && (
                                                                <button
                                                                    onClick={() => window.open(expense.attachment, '_blank')}
                                                                    className="text-gray-600 hover:text-gray-900"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalExpenses)} of {totalExpenses} expenses
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fetchExpenses(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <span className="text-sm text-gray-700">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => fetchExpenses(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            ) : (
                /* Analytics View */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Breakdown */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                            <div className="space-y-3">
                                {getCategoryBreakdown().map(([category, amount]) => (
                                    <div key={category} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{category}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${(amount / getTotalAmount()) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Monthly Trend */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
                            <div className="space-y-3">
                                {Array.from({ length: 6 }, (_, i) => {
                                    const date = new Date()
                                    date.setMonth(date.getMonth() - i)
                                    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    const monthExpenses = expenses.filter(e => {
                                        const expenseDate = new Date(e.date)
                                        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear()
                                    }).reduce((sum, e) => sum + e.amount, 0)

                                    return { month: monthName, amount: monthExpenses }
                                }).reverse().map(({ month, amount }) => (
                                    <div key={month} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{month}</span>
                                        <span className="text-sm font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Expense Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowForm(false)
                                        resetForm()
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter expense description"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Method
                                        </label>
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
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Attachment (Receipt/Bill)
                                    </label>
                                    <FileUploader
                                        onUpload={handleFileUpload}
                                        accept="image/*,.pdf"
                                        maxFiles={1}
                                        existingFiles={formData.attachment ? [formData.attachment] : []}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false)
                                            resetForm()
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {editingExpense ? 'Update' : 'Add'} Expense
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