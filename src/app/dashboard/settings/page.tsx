'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { 
    Loader2, 
    CheckCircle2, 
    Settings, 
    User, 
    Bell, 
    Shield, 
    Cpu, 
    Fingerprint, 
    Globe, 
    Mail, 
    ChevronRight, 
    Activity, 
    Lock 
} from 'lucide-react'

export default function SettingsPage() {
    const { data: session } = useSession()
    const user = session?.user

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
    const [submittingPassword, setSubmittingPassword] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.new !== passwords.confirm) {
            setPasswordStatus({ type: 'error', message: 'New passwords do not match' })
            return
        }
        if (passwords.new.length < 6) {
            setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters' })
            return
        }

        setSubmittingPassword(true)
        setPasswordStatus(null)
        try {
            const res = await fetch('/api/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            })
            const data = await res.json()
            if (res.ok) {
                setPasswordStatus({ type: 'success', message: 'Credentials updated successfully' })
                setPasswords({ current: '', new: '', confirm: '' })
            } else {
                setPasswordStatus({ type: 'error', message: data.error || 'Failed to update credentials' })
            }
        } catch (error) {
            setPasswordStatus({ type: 'error', message: 'Internal server error' })
        } finally {
            setSubmittingPassword(false)
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-12">
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
                                            {user?.name?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xl border-2 border-white hover:bg-slate-800 transition-colors">
                                        <Fingerprint className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-center md:text-left space-y-2">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{user?.name || 'Personnel Identity Unverified'}</h3>
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

                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Personnel Legal Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user?.name || ''}
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
                            </form>

                            <div className="mt-10 flex justify-end">
                                <button className="premium-btn-primary px-10 py-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Synchronize Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security Vault - Change Password Form */}
                    <div className="premium-card p-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Access Update</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Credential rotating protocol</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-8 max-w-xl">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-slate-500">Current Security Key *</label>
                                <input
                                    type="password"
                                    className="input-premium py-5"
                                    placeholder="••••••••••••"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-slate-500">New Protocol Key *</label>
                                    <input
                                        type="password"
                                        className="input-premium py-5"
                                        placeholder="Min. 6 characters"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-slate-500">Confirm Rotation *</label>
                                    <input
                                        type="password"
                                        className="input-premium py-5"
                                        placeholder="Re-enter new key"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {passwordStatus && (
                                <div className={`p-4 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${
                                    passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                    {passwordStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    {passwordStatus.message}
                                </div>
                            )}

                            <div className="flex justify-start">
                                <button
                                    type="submit"
                                    disabled={submittingPassword}
                                    className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submittingPassword ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing Rotation
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Finalize Security Rotation
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Secondary Configs */}
                <div className="space-y-8">
                    <div className="modern-card p-10 space-y-8">
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl w-fit">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900">Communication Nodes</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">Configure how the system communicates mission critical telemetry and flight logs.</p>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" type="button">
                            Manage Alerts <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="modern-card p-10 space-y-8">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl w-fit">
                            <Cpu className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900">Platform Integrations</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">Manage system-to-system interfaces and external telemetry datasets via API.</p>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" type="button">
                            API Console <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
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
