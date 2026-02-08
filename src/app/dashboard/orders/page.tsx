'use client'

import { CheckCircle, Clock, Loader2, Package, Plus, ShoppingCart, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Order {
    id: string
    productName: string
    quantity: number
    status: string
    createdAt: string
    totalAmount?: number
}

const statusConfig: Record<string, { icon: any, color: string, bg: string }> = {
    PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    PROCESSING: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    SHIPPED: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    DELIVERED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    CANCELLED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
}

export default function OrdersPage() {
    const { data: session } = useSession()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ productName: '', quantity: 1, notes: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/mobile/orders')
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchOrders()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ productName: '', quantity: 1, notes: '' })
                fetchOrders()
            }
        } catch (error) {
            console.error('Failed to create order:', error)
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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                    <p className="text-gray-500">View and create product orders</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    New Order
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.PENDING
                    const StatusIcon = status.icon
                    return (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 ${status.bg} rounded-lg flex items-center justify-center`}>
                                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                    {order.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{order.productName}</h3>
                            <p className="text-gray-500 text-sm">Quantity: {order.quantity}</p>
                            {order.totalAmount && (
                                <p className="text-lg font-bold text-gray-900 mt-3">₹{order.totalAmount.toLocaleString()}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-3">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    )
                })}
            </div>

            {orders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders yet. Create your first order!</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">New Order</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
