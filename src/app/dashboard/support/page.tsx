'use client'

import { AlertCircle, CheckCircle, Clock, HelpCircle, Loader2, MessageCircle, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Ticket {
    id: string
    subject: string
    status: string
    priority: string
    createdAt: string
    updatedAt: string
    user?: { fullName: string }
    organization?: { name: string }
    _count?: { messages: number }
}

const statusConfig: Record<string, { icon: any, color: string, bg: string }> = {
    OPEN: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    IN_PROGRESS: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    RESOLVED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    CLOSED: { icon: CheckCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
}

const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    NORMAL: 'bg-blue-100 text-blue-600',
    HIGH: 'bg-orange-100 text-orange-600',
    URGENT: 'bg-red-100 text-red-600',
}

export default function SupportPage() {
    const { data: session } = useSession()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ subject: '', message: '', priority: 'NORMAL' })
    const [submitting, setSubmitting] = useState(false)

    const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/mobile/support')
            if (res.ok) {
                const data = await res.json()
                setTickets(data)
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchTickets()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ subject: '', message: '', priority: 'NORMAL' })
                fetchTickets()
            }
        } catch (error) {
            console.error('Failed to create ticket:', error)
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
                    <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
                    <p className="text-gray-500">
                        {isSuperAdmin ? 'View and respond to all support requests' : 'Get help from our support team'}
                    </p>
                </div>
                {!isSuperAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Ticket
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                            {isSuperAdmin && (
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">From</th>
                            )}
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Messages</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tickets.map((ticket) => {
                            const status = statusConfig[ticket.status] || statusConfig.OPEN
                            const StatusIcon = status.icon
                            return (
                                <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4">
                                        <a href={`/dashboard/support/${ticket.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                                            {ticket.subject}
                                        </a>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-gray-900">{ticket.user?.fullName}</p>
                                                <p className="text-xs text-gray-500">{ticket.organization?.name}</p>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <MessageCircle className="w-4 h-4" />
                                            {ticket._count?.messages || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(ticket.updatedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {tickets.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>{isSuperAdmin ? 'No support tickets yet' : 'No tickets yet. Create one if you need help!'}</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">New Support Ticket</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
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
                                    {submitting ? 'Creating...' : 'Create Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
