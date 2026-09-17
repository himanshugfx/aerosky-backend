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
    Zap,
    Wind,
    Compass,
    Activity,
    ChevronRight,
    Map as MapIcon,
    Calendar,
    Clock,
    ShieldCheck
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

    const [drones, setDrones] = useState<Drone[]>([])
    const [team, setTeam] = useState<TeamMember[]>([])
    const [batteries, setBatteries] = useState<Battery[]>([])

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
                }
            )
        } else {
            setFetchingLocation(false)
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
            }
        } catch (error) {
            console.error('Failed to create flight log:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently decommission this flight record?')) return
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
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-2xl animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-slate-900 absolute top-0 left-0 border-t-4 border-transparent rounded-2xl" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Aeronautical Sync In Progress</p>
            </div>
        )
    }
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">Mission <span className="text-slate-400 font-medium">Operations</span></h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="modern-card px-6 py-3 flex items-center gap-4 bg-slate-900 text-white min-w-[160px]">
                        <Activity className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sorties</p>
                            <p className="text-xl font-black tracking-tighter">{logs.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-premium-primary !py-3.5 lg:!py-4 shadow-2xl shadow-orange-500/10 group flex-1 md:flex-none"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Log Mission
                    </button>
                </div>
            </div>

            {/* Operations Ledger */}
            <div className="premium-card overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                            <Wind className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Telemetric Ledger</h3>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input
                            placeholder="Filter by drone or location..."
                            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Mission Timestamp</th>
                                <th className="px-10 py-6">Aircraft Configuration</th>
                                <th className="px-10 py-6">Field Intelligence</th>
                                <th className="px-10 py-6 text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                                <span className="text-[10px] font-black leading-none">{format(new Date(log.date), 'dd')}</span>
                                                <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">{format(new Date(log.date), 'MMM')}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm tracking-tight">{format(new Date(log.date), 'yyyy')}</p>
                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {log.takeoffTime}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100/50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center transition-all duration-500">
                                                <Plane className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm tracking-tight">{log.drone.modelName}</p>
                                                <span className="inline-flex items-center px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest mt-1.5 scale-90 origin-left">
                                                    {log.missionType}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600 font-extrabold text-[11px] uppercase tracking-tighter">
                                                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                PIC: {log.pic.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[240px] italic">{log.locationName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="w-10 h-10 bg-white text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 border border-slate-100 rounded-xl transition-all shadow-sm active:scale-90"
                                        >
                                            <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100">
                                                <Navigation className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Ledger Neutral</h3>
                                            <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs">No aeronautical records detected in the current operational cycle.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mission Log Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Plane className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Mission Telemetry Entry</h2>
                                    <p className="text-xs text-slate-500">Log flight operational parameters</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Section 1: Personnel & Mission */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-1.5 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" /> Mission Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Mission Date *</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="input-modern !pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Takeoff Time *</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            <input
                                                type="time"
                                                required
                                                value={formData.takeoffTime}
                                                onChange={e => setFormData({ ...formData, takeoffTime: e.target.value })}
                                                className="input-modern !pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Airtime (Min) *</label>
                                        <input
                                            placeholder="e.g. 45"
                                            required
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="input-modern"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex justify-between">
                                            <span>Operational Sector *</span>
                                            <button
                                                type="button"
                                                onClick={fetchCurrentLocation}
                                                className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 text-[11px] font-medium"
                                            >
                                                {fetchingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapIcon className="w-3 h-3" />}
                                                Detect Location
                                            </button>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                placeholder="Location / site name..."
                                                required
                                                value={formData.locationName}
                                                onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                                                className="input-modern !pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Mission Type *</label>
                                        <select
                                            required
                                            value={formData.missionType}
                                            onChange={e => setFormData({ ...formData, missionType: e.target.value })}
                                            className="input-modern"
                                        >
                                            <option value="Training">Training & Drills</option>
                                            <option value="Commercial">Commercial Engagement</option>
                                            <option value="Testing">Technical R&D</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Pilot in Command (PIC) *</label>
                                        <select
                                            required
                                            value={formData.picId}
                                            onChange={e => setFormData({ ...formData, picId: e.target.value })}
                                            className="input-modern"
                                        >
                                            <option value="">Select Command Pilot</option>
                                            {team.map(m => <option key={m.id} value={m.id}>{m.name} — {m.position}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Visual Observer (VO)</label>
                                        <select
                                            value={formData.voId}
                                            onChange={e => setFormData({ ...formData, voId: e.target.value })}
                                            className="input-modern"
                                        >
                                            <option value="">Optional Observer</option>
                                            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Aircraft Hardware */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Plane className="w-4 h-4 text-indigo-600" /> Aircraft Allocation
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Drone Model *</label>
                                        <select
                                            required
                                            value={formData.droneId}
                                            onChange={e => setFormData({ ...formData, droneId: e.target.value, serialNumber: '', uin: '' })}
                                            className="input-modern bg-white"
                                        >
                                            <option value="">Select Airframe Model</option>
                                            {drones.map(d => <option key={d.id} value={d.id}>{d.modelName}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit Serial / UIN *</label>
                                        <select
                                            required
                                            disabled={!formData.droneId}
                                            value={`${formData.serialNumber}|${formData.uin}`}
                                            onChange={e => {
                                                const [sn, uin] = e.target.value.split('|')
                                                setFormData({ ...formData, serialNumber: sn, uin })
                                            }}
                                            className="input-modern bg-white disabled:opacity-50"
                                        >
                                            <option value="|">Determine Serial / UIN</option>
                                            {selectedDrone?.manufacturedUnits.map((u, i) => (
                                                <option key={i} value={`${u.serialNumber}|${u.uin}`}>
                                                    SN: {u.serialNumber} (UIN: {u.uin})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Post-Flight Inspection Notes</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Record rotor integrity, telemetric anomalies, etc..."
                                        value={formData.technicalFeedback}
                                        onChange={e => setFormData({ ...formData, technicalFeedback: e.target.value })}
                                        className="input-modern bg-white"
                                    />
                                </div>
                            </div>

                            {/* Section 3: Energy Cells */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1.5">
                                    <Zap className="w-4 h-4 text-amber-500" /> Battery Management
                                </h3>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Battery Pair *</label>
                                    <select
                                        required
                                        value={formData.batteryId}
                                        onChange={e => setFormData({ ...formData, batteryId: e.target.value })}
                                        className="input-modern"
                                    >
                                        <option value="">Select Operational Battery Pair</option>
                                        {batteries.map(b => (
                                            <option key={b.id} value={b.id}>
                                                Pair: {b.batteryNumberA} / {b.batteryNumberB} [{b.model}]
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </form>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="btn-premium-primary"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Save Record
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
