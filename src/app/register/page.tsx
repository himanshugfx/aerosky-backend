'use client'

import { authApi } from '@/lib/api'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'ADMINISTRATION', // Default role
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Clear fields on mount as per security rules
    useEffect(() => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            role: 'ADMINISTRATION',
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await authApi.register(formData)
            router.push('/login?registered=true')
        } catch (err: any) {
            const serverError = err.response?.data?.error || err.response?.data?.details || err.message || 'Registration failed'
            const status = err.response?.status ? ` (Status: ${err.response.status})` : ''
            setError(`${serverError}${status}. Please check your connection or contact support.`)
            // Clear password on error
            setFormData(prev => ({ ...prev, password: '' }))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-16 px-4 font-['Outfit'] antialiased">
            <div className="max-w-md w-full animate-slide-up">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
                        <Shield className="w-12 h-12 text-orange-600 drop-shadow-lg" />
                        <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                            AeroSys<span className="text-orange-600">Aviation</span>
                        </span>
                    </Link>
                    <h2 className="mt-8 text-4xl font-black text-slate-900 tracking-tight">Create Account</h2>
                    <p className="mt-2 text-slate-500 font-medium">Join the AeroSys Aviation compliance platform</p>
                </div>

                <div className="modern-card p-10 bg-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-600 via-slate-800 to-orange-600" />
                    
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-shake">
                            <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                                className="input-premium"
                                placeholder="e.g., Avinash Sharma"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="input-premium"
                                placeholder="you@aerosys.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="input-premium pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Department Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="input-premium cursor-pointer"
                            >
                                <option value="MANUFACTURING">Manufacturing</option>
                                <option value="DESIGN">Design</option>
                                <option value="SALES">Sales</option>
                                <option value="SOFTWARE">Software</option>
                                <option value="ADMINISTRATION">Administration</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-premium-primary h-[56px] mt-4"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Register Account
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-semibold text-slate-500 pt-8 border-t border-slate-100">
                        Already have an account?{' '}
                        <Link href="/login" className="text-orange-600 hover:text-orange-700 transition-colors">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
