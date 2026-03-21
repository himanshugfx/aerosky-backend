"use client";

import { ArrowRight, Lock, User, Shield, Info } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // SECURITY: Clear fields on mount
    useEffect(() => {
        setUsername("");
        setPassword("");
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Access Denied: Invalid Credentials");
            setLoading(false);
            // SECURITY: Clear fields on error
            setUsername("");
            setPassword("");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 selection:bg-orange-500/30 overflow-hidden font-sans">
            
            {/* --- LEFT SIDE: THEMATIC VISUAL --- */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-900">
                {/* Background Image */}
                <Image 
                    src="/login-drone.png" 
                    alt="Drone Manufacturing Setup"
                    fill
                    className="object-cover opacity-80 mix-blend-luminosity hover:scale-105 transition-transform duration-[10s] ease-linear"
                    priority
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/40 to-transparent" />
                
                {/* Thematic Content */}
                <div className="absolute bottom-20 left-20 right-20 z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/40">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-sm font-black text-orange-500 uppercase tracking-[0.3em]">Operational Security</span>
                    </div>
                    
                    <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-6">
                        AEROSKY<br/>
                        <span className="text-orange-500 italic">PRECISION</span>
                    </h1>
                    
                    <p className="max-w-md text-slate-300 font-medium text-lg leading-relaxed">
                        The ultimate command terminal for drone manufacturing, flight operations, and fleet logistics. 
                        Experience unparalleled aviation intelligence.
                    </p>
                </div>

                {/* Corner Accreditation */}
                <div className="absolute top-12 left-12 flex items-center gap-2 opacity-50">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Secure Node: AS-77-PX</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: AUTHENTICATION MODULE --- */}
            <div className="w-full lg:w-2/5 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white relative">
                
                {/* Mobile Header (Hidden on Large) */}
                <div className="lg:hidden flex justify-center mb-12">
                    <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-600/20">
                        <Shield className="w-9 h-9 text-white" />
                    </div>
                </div>

                {/* Form Header */}
                <div className="mb-12">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tightest mb-3">Hi Commander</h2>
                    <p className="text-slate-500 font-semibold">Initiate secure system authentication</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {/* Personnel ID Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Identifier</label>
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-6 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Admin ID or Email"
                                required
                            />
                        </div>
                    </div>

                    {/* Access Key Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Key</label>
                            <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="text-[10px] font-black text-orange-600/60 hover:text-orange-600 uppercase tracking-widest transition-colors"
                            >
                                Forgot?
                            </button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-6 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 outline-none transition-all placeholder:text-slate-400"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Authentication Logic Error */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black py-4 px-5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <Info className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submission Component */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative group/btn pt-4"
                    >
                        <div className="bg-slate-900 group-hover/btn:bg-orange-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-900/10 group-hover/btn:shadow-orange-600/30">
                            <span className="uppercase tracking-[0.2em] text-[11px]">
                                {loading ? "Authenticating..." : "Establish Secure Connection"}
                            </span>
                            {!loading && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                        </div>
                    </button>
                </form>

                {/* Bottom Accreditation */}
                <div className="absolute bottom-12 left-8 md:left-16 lg:left-24 flex flex-col gap-2 opacity-30 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">
                        &copy; 2026 AeroSky Precision
                    </p>
                    <div className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-tr-full pointer-events-none" />
            </div>

            {/* Custom Animations & Smooth Interactivity */}
            <style jsx global>{`
                @font-face {
                    font-family: 'Outfit';
                    font-display: swap;
                }
                
                @keyframes shine {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                
                .animate-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
