"use client";

import { ArrowRight, Lock, Shield, User, Circle, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Clear fields on mount as per security rules
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
            setError("Authentication Failed: Invalid Credentials");
            setLoading(false);
            // Clear fields on error as per security rules
            setUsername("");
            setPassword("");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 selection:bg-indigo-500/30 overflow-hidden font-sans">
            {/* Dynamic Background Architecture */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Micro-stars interaction */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            <div className="w-full max-w-[480px] relative z-10 animate-slide-up">
                {/* Branding Accent */}
                <div className="flex justify-center mb-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center relative shadow-2xl shadow-indigo-500/20 border border-white/10 group-hover:rotate-6 transition-transform duration-500">
                            <Shield className="text-white w-10 h-10 drop-shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* Secure Vault Container */}
                <div className="bg-[#0f1115]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 lg:p-14 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.8)]">
                    <div className="space-y-3 mb-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">Secure Gateway</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter leading-tight font-outfit">
                            Command <span className="text-slate-500">Authorization</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Restricted Access Dashboard &bull; AeroSky India</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Integrity Identifier</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all duration-300 font-medium"
                                    placeholder="Enter Admin ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between ml-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cryptographic Key</label>
                                <button
                                    type="button"
                                    onClick={() => router.push("/forgot-password")}
                                    className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
                                >
                                    Lost Access?
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all duration-300 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold py-4 px-5 rounded-2xl flex items-center gap-3 animate-shake">
                                <Circle className="w-2 h-2 fill-current shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 group uppercase tracking-widest text-xs relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <span className="relative">{loading ? "Validating Protocol..." : "Initiate Authorization"}</span>
                            <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Quantum Encrypted Tunnel Active</p>
                        </div>
                    </div>
                </div>

                {/* Footer Insight */}
                <p className="mt-10 text-center text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                    &copy; 2026 AeroSky Precision Aviation &bull; Terminal 01
                </p>
            </div>

            <style jsx global>{`
                @font-face {
                    font-family: 'Outfit';
                    font-display: swap;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
