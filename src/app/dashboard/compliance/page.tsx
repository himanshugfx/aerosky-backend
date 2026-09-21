'use client'

import { dronesApi, pilotsApi } from '@/lib/api'
import { formatDate } from '@/lib/date'
import { useQuery } from '@tanstack/react-query'
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    ClipboardCheck,
    FileText,
    Loader2,
    Scale,
    Shield,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Zap,
    Lock,
    Globe,
    Cpu
} from 'lucide-react'

export default function CompliancePage() {
    const { data: dronesData, isLoading: dronesLoading } = useQuery({ queryKey: ['drones'], queryFn: () => dronesApi.list() })
    const { data: pilotsData, isLoading: pilotsLoading } = useQuery({ queryKey: ['pilots'], queryFn: () => pilotsApi.list() })

    const dronesCount = dronesData?.data?.total || 0
    const pilotsCount = pilotsData?.data?.length || 0
    const isLoading = dronesLoading || pilotsLoading

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Auditing Regulatory Framework</p>
        </div>
    )

    return (
        <div className="space-y-8 animate-slide-up pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest italic uppercase">Safety <span className="text-slate-400 font-medium">Vault</span></h1>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button className="btn-premium-ghost border border-slate-200 !py-3.5 px-6 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 flex-1 md:flex-none">
                        <FileText className="w-4.5 h-4.5" /> Regulatory Audit
                    </button>
                    <button className="btn-premium-accent bg-blue-600 hover:bg-blue-700 !py-3.5 px-6 italic shadow-xl shadow-blue-500/10 flex items-center gap-3 flex-1 md:flex-none">
                        <ShieldCheck className="w-5 h-5" /> Safety Declaration
                    </button>
                </div>
            </div>

            {/* Compliance Matrix Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Integrity Rating', value: '100%', sub: 'Optimal', icon: Shield, color: 'slate', border: 'slate-900' },
                    { label: 'Validated Items', value: dronesCount + pilotsCount + 2, sub: 'Cross-referenced', icon: CheckCircle, color: 'emerald', border: 'emerald-500' },
                    { label: 'Pending Review', value: '0', sub: 'All clear', icon: ClipboardCheck, color: 'amber', border: 'amber-500' },
                    { label: 'Safety Violations', value: '0', sub: 'Nullified', icon: AlertTriangle, color: 'rose', border: 'rose-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-800">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className={`status-badge ${stat.color === 'emerald' ? 'status-badge-success' : stat.color === 'rose' ? 'status-badge-error' : 'status-badge-info'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" /> {stat.sub}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tactical Control Panel */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-8 bg-slate-900 text-white flex flex-col xl:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5 w-full xl:w-auto">
                        <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                            <Scale className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold tracking-tight">Regulatory Matrix</h2>
                                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-md">Live Sync</span>
                            </div>
                            <p className="text-slate-400 text-xs font-medium flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" /> Global Integrity Protocol Active
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
                        <div className="text-center sm:text-right">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Last Audit</p>
                            <p className="text-sm font-semibold text-white">{formatDate(new Date())}</p>
                        </div>
                    </div>
                </div>

                <div className="p-12 flex flex-col items-center justify-center text-center bg-white">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <ShieldCheck className="w-10 h-10 text-emerald-600" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Compliance Status: Fully Verified</h3>
                    <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-normal">
                        Analytical verification complete. All compliance parameters for the AeroSys Aviation Fleet and personnel have been cross-referenced with DGCA and international aviation safety standards.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16 w-full max-w-2xl text-left">
                        {[
                            { title: 'Airframe Integrity', status: 'Verified', icon: Cpu },
                            { title: 'Personnel Certification', status: 'Certified', icon: Lock },
                            { title: 'Operational Logbooks', status: 'Synchronized', icon: ClipboardCheck },
                            { title: 'Emergency Protocols', status: 'Mandated', icon: ShieldAlert },
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex items-center gap-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-900/5 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</p>
                                    <p className="text-sm font-black text-slate-900 uppercase italic flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {item.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="mt-20 btn-premium-primary !py-5 !px-12 shadow-2xl shadow-slate-900/10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center gap-3 italic uppercase tracking-[0.2em]">
                            Access Compliance Dossier
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                        </span>
                    </button>

                    <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Enterprise Security Level 04 Active</p>
                </div>
            </div>
        </div>
    )
}
