'use client'

import { format } from 'date-fns'
import {
    CheckCircle2,
    History,
    Loader2,
    Locate,
    MapPin,
    Navigation,
    Plane,
    Plus,
    Search,
    Trash2,
    User,
    UserCheck,
    X,
    Zap
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface TeamMember {
    id: string
    name: string
    position: string
}

interface Drone {
    id: string
    modelName: string
    manufacturedUnits: { serialNumber: string; uin: string }[]
}

interface Battery {
    id: string
    model: string
    batteryNumberA: string
    batteryNumberB: string
}

interface FlightLog {
    id: string
    date: string
    takeoffTime: string
    duration: string
    locationName: string
    missionType: string
    drone: { modelName: string }
    pic: { name: string }
    createdAt: string
}

export default function FlightsPage() {
    const { data: session } = useSession()

    const [logs, setLogs] = useState<FlightLog[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Dependencies for dropdowns
    const [drones, setDrones] = useState<Drone[]>([])
    const [team, setTeam] = useState<TeamMember[]>([])
    const [batteries, setBatteries] = useState<Battery[]>([])

    // Form State
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        takeoffTime: format(new Date(), 'HH:mm'),
        duration: '',
        locationCoords: '',
        locationName: '',
        picId: '',
        voId: '',
        missionType: 'Commercial',
        droneId: '',
        serialNumber: '',
        uin: '',
        technicalFeedback: '',
        batteryId: ''
    })

    const [fetchingLocation, setFetchingLocation] = useState(false)

    const fetchData = async () => {
        try {
            const [logsRes, dronesRes, teamRes, batteriesRes] = await Promise.all([
                fetch('/api/mobile/flights'),
                fetch('/api/mobile/drones'),
                fetch('/api/mobile/team'),
                fetch('/api/mobile/batteries')
            ])

            if (logsRes.ok) setLogs(await logsRes.json())
            if (dronesRes.ok) setDrones(await dronesRes.json())
            if (teamRes.ok) setTeam(await teamRes.json())
            if (batteriesRes.ok) setBatteries(await batteriesRes.json())
        } catch (error) {
            console.error('Failed to fetch flight data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchData()
    }, [session])

    const fetchCurrentLocation = () => {
        setFetchingLocation(true)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    setFormData(prev => ({ ...prev, locationCoords: `${latitude}, ${longitude}` }))

                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        const data = await res.json()
                        if (data.display_name) {
                            setFormData(prev => ({ ...prev, locationName: data.display_name }))
                        }
                    } catch (error) {
                        console.error('Reverse geocoding failed:', error)
                    } finally {
                        setFetchingLocation(false)
                    }
                },
                (error) => {
                    console.error('Geolocation failed:', error)
                    setFetchingLocation(false)
                    alert('Could not fetch location. Please enter manually.')
                }
            )
        } else {
            setFetchingLocation(false)
            alert('Geolocation not supported by your browser.')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/mobile/flights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setIsModalOpen(false)
                setFormData({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    takeoffTime: format(new Date(), 'HH:mm'),
                    duration: '',
                    locationCoords: '',
                    locationName: '',
                    picId: '',
                    voId: '',
                    missionType: 'Commercial',
                    droneId: '',
                    serialNumber: '',
                    uin: '',
                    technicalFeedback: '',
                    batteryId: ''
                })
                fetchData()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to save flight log')
            }
        } catch (error) {
            console.error('Failed to create flight log:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this flight log?')) return
        try {
            const res = await fetch(`/api/mobile/flights/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (error) {
            console.error('Failed to delete flight log:', error)
        }
    }

    const selectedDrone = drones.find(d => d.id === formData.droneId)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header + Stats */}
            <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Flight Operations</h2>
                        <p className="text-gray-500 font-medium mt-1">Detailed logs for compliance and maintenance tracking</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Log New Flight
                    </button>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
                    <div className="flex justify-between items-start">
                        <History className="w-8 h-8 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">This Month</span>
                    </div>
                    <p className="text-4xl font-black mt-4">{logs.length}</p>
                    <p className="text-sm font-semibold opacity-80 mt-1">Total Flights Logged</p>
                </div>
            </div>

            {/* Logs Table Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Navigation className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900">Recent Logs</h3>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="Search location or drone..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-100 transition-all w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Status / Date</th>
                                <th className="px-8 py-4">Operational Details</th>
                                <th className="px-8 py-4">Staff & Location</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-200" />
                                            <div>
                                                <p className="font-bold text-gray-900">{format(new Date(log.date), 'dd MMM yyyy')}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{log.takeoffTime}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <Plane className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{log.drone.modelName}</p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5 tracking-wider">{log.missionType}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                <User className="w-3 h-3 text-blue-500" />
                                                {log.pic.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate max-w-[200px]">{log.locationName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400">
                                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-medium italic">No flight logs found. Start your first operation!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Modal - The Big One */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">New Operational Log</h2>
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-1">Complete compliance record required</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-2xl shadow-sm transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
                            {/* Section 1: Pilot Flight Log */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">1. Pilot Flight Log</h3>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Time of Takeoff *</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.takeoffTime}
                                            onChange={e => setFormData({ ...formData, takeoffTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Total Duration *</label>
                                        <input
                                            placeholder="e.g. 25 mins"
                                            required
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex justify-between">
                                            Location *
                                            <button
                                                type="button"
                                                onClick={fetchCurrentLocation}
                                                className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 normal-case"
                                            >
                                                {fetchingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Locate className="w-3 h-3" />}
                                                Fetch My Location
                                            </button>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 absolute left-4 top-4 text-gray-400" />
                                            <input
                                                placeholder="Enter location name or fetch coords"
                                                required
                                                value={formData.locationName}
                                                onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mission Type *</label>
                                        <select
                                            required
                                            value={formData.missionType}
                                            onChange={e => setFormData({ ...formData, missionType: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                        >
                                            <option value="Training">Training</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Testing">Testing</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">PIC (Pilot in Command) *</label>
                                        <select
                                            required
                                            value={formData.picId}
                                            onChange={e => setFormData({ ...formData, picId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                        >
                                            <option value="">Select Pilot</option>
                                            {team.map(m => <option key={m.id} value={m.id}>{m.name} ({m.position})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">VO (Visual Observer)</label>
                                        <select
                                            value={formData.voId}
                                            onChange={e => setFormData({ ...formData, voId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-semibold"
                                        >
                                            <option value="">Select Observer (Optional)</option>
                                            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Aircraft Log */}
                            <div className="p-8 bg-gray-50 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-200">
                                        <Plane className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">2. Aircraft Log</h3>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Drone *</label>
                                        <select
                                            required
                                            value={formData.droneId}
                                            onChange={e => setFormData({ ...formData, droneId: e.target.value, serialNumber: '', uin: '' })}
                                            className="w-full px-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-semibold"
                                        >
                                            <option value="">Select drone model</option>
                                            {drones.map(d => <option key={d.id} value={d.id}>{d.modelName}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Serial Number / UIN *</label>
                                        <select
                                            required
                                            disabled={!formData.droneId}
                                            value={`${formData.serialNumber}|${formData.uin}`}
                                            onChange={e => {
                                                const [sn, uin] = e.target.value.split('|')
                                                setFormData({ ...formData, serialNumber: sn, uin })
                                            }}
                                            className="w-full px-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-semibold disabled:opacity-50"
                                        >
                                            <option value="|">Select specific unit</option>
                                            {selectedDrone?.manufacturedUnits.map((u, i) => (
                                                <option key={i} value={`${u.serialNumber}|${u.uin}`}>
                                                    SN: {u.serialNumber} (UIN: {u.uin})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Technical Feedback</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Note any technical issues or observations during flight..."
                                        value={formData.technicalFeedback}
                                        onChange={e => setFormData({ ...formData, technicalFeedback: e.target.value })}
                                        className="w-full px-4 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* Section 3: Battery Log */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">3. Battery Management Log</h3>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Battery Pair Used *</label>
                                    <select
                                        required
                                        value={formData.batteryId}
                                        onChange={e => setFormData({ ...formData, batteryId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-semibold"
                                    >
                                        <option value="">Select registered battery pair</option>
                                        {batteries.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.model} (SN: {b.batteryNumberA}{b.batteryNumberB ? ` / ${b.batteryNumberB}` : ''})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </form>

                        <div className="px-10 py-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving Log...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Save Operational Log
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
