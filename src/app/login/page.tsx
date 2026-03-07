"use client";

import { ArrowRight, Lock, Shield, User, Circle, Sparkles, Activity, Globe, Zap } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
            setError("Authentication Failed: Security Protocol Violation");
            setLoading(false);
            // SECURITY: Clear fields on error
            setUsername("");
            setPassword("");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-[#020203] flex items-center justify-center p-4 selection:bg-orange-500/30 overflow-hidden font-sans relative">

            {/* --- ADVANCED BACKGROUND ARCHITECTURE --- */}
            <div className="absolute inset-0 z-0">
                {/* Generated Aviation HUD Background */}
                <div
                    className="absolute inset-0 opacity-20 bg-center bg-cover scale-110 lg:scale-100 mix-blend-luminosity"
                    style={{ backgroundImage: 'url("/login_background_drone_cockpit_1772871142270.png")' }}
                />

                {/* Dynamic Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#020203] via-[#020203]/90 to-transparent" />

                {/* Kinetic Light Sources */}
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-600/5 blur-[120px] rounded-full animate-float-slow" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-orange-600/5 blur-[120px] rounded-full animate-float-slow" style={{ animationDelay: '-5s' }} />

                {/* Scanning Line Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan opacity-20" />
            </div>

            {/* --- CENTRAL COMMAND MODULE --- */}
            <div className="w-full max-w-[460px] relative z-10 animate-fade-in group/terminal">

                {/* Header Section */}
                <div className="text-center mb-10 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8 group-hover:bg-orange-500/20 transition-all cursor-default">
                        <Zap className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Aerosky Secure Gateway</span>
                    </div>

                    <h1 className="text-6xl font-black text-white tracking-tighter leading-none font-outfit mb-4">
                        AEROSKY<span className="text-orange-500 italic block mt-1 text-3xl tracking-normal">precision</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        Global Intelligence Terminal
                    </p>
                </div>

                {/* Main Auth Container */}
                <div className="bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 lg:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden group-hover/terminal:border-white/10 transition-colors">

                    {/* Corner Accent Decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/5 to-transparent opacity-0 group-hover/terminal:opacity-100 transition-opacity" />

                    <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
                        {/* Username Input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Personnel Identifier</label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur transition duration-500" />
                                <div className="relative flex items-center">
                                    <User className="absolute left-6 w-5 h-5 text-slate-500 group-focus-within/input:text-white transition-colors" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-[#050507] border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white placeholder:text-slate-700 focus:outline-none transition-all font-medium text-sm"
                                        placeholder="Admin Portal Access ID"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between ml-2 pr-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Access Key</label>
                                <button
                                    type="button"
                                    onClick={() => router.push("/forgot-password")}
                                    className="text-[10px] font-black text-orange-500/50 hover:text-orange-500 uppercase tracking-widest transition-colors"
                                >
                                    Recovery
                                </button>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/50 to-amber-600/50 rounded-2xl opacity-0 group-focus-within/input:opacity-100 blur transition duration-500" />
                                <div className="relative flex items-center">
                                    <Lock className="absolute left-6 w-5 h-5 text-slate-500 group-focus-within/input:text-white transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#050507] border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-white placeholder:text-slate-700 focus:outline-none transition-all font-medium text-sm"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Feedback */}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold py-5 px-6 rounded-2xl flex items-center gap-4 animate-shake">
                                <Shield className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group/btn"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl blur opacity-20 group-hover/btn:opacity-40 transition duration-500" />
                            <div className="relative bg-orange-600 hover:bg-orange-500 text-white font-black py-5.5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 overflow-hidden">
                                {/* Flowing Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shine" />

                                <span className="relative uppercase tracking-[0.3em] text-[11px]">
                                    {loading ? "Validating Protocol..." : "Initialize System Access"}
                                </span>
                                <ArrowRight className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </form>

                    {/* Status Indicators */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Security Network Operational</p>
                            </div>
                            <span className="text-[10px] text-slate-700 font-mono tracking-tighter">NODE_01_SEC</span>
                        </div>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="mt-10 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">
                        &copy; 2026 AeroSky Precision Aviation
                    </p>
                    <div className="flex gap-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500/30" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                    </div>
                </div>
            </div>

            {/* --- CUSTOM CSS ANIMATIONS --- */}
            <style jsx global>{`
                @font-face {
                    font-family: 'Outfit';
                    font-display: swap;
                }
                
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(2%, 4%); }
                    66% { transform: translate(-3%, 2%); }
                }
                
                @keyframes scan {
                    from { background-position: 0 0; }
                    to { background-position: 0 100%; }
                }
                
                @keyframes shine {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }

                .animate-scan { animation: scan 10s linear infinite; }
                .animate-shine { animation: shine 1.5s ease-in-out infinite; }
                .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
                .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
                
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus {
                    -webkit-text-fill-color: white;
                    -webkit-box-shadow: 0 0 0px 1000px #050507 inset;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>
        </div>
    );
}
