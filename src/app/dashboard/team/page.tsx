'use client'

import { Loader2, Mail, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string
    position: string
    accessId?: string
    user?: { role: string }
}

export default function TeamPage() {
    const { data: session } = useSession()
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', position: '', accessId: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/mobile/team')
            if (res.ok) {
                const data = await res.json()
                setTeam(data)
            }
        } catch (error) {
            console.error('Failed to fetch team:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchTeam()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ name: '', email: '', phone: '', position: '', accessId: '' })
                fetchTeam()
            }
        } catch (error) {
            console.error('Failed to create team member:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this team member?')) return
        try {
            await fetch(`/api/mobile/team/${id}`, { method: 'DELETE' })
            fetchTeam()
        } catch (error) {
            console.error('Failed to delete team member:', error)
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
                    <h2 className="text-2xl font-bold text-gray-900">Team</h2>
                    <p className="text-gray-500">Manage your staff and pilots</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Member
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Position</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                            <th className="text-right px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {team.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-700 font-medium">{member.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                            {member.accessId && <p className="text-xs text-gray-500">ID: {member.accessId}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{member.position}</td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {member.email}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {member.phone}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                        {member.user?.role || 'VIEWER'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {team.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No team members yet. Add your first one!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">Add Team Member</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Access ID</label>
                                <input
                                    type="text"
                                    value={formData.accessId}
                                    onChange={(e) => setFormData({ ...formData, accessId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                A login account will be created with email as username and phone as password.
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
