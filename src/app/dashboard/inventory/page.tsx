'use client'

import {
    ArrowDownCircle,
    ArrowUpCircle,
    Boxes,
    Building2,
    History,
    Loader2,
    Package,
    Plus,
    Search,
    User as UserIcon,
    Wrench
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Component {
    id: string
    name: string
    description: string | null
    quantity: number
}

interface Transaction {
    id: string
    type: 'IN' | 'OUT'
    quantity: number
    date: string
    subcontractor?: { companyName: string }
    user?: { fullName: string; username: string }
    takenOutFor?: string
    component: { name: string }
}

interface Subcontractor {
    id: string
    companyName: string
}

export default function InventoryPage() {
    const { data: session } = useSession()
    const [components, setComponents] = useState<Component[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [showInModal, setShowInModal] = useState(false)
    const [showOutModal, setShowOutModal] = useState(false)
    const [showAddComponentModal, setShowAddComponentModal] = useState(false)

    const [formData, setFormData] = useState({
        componentId: '',
        quantity: 1,
        subcontractorId: '',
        takenOutFor: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    })

    const [compFormData, setCompFormData] = useState({
        name: '',
        description: ''
    })

    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        try {
            const [compRes, transRes, subRes] = await Promise.all([
                fetch('/api/inventory/components'),
                fetch(`/api/inventory/transactions${searchTerm ? `?search=${searchTerm}` : ''}`),
                fetch('/api/subcontractors')
            ])

            if (compRes.ok) setComponents(await compRes.json())
            if (transRes.ok) setTransactions(await transRes.json())
            if (subRes.ok) setSubcontractors(await subRes.json())
        } catch (error) {
            console.error('Failed to fetch inventory data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchData()
    }, [session, searchTerm])

    const handleTransactionSubmit = async (type: 'IN' | 'OUT') => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/inventory/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    componentId: formData.componentId,
                    type,
                    quantity: Number(formData.quantity),
                    subcontractorId: type === 'IN' ? (formData.subcontractorId || null) : null,
                    takenOutFor: type === 'OUT' ? (formData.takenOutFor || null) : null,
                    date: `${formData.date}T${formData.time}:00`
                })
            })
            if (res.ok) {
                setShowInModal(false)
                setShowOutModal(false)
                setFormData({
                    componentId: '',
                    quantity: 1,
                    subcontractorId: '',
                    takenOutFor: '',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                })
                fetchData()
                alert(`Stock ${type === 'IN' ? 'added' : 'usage recorded'} successfully`)
            } else {
                const err = await res.json()
                alert(`Error: ${err.error || 'Failed to process transaction'}${err.details ? `\n\nDetails: ${err.details}` : ''}`)
            }
        } catch (error) {
            console.error('Failed to process transaction:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddComponent = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/inventory/components', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(compFormData)
            })
            if (res.ok) {
                setShowAddComponentModal(false)
                setCompFormData({ name: '', description: '' })
                fetchData()
                alert('Component type registered successfully')
            } else {
                const err = await res.json()
                alert(`Error: ${err.error || 'Failed to create component'}${err.details ? `\n\nDetails: ${err.details}` : ''}`)
            }
        } catch (error) {
            console.error('Failed to create component:', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                    <p className="text-gray-500">Track components, stock levels and usage history.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowAddComponentModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <Plus className="w-4 h-4" />
                        New Component Type
                    </button>
                    <button
                        onClick={() => setShowInModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <ArrowUpCircle className="w-4 h-4" />
                        Stock IN
                    </button>
                    <button
                        onClick={() => setShowOutModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        <ArrowDownCircle className="w-4 h-4" />
                        Take OUT
                    </button>
                </div>
            </div>

            {/* Current Stock Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {components.map((comp) => (
                    <div key={comp.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 truncate max-w-[150px]">{comp.name}</p>
                            <p className="text-2xl font-bold text-gray-900">{comp.quantity}</p>
                        </div>
                    </div>
                ))}
                {components.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-gray-100 rounded-xl py-6 text-center text-gray-400">
                        No components defined yet.
                    </div>
                )}
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 font-semibold text-gray-700">
                        <History className="w-5 h-5 text-blue-500" />
                        Recent Transactions
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Component</th>
                                <th className="px-6 py-3">Qty</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium ${t.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {t.type === 'IN' ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{t.component.name}</td>
                                    <td className="px-6 py-4 font-bold">{t.quantity}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {t.type === 'IN'
                                            ? <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {t.subcontractor?.companyName || 'N/A'}</span>
                                            : <span className="flex items-center gap-1.5 font-medium text-blue-600"><Wrench className="w-3.5 h-3.5" /> {t.takenOutFor || 'N/A'}</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{new Date(t.date).toLocaleDateString()}</span>
                                            <span className="text-[10px] opacity-70">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {t.user?.fullName || t.user?.username || 'System'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {transactions.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <Boxes className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p>No transaction history found.</p>
                    </div>
                )}
            </div>

            {/* Add Component Type Modal */}
            {showAddComponentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold">Register New Component</h3>
                        </div>
                        <form onSubmit={handleAddComponent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Component Name *</label>
                                <input
                                    type="text"
                                    value={compFormData.name}
                                    onChange={(e) => setCompFormData({ ...compFormData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    placeholder="e.g. LiPo Battery 5000mAh"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Description</label>
                                <textarea
                                    value={compFormData.description}
                                    onChange={(e) => setCompFormData({ ...compFormData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                    placeholder="Optional details..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddComponentModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock IN Modal */}
            {showInModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-2 text-green-600">
                            <ArrowUpCircle className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Record Stock Incoming</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Component *</label>
                                    <select
                                        value={formData.componentId}
                                        onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                                        required
                                    >
                                        <option value="">Select a component...</option>
                                        {components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Subcontractor (Promer) *</label>
                                    <select
                                        value={formData.subcontractorId}
                                        onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                                        required
                                    >
                                        <option value="">Select subcontractor...</option>
                                        {subcontractors.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowInModal(false)} className="flex-1 py-2.5 border rounded-lg">Cancel</button>
                                <button
                                    onClick={() => handleTransactionSubmit('IN')}
                                    disabled={submitting || !formData.componentId || !formData.subcontractorId}
                                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    Record Arrival
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Take OUT Modal */}
            {showOutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-2 text-orange-600">
                            <ArrowDownCircle className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Record Stock Usage</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Component *</label>
                                    <select
                                        value={formData.componentId}
                                        onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                                        required
                                    >
                                        <option value="">Select a component...</option>
                                        {components.map(c => <option key={c.id} value={c.id}>{c.name} (Stock: {c.quantity})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Taken Out For (Purpose) *</label>
                                    <input
                                        type="text"
                                        value={formData.takenOutFor}
                                        onChange={(e) => setFormData({ ...formData, takenOutFor: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="e.g. Assembling Drone Beta-4"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 text-xs text-gray-500 bg-orange-50 p-3 rounded-lg flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>This action will be recorded as taken out by <strong>{session?.user?.name}</strong>.</span>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowOutModal(false)} className="flex-1 py-2.5 border rounded-lg">Cancel</button>
                                <button
                                    onClick={() => handleTransactionSubmit('OUT')}
                                    disabled={submitting || !formData.componentId || !formData.takenOutFor}
                                    className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                >
                                    Record Usage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
