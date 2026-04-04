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
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tightest">General <span className="text-slate-400 font-medium">Settings</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                        SYSTEM CONFIGURATION & SECURITY
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="premium-card overflow-hidden">
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        <span className="text-slate-900 font-black text-3xl">
                                            {user?.name?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-white hover:bg-slate-800 transition-colors">
                                        <Fingerprint className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-center md:text-left space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'Incomplete Profile'}</h3>
                                    <div className="flex items-center gap-3 text-slate-600 font-bold text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span>{user?.email}</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-sm bg-slate-400"></div>
                                        <div className="flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-emerald-700 uppercase tracking-widest text-[9px]">{user?.role?.replace('_', ' ')} Staff</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Full Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user?.name || ''}
                                        className="input-premium py-3.5"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Email ID</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email || ''}
                                        className="input-premium py-3.5 bg-slate-50/50"
                                        disabled
                                    />
                                </div>
                            </form>

                            <div className="mt-8 flex justify-end">
                                <button className="btn-premium-primary !px-8 !py-3.5 text-[10px] font-black uppercase tracking-widest">
                                    Save Profile Details
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security Vault */}
                    <div className="premium-card p-8 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Security Check</h2>
                                <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">Change your login password</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-xl">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Old Password</label>
                                <input
                                    type="password"
                                    className="input-premium py-3.5"
                                    placeholder="Enter old password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">New Password</label>
                                    <input
                                        type="password"
                                        className="input-premium py-3.5"
                                        placeholder="Min. 6 digits"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1">Re-enter New</label>
                                    <input
                                        type="password"
                                        className="input-premium py-3.5"
                                        placeholder="Type again"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {passwordStatus && (
                                <div className={`p-4 rounded-xl font-bold text-[10px] flex items-center gap-3 transition-all ${
                                    passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                    {passwordStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    <span className="uppercase tracking-wider">{passwordStatus.message}</span>
                                </div>
                            )}

                            <div className="flex justify-start">
                                <button
                                    type="submit"
                                    disabled={submittingPassword}
                                    className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submittingPassword ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">App Version</p>
                            <p className="text-[10px] font-black text-slate-900">4.2.0-STABLE</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Server</p>
                            <p className="text-[10px] font-black text-slate-900">AP-SOUTH-1 (Mumbai)</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Fully Secured</span>
                </div>
            </div>
        </div>
    )
}
