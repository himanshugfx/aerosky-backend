'use client'

import { Battery, Loader2, Plus, Trash2, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface BatteryItem {
    id: string
    model: string
    ratedCapacity: string
    batteryNumberA: string
    batteryNumberB: string
    createdAt: string
}

export default function BatteriesPage() {
    const { data: session } = useSession()
    const [batteries, setBatteries] = useState<BatteryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        pairNumber: '',
        ratedCapacity: ''
    })
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
            const pairNum = formData.pairNumber;
            const res = await fetch('/api/mobile/batteries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: `Pair ${pairNum}`,
                    ratedCapacity: formData.ratedCapacity,
                    batteryNumberA: `${pairNum}A`,
                    batteryNumberB: `${pairNum}B`
                })
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({
                    pairNumber: '',
                    ratedCapacity: ''
                })
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
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {battery.batteryNumberA} + {battery.batteryNumberB}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                                {battery.ratedCapacity}
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
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pair Number *</label>
                                <input
                                    type="number"
                                    value={formData.pairNumber}
                                    onChange={(e) => setFormData({ ...formData, pairNumber: e.target.value })}
                                    placeholder="e.g. 1"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rated Capacity *</label>
                                <input
                                    type="text"
                                    value={formData.ratedCapacity}
                                    onChange={(e) => setFormData({ ...formData, ratedCapacity: e.target.value })}
                                    placeholder="e.g. 22000 mAh"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
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
                                    className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 font-bold shadow-lg shadow-blue-200 transition-all"
                                >
                                    {submitting ? 'Creating...' : 'Save Battery Pair'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
