"use client";

import { ArrowRight, Lock, User, Shield, Info, Eye, EyeOff } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    // Redirect to dashboard if user already has an active session
    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }
    }, [status, router]);

    // Handle OAuth query param errors
    useEffect(() => {
        const oauthError = searchParams?.get("error");
        if (oauthError) {
            if (oauthError === "OAuthSignin" || oauthError === "OAuthCallback") {
                setError("Google sign in was cancelled or failed. Please try again.");
            } else if (oauthError === "OAuthAccountNotLinked") {
                setError("An account with this email already exists under another sign-in method.");
            } else if (oauthError === "AccessDenied") {
                setError("Access Denied: No registered account found for this Google email. Please contact an administrator.");
            } else {
                setError(`Authentication notice: ${oauthError}`);
            }
        }
    }, [searchParams]);

    // Clear credentials on mount
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
            setUsername("");
            setPassword("");
        } else {
            router.push("/dashboard");
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError("");
        try {
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (err) {
            console.error("Google sign in error:", err);
            setError("Failed to initiate Google sign in. Please check configuration.");
            setGoogleLoading(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                {/* Personnel ID Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Personnel Identifier
                    </label>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Access Key
                        </label>
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
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-14 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 outline-none transition-all placeholder:text-slate-400"
                            placeholder="••••••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 focus:outline-none transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Authentication Error Notification */}
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black py-4 px-5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                        <Info className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Submit Credentials Button */}
                <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full relative group/btn pt-2"
                >
                    <div className="bg-slate-900 group-hover/btn:bg-orange-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-900/10 group-hover/btn:shadow-orange-600/30">
                        <span className="uppercase tracking-[0.2em] text-[11px]">
                            {loading ? "Authenticating..." : "Establish Secure Connection"}
                        </span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                    </div>
                </button>
            </form>

            {/* Visual Divider */}
            <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-slate-400 font-black tracking-widest text-[9px]">
                        Or continue with
                    </span>
                </div>
            </div>

            {/* Google Sign In Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3.5 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm hover:shadow"
            >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                </svg>
                <span className="uppercase tracking-[0.15em] text-[11px] font-black text-slate-800">
                    {googleLoading ? "Connecting to Google..." : "Sign in with Google"}
                </span>
            </button>
        </div>
    );
}

export default function LoginPage() {
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
                        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-600/30">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Proprietary System</span>
                    </div>
                    
                    <h1 className="text-6xl font-black text-white tracking-tightest leading-none">
                        AEROSYS<br/>
                        <span className="text-orange-500">CONTROL</span>
                    </h1>
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
                <div className="mb-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Sign In</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">SECURITY CLEARANCE REQUIRED</p>
                </div>

                {/* Wrapped in Suspense for useSearchParams */}
                <Suspense fallback={<div className="py-8 text-center text-slate-400 text-sm font-semibold">Loading authentication...</div>}>
                    <LoginForm />
                </Suspense>

                {/* Bottom Accreditation */}
                <div className="absolute bottom-12 left-8 md:left-16 lg:left-24 flex flex-col gap-2 opacity-30 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">
                        &copy; 2026 AeroSys Precision
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
