'use client'

import { Eye, Loader2, Plane, Plus, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Drone {
    id: string
    modelName: string
    webPortalLink?: string
    createdAt: string
    accountableManager?: { name: string }
}

export default function DronesPage() {
    const { data: session } = useSession()
    const [drones, setDrones] = useState<Drone[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ modelName: '', webPortalLink: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchDrones = async () => {
        try {
            const res = await fetch('/api/mobile/drones')
            if (res.ok) {
                const data = await res.json()
                setDrones(data)
            }
        } catch (error) {
            console.error('Failed to fetch drones:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchDrones()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/drones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ modelName: '', webPortalLink: '' })
                fetchDrones()
            }
        } catch (error) {
            console.error('Failed to create drone:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this drone?')) return
        try {
            await fetch(`/api/mobile/drones/${id}`, { method: 'DELETE' })
            fetchDrones()
        } catch (error) {
            console.error('Failed to delete drone:', error)
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
                    <h2 className="text-2xl font-bold text-gray-900">Drones</h2>
                    <p className="text-gray-500">Manage your drone fleet</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Drone
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drones.map((drone) => (
                    <div key={drone.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Plane className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/dashboard/drones/${drone.id}`}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                >
                                    <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(drone.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{drone.modelName}</h3>
                        {drone.accountableManager && (
                            <p className="text-sm text-gray-500">Manager: {drone.accountableManager.name}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            Added {new Date(drone.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>

            {drones.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No drones yet. Add your first drone!</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">Add Drone</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                                <input
                                    type="text"
                                    value={formData.modelName}
                                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Web Portal Link</label>
                                <input
                                    type="url"
                                    value={formData.webPortalLink}
                                    onChange={(e) => setFormData({ ...formData, webPortalLink: e.target.value })}
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
