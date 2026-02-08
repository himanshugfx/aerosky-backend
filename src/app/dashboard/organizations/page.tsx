'use client'

import { Building2, Loader2, Plus, Trash2, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Organization {
    id: string
    name: string
    email: string
    phone: string
    address?: string
    createdAt: string
    _count?: { users: number }
}

export default function OrganizationsPage() {
    const { data: session } = useSession()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/mobile/organizations', {
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` }
            })
            if (res.ok) {
                const data = await res.json()
                setOrganizations(data)
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) {
            fetchOrganizations()
        }
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ name: '', email: '', phone: '', address: '' })
                fetchOrganizations()
            }
        } catch (error) {
            console.error('Failed to create organization:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this organization? This will delete all associated data.')) return
        try {
            const res = await fetch(`/api/mobile/organizations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` }
            })
            if (res.ok) {
                fetchOrganizations()
            }
        } catch (error) {
            console.error('Failed to delete organization:', error)
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
                    <p className="text-gray-500">Manage all organizations on the platform</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Organization
                </button>
            </div>

            {/* Organizations Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                    <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDelete(org.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{org.name}</h3>
                        <div className="space-y-1 text-sm text-gray-500">
                            <p>{org.email}</p>
                            <p>{org.phone}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>{org._count?.users || 0} users</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {organizations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No organizations yet. Create your first one!</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">Add Organization</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                An admin user will be created with email as login and phone as password.
                            </p>
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
                                    {submitting ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
