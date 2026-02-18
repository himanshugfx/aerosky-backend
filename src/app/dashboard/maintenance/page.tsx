'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceApi, dronesApi } from '@/lib/api'
import {
    Wrench,
    CheckCircle,
    Clock,
    AlertTriangle,
    User,
    Calendar,
    X,
    AlertCircle as AlertIcon,
    Loader2,
    Activity,
    ShieldCheck,
    ArrowUpRight,
    Settings,
    Hammer,
    ChevronRight,
    Search,
    Filter,
    HardDrive
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const maintenanceSchema = z.object({
    drone_id: z.string().uuid('Please select a drone'),
    maintenance_type: z.enum(['Inspection', 'Repair', 'Software_Update', 'Component_Replacement']),
    description: z.string().min(5, 'Provide more details'),
    technician_name: z.string().min(1, 'Technician name required'),
    maintenance_date: z.string().min(1, 'Date is required'),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

export default function MaintenancePage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data: logsData, isLoading } = useQuery({
        queryKey: ['maintenance'],
        queryFn: () => maintenanceApi.list()
    })

    const { data: dronesData } = useQuery({
        queryKey: ['drones'],
        queryFn: () => dronesApi.list()
    })

    const mutation = useMutation({
        mutationFn: (data: MaintenanceFormData) => maintenanceApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] })
            setIsModalOpen(false)
            reset()
        }
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormData>({
        resolver: zodResolver(maintenanceSchema)
    })

    const onSubmit = (data: MaintenanceFormData) => {
        mutation.mutate(data)
    }

    const logs = logsData?.data || []
    const drones = dronesData?.data?.items || []

    const stats = [
        { label: 'Engineering Cycles', value: logs.length, icon: Wrench, color: 'slate', sub: 'Total Records' },
        { label: 'System Healthy', value: logs.filter((l: any) => l.status === 'Completed').length, icon: ShieldCheck, color: 'slate', sub: 'Tasks Finalized' },
        { label: 'Routine Checks', value: logs.filter((l: any) => l.maintenance_type === 'Inspection').length, icon: Activity, color: 'slate', sub: 'Active Surveys' },
        { label: 'Critical Assets', value: logs.filter((l: any) => l.maintenance_type === 'Repair').length, icon: HardDrive, color: 'slate', sub: 'Hardware Fixes' },
    ]

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Engineering Core</span>
                        <div className="h-px w-8 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technical Telemetry</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Maintenance Ledger</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                        Comprehensive technical tracking and engineering compliance for the entire fleet infrastructure.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="premium-btn-primary flex items-center gap-2 py-4 px-8"
                >
                    <Settings className="w-5 h-5" />
                    Initialize Engineering Log
                </button>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="premium-card p-8 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
                        </div>
                        <div className="relative z-10 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-between mb-6">
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 shadow-sm">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.sub}</p>
                            <div className="flex flex-col lg:flex-row items-baseline gap-2 justify-center lg:justify-start">
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Ledger Section */}
            <div className="premium-card overflow-hidden bg-white border-slate-200 shadow-xl shadow-slate-200/40">
                <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Technical Records</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Fleet-wide Maintenance History</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by Asset ID..."
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                            />
                        </div>
                        <button className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset & Modality</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Workflow Specifications</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Certified Personnel</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Declaration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Technical Dossier...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-24 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                                                <Activity className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">No Engineering Logs</h3>
                                            <p className="text-slate-400 text-sm font-medium">The technical ledger is currently pristine. Initialize a new log to track fleet integrity.</p>
                                            <button onClick={() => setIsModalOpen(true)} className="text-slate-900 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto justify-center mt-4">
                                                Initialize First Record <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.map((log: any) => (
                                <tr key={log.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                                <Wrench className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 font-mono tracking-tighter uppercase">ID: {log.drone_id.substring(0, 8)}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.maintenance_type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-medium text-slate-600 max-w-xs leading-relaxed">
                                            {log.description}
                                        </p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">{log.technician_name}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-sm font-medium text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-300" />
                                            {new Date(log.maintenance_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${log.status === 'Completed'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {log.status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modern Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="px-12 py-10 bg-slate-900 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative z-10 space-y-1">
                                <h2 className="text-3xl font-black text-white tracking-tight">Initialize Log</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Engineering workflow compliance input</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="relative z-10 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border border-white/10">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-12 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Asset *</label>
                                    <select
                                        {...register('drone_id')}
                                        className={`input-premium appearance-none py-4 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat ${errors.drone_id ? 'border-red-500' : ''}`}
                                    >
                                        <option value="">Search Airframe...</option>
                                        {drones.map((drone: any) => (
                                            <option key={drone.id} value={drone.id}>{drone.uin || drone.manufacturer_serial_number} — [{drone.status}]</option>
                                        ))}
                                    </select>
                                    {errors.drone_id && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 pl-1">{errors.drone_id.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Modality *</label>
                                    <select
                                        {...register('maintenance_type')}
                                        className="input-premium appearance-none py-4 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat"
                                    >
                                        <option value="Inspection">Routine Inspection</option>
                                        <option value="Repair">Critical Repair</option>
                                        <option value="Software_Update">Telemetry Update</option>
                                        <option value="Component_Replacement">Hardware Swap</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Engineering Date *</label>
                                    <input
                                        type="date"
                                        {...register('maintenance_date')}
                                        className={`input-premium py-4 ${errors.maintenance_date ? 'border-red-500' : ''}`}
                                    />
                                    {errors.maintenance_date && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 pl-1">{errors.maintenance_date.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Certified Technician *</label>
                                    <input
                                        {...register('technician_name')}
                                        placeholder="Enter Certification Name"
                                        className={`input-premium py-4 ${errors.technician_name ? 'border-red-500' : ''}`}
                                    />
                                    {errors.technician_name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 pl-1">{errors.technician_name.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Technical Disposition *</label>
                                <textarea
                                    {...register('description')}
                                    rows={4}
                                    placeholder="Provide detailed technical summary of the modality performed..."
                                    className={`input-premium py-4 resize-none ${errors.description ? 'border-red-500' : ''}`}
                                />
                                {errors.description && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 pl-1">{errors.description.message}</p>}
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Synchronizing Log...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                            Commit to Engineering Ledger
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full mt-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    Cancel Initiation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

