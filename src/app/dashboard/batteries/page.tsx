'use client'

import { Battery, Loader2, Plus, Trash2, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface BatteryItem {
    id: string
    name: string
    serialNumber: string
    capacity: number
    cycleCount: number
    healthPercentage: number
    lastUsedAt?: string
    createdAt: string
}

export default function BatteriesPage() {
    const { data: session } = useSession()
    const [batteries, setBatteries] = useState<BatteryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', serialNumber: '', capacity: 5000 })
    const [submitting, setSubmitting] = useState(false)

    const fetchBatteries = async () => {
        try {
            const res = await fetch('/api/mobile/batteries')
            if (res.ok) {
                const data = await res.json()
                setBatteries(data)
            }
        } catch (error) {
            console.error('Failed to fetch batteries:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchBatteries()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/batteries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({ name: '', serialNumber: '', capacity: 5000 })
                fetchBatteries()
            }
        } catch (error) {
            console.error('Failed to create battery:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this battery?')) return
        try {
            await fetch(`/api/mobile/batteries/${id}`, { method: 'DELETE' })
            fetchBatteries()
        } catch (error) {
            console.error('Failed to delete battery:', error)
        }
    }

    const getHealthColor = (health: number) => {
        if (health >= 80) return 'bg-green-500'
        if (health >= 50) return 'bg-yellow-500'
        return 'bg-red-500'
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
                    <h2 className="text-2xl font-bold text-gray-900">Batteries</h2>
                    <p className="text-gray-500">Track and manage your drone batteries</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Battery
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batteries.map((battery) => (
                    <div key={battery.id} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-green-600" />
                            </div>
                            <button
                                onClick={() => handleDelete(battery.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{battery.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">S/N: {battery.serialNumber}</p>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Health</span>
                                    <span className="font-medium">{battery.healthPercentage}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getHealthColor(battery.healthPercentage)} transition-all`}
                                        style={{ width: `${battery.healthPercentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Capacity</span>
                                <span className="font-medium">{battery.capacity} mAh</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Cycles</span>
                                <span className="font-medium">{battery.cycleCount}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {batteries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Battery className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No batteries registered. Add your first one!</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-semibold mb-4">Add Battery</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Battery A1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                                <input
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (mAh) *</label>
                                <input
                                    type="number"
                                    min="1000"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
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
                                    {submitting ? 'Adding...' : 'Add Battery'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
