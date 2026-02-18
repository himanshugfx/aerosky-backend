'use client'

import {
    Settings,
    User,
    Bell,
    Shield,
    Database,
    Cpu,
    Fingerprint,
    Globe,
    Mail,
    ChevronRight,
    ExternalLink,
    Clock,
    Activity,
    Lock
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'

export default function SettingsPage() {
    const { user } = useAuthStore()

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Configuration Core</span>
                        <div className="h-px w-8 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Parameters</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account Control</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                        Management of personal identity, security protocols, and platform integration preferences.
                    </p>
                </div>
            </div>

            {/* Profile Section */}
            <div className="premium-card overflow-hidden">
                <div className="px-10 py-8 bg-slate-900 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tight">Identity Profile</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Personnel verification node</p>
                    </div>
                    <div className="relative z-10 p-3 bg-white/10 rounded-2xl border border-white/10">
                        <User className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="p-10">
                    <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                <span className="text-slate-900 font-black text-5xl">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xl border-2 border-white hover:bg-slate-800 transition-colors">
                                <Fingerprint className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{user?.full_name || 'Personnel Identity Unverified'}</h3>
                            <div className="flex items-center gap-4 text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4" />
                                    <span>{user?.email}</span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <div className="flex items-center gap-1.5">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">{user?.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Personnel Legal Name</label>
                            <input
                                type="text"
                                defaultValue={user?.full_name || ''}
                                className="input-premium py-4"
                                placeholder="Enter Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Identification Mail</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ''}
                                className="input-premium py-4 bg-slate-50 opacity-60"
                                disabled
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end">
                        <button className="premium-btn-primary px-10 py-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Synchronize Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="premium-card p-10 group hover:bg-slate-900 transition-colors duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white/10 transition-colors">
                            <Bell className="w-8 h-8 text-slate-900 group-hover:text-white" />
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Active</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-white tracking-tight mb-2">Interface Alerts</h3>
                    <p className="text-slate-500 group-hover:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                        Configure real-time telemetry alerts and administrative notification pathways.
                    </p>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                        Protocol Config <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="premium-card p-10 group hover:bg-slate-900 transition-colors duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white/10 transition-colors">
                            <Lock className="w-8 h-8 text-slate-900 group-hover:text-white" />
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                            <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-white tracking-tight mb-2">Security Vault</h3>
                    <p className="text-slate-500 group-hover:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                        Encryption standards, access credentials, and multi-factor authentication protocols.
                    </p>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                        Access Control <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="premium-card p-10 group hover:bg-slate-900 transition-colors duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white/10 transition-colors">
                            <Cpu className="w-8 h-8 text-slate-900 group-hover:text-white" />
                        </div>
                        <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-white tracking-tight mb-2">Integration API</h3>
                    <p className="text-slate-500 group-hover:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                        Manage system-to-system interfaces, API keys, and external telemetry datasets.
                    </p>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                        Documentation Hub <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* System Status Footer */}
            <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Activity className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Version</p>
                            <p className="text-xs font-bold text-slate-900">v4.2.0-Production</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Globe className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Central Server</p>
                            <p className="text-xs font-bold text-slate-900">AWS / Asia Pacific</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Systems Nominal & Secure</span>
                </div>
            </div>
        </div>
    )
}
