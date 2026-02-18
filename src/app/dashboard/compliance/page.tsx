'use client'

import { dronesApi, pilotsApi } from '@/lib/api'
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
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Regulatory Briefing Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="status-badge status-badge-success">Compliance Active</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DGCA / FAA Standard</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tightest italic uppercase">Safety <span className="text-slate-400 font-medium">Vault</span></h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                        Centralized regulatory oversight and safety protocol management. Ensure organizational integrity through continuous multi-layered compliance verification.
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button className="btn-premium-ghost border border-slate-200 !py-4 px-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                        <FileText className="w-4.5 h-4.5" /> Regulatory Audit
                    </button>
                    <button className="btn-premium-accent bg-blue-600 hover:bg-blue-700 !py-4 px-8 italic shadow-xl shadow-blue-500/20 flex items-center gap-3">
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
                    <div key={i} className={`modern-card p-10 group border-t-4 border-t-${stat.border} relative overflow-hidden transition-all duration-500 hover:-translate-y-1`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-5 rounded-full translate-x-12 -translate-y-12 bg-${stat.color}-600 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative space-y-8">
                            <div className="flex items-center justify-between">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-100 bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <div className={`status-badge ${stat.color === 'emerald' ? 'status-badge-success' : stat.color === 'rose' ? 'status-badge-error' : 'status-badge-info'}`}>
                                    <span className="animate-pulse mr-1.5 w-1 h-1 rounded-full bg-current" /> {stat.sub}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tactical Control Panel */}
            <div className="modern-card overflow-hidden">
                <div className="p-10 xl:p-14 bg-slate-950 text-white flex flex-col xl:flex-row justify-between items-center gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />

                    <div className="flex items-center gap-8 relative z-10 w-full xl:w-auto">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Scale className="w-10 h-10 text-white/80 relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Regulatory Matrix</h2>
                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md">Live Sync</span>
                            </div>
                            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                <Globe className="w-4 h-4" /> Global Integrity Protocol Active
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto relative z-10">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-[1.25rem] border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-blue-600/20 group-hover:bg-blue-600/40 transition-colors" />
                                    <span className="relative z-10">0{i}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />
                        <div className="text-center sm:text-left">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Last Audit</p>
                            <p className="text-sm font-black text-white tracking-tight uppercase italic">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <div className="p-16 xl:p-24 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.02),transparent)] pointer-events-none" />

                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center relative z-10 border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] group hover:scale-105 transition-transform duration-500">
                            <ShieldCheck className="w-14 h-14 text-slate-950 transition-colors group-hover:text-blue-600" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                    </div>

                    <h3 className="text-4xl font-black text-slate-900 tracking-tightest uppercase italic mb-4">Integrity Level: Maximum</h3>
                    <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
                        Analytical verification complete. All compliance parameters for the <span className="text-slate-900 font-bold italic">AeroSky Aviation Fleet</span> and personnel have been meticulously cross-referenced with international aviation safety standards.
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
