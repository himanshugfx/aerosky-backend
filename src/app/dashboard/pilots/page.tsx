'use client'

import { pilotsApi } from '@/lib/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Activity,
    AlertCircle,
    Award,
    Calendar,
    ChevronRight,
    Clock,
    Compass,
    Filter,
    Loader2,
    Search,
    Shield,
    ShieldCheck,
    UserPlus,
    Users,
    X,
    Briefcase,
    Globe,
    Zap,
    Scale,
    Key
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const pilotSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    primary_id_type: z.enum(['Aadhaar', 'Passport', 'Voter_ID', 'Driving_License']),
    primary_id_number: z.string().min(1, 'ID number is required'),
    category_rating: z.enum(['Rotary_Wing', 'Fixed_Wing', 'Hybrid_Vertical_Take_Off_and_Landing']),
    class_rating: z.enum(['Nano', 'Micro', 'Small', 'Medium', 'Large']),
    operation_rating: z.enum(['VLOS', 'BVLOS', 'Night']),
})

type PilotFormData = z.infer<typeof pilotSchema>

export default function PilotsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const queryClient = useQueryClient()

    const { data: pilotsData, isLoading } = useQuery({
        queryKey: ['pilots'],
        queryFn: () => pilotsApi.list()
    })

    const mutation = useMutation({
        mutationFn: (data: any) => pilotsApi.create({
            ...data,
            user_id: '00000000-0000-0000-0000-000000000000'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pilots'] })
            setIsModalOpen(false)
            reset()
        }
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PilotFormData>({
        resolver: zodResolver(pilotSchema)
    })

    const onSubmit = (data: PilotFormData) => {
        mutation.mutate(data)
    }

    const pilots = (pilotsData?.data || []).filter((p: any) =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rpc_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = [
        { label: 'Inducted Aviators', value: pilots.length, icon: Users, sub: 'Personnel Assets', color: 'blue' },
        { label: 'Certified RPC', value: pilots.length, icon: Award, sub: 'Authorized Units', color: 'indigo' },
        { label: 'Ops Capability', value: 'High', icon: Zap, sub: 'Deployment Readiness', color: 'emerald' },
        { label: 'Compliance Index', value: '100%', icon: ShieldCheck, sub: 'Verified Status', color: 'amber' },
    ]

    return (
        <div className="space-y-8 animate-slide-up pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest italic uppercase">Personnel <span className="text-slate-400 font-medium">Registry</span></h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto btn-premium-primary !py-3.5 lg:!py-4 shadow-2xl shadow-blue-500/10 group uppercase italic tracking-widest"
                >
                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                    Induct Aviator
                </button>
            </div>

            {/* Personnel Telemetry Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="modern-card p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-100 bg-slate-50 text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <Activity className={`w-5 h-5 text-${stat.color}-500/30 group-hover:text-${stat.color}-500 transition-colors animate-pulse`} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.sub}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{stat.value}</p>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Aviator Ledger Control */}
            <div className="modern-card overflow-hidden bg-white shadow-2xl shadow-slate-200/40">
                <div className="p-10 xl:p-12 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.75rem] flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.2)]">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Certified Aviators</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" /> Vetted Operational Personnel
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                        <div className="relative flex-1 sm:w-80 group">
                            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Universal Identity Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-modern !pl-14 !py-4 shadow-sm"
                            />
                        </div>
                        <button className="w-14 h-14 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-12 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Identity Matrix</th>
                                <th className="px-12 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Operational Ratings</th>
                                <th className="px-12 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Status Verification</th>
                                <th className="px-12 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Flight Telemetry</th>
                                <th className="px-12 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 italic">Authorization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-12 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Personnel Ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pilots.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-12 py-32 text-center">
                                        <div className="max-w-md mx-auto space-y-6">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] border-dash border-2 border-slate-200 flex items-center justify-center mx-auto transition-transform group hover:scale-110">
                                                <Users className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Registry Synchronized: Null</h3>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">The aviator database is currently empty. Initiate an induction protocol to authorize personnel for flight operations.</p>
                                            </div>
                                            <button onClick={() => setIsModalOpen(true)} className="btn-premium-ghost text-slate-900 !py-3 !px-8 flex items-center gap-3 mx-auto justify-center group">
                                                <span className="italic uppercase tracking-[0.2em]">Initialize Induction</span> <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : pilots.map((pilot: any) => (
                                <tr key={pilot.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-12 py-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-11 h-11 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-base shrink-0">
                                                {pilot.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">{pilot.full_name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase py-0.5 px-2 bg-slate-50 rounded-md border border-slate-100">RPC: {pilot.rpc_number || 'PENDING'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Compass className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{pilot.category_rating?.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pilot.class_rating} Class Certification</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className="flex items-center gap-3">
                                            <span className={`status-badge ${pilot.status === 'Active' ? 'status-badge-success' : 'status-badge-error'}`}>
                                                <span className="animate-pulse mr-2 w-1 h-1 rounded-full bg-current" /> {pilot.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-slate-900">
                                                <Clock className="w-4.5 h-4.5 text-indigo-500" />
                                                <span className="text-lg font-black tracking-tighter italic">{pilot.total_flight_hours || 0}</span>
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic pt-1">Log Hours</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full w-[60%]" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 text-right">
                                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10">
                                            <Calendar className="w-4 h-4 text-white/40" />
                                            <span className="text-[11px] font-black text-white italic tracking-widest uppercase">
                                                {pilot.expiry_date ? new Date(pilot.expiry_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NON-EXPIRING'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pilot Induction Modal - Clean & Blur-Free */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0" 
                        onClick={() => setIsModalOpen(false)} 
                    />
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 relative z-10">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Induct Aviator</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Register a pilot and assign credentials</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {mutation.isError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-800 text-xs">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{(mutation.error as any)?.response?.data?.detail || 'Failed to save pilot record'}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Full Name *</label>
                                    <input
                                        {...register('full_name')}
                                        placeholder="Full Legal Name"
                                        className="input-modern"
                                    />
                                    {errors.full_name && <p className="text-rose-500 text-xs mt-0.5">{errors.full_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Date of Birth *</label>
                                    <input
                                        type="date"
                                        {...register('date_of_birth')}
                                        className="input-modern"
                                    />
                                    {errors.date_of_birth && <p className="text-rose-500 text-xs mt-0.5">{errors.date_of_birth.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">ID Type *</label>
                                    <select
                                        {...register('primary_id_type')}
                                        className="input-modern bg-white"
                                    >
                                        <option value="Aadhaar">Aadhaar Card</option>
                                        <option value="Passport">Passport</option>
                                        <option value="Voter_ID">Voter ID</option>
                                        <option value="Driving_License">Driving License</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">ID Number *</label>
                                    <input
                                        {...register('primary_id_number')}
                                        placeholder="Enter ID number"
                                        className="input-modern"
                                    />
                                    {errors.primary_id_number && <p className="text-rose-500 text-xs mt-0.5">{errors.primary_id_number.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Category</label>
                                    <select {...register('category_rating')} className="input-modern bg-white">
                                        <option value="Rotary_Wing">Rotary Wing</option>
                                        <option value="Fixed_Wing">Fixed Wing</option>
                                        <option value="Hybrid_Vertical_Take_Off_and_Landing">Hybrid VTOL</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Class</label>
                                    <select {...register('class_rating')} className="input-modern bg-white">
                                        <option value="Nano">Nano (≤ 250g)</option>
                                        <option value="Micro">Micro (≤ 2kg)</option>
                                        <option value="Small">Small (≤ 25kg)</option>
                                        <option value="Medium">Medium (≤ 150kg)</option>
                                        <option value="Large">Large (&gt; 150kg)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Operations</label>
                                    <select {...register('operation_rating')} className="input-modern bg-white">
                                        <option value="VLOS">VLOS</option>
                                        <option value="BVLOS">BVLOS</option>
                                        <option value="Night">Night Flight</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Aviator</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
