"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Step = "REQUEST" | "VERIFY" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>("REQUEST");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationId, setVerificationId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, purpose: "FORGOT_PASSWORD" }),
            });

            const data = await res.json();
            if (res.ok) {
                setStep("VERIFY");
            } else {
                setError(data.error || "Failed to send OTP");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, purpose: "FORGOT_PASSWORD" }),
            });

            const data = await res.json();
            if (res.ok) {
                setVerificationId(data.verificationId);
                setStep("RESET");
            } else {
                setError(data.error || "Invalid OTP");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPassword, verificationId }),
            });

            const data = await res.json();
            if (res.ok) {
                setStep("SUCCESS");
            } else {
                setError(data.error || "Failed to reset password");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 selection:bg-blue-500/30">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative">
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                            <Shield className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {step === "REQUEST" && "Recover Access"}
                            {step === "VERIFY" && "Verify Identity"}
                            {step === "RESET" && "New Password"}
                            {step === "SUCCESS" && "Access Restored"}
                        </h1>
                        <p className="text-gray-400 text-sm text-center">
                            {step === "REQUEST" && "Enter your email to receive recovery code"}
                            {step === "VERIFY" && `Code sent to ${email}`}
                            {step === "RESET" && "Secure your account with a new password"}
                            {step === "SUCCESS" && "Your password has been updated successfully"}
                        </p>
                    </div>

                    {step === "REQUEST" && (
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Account Email / ID</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                        placeholder="Enter your registered email"
                                        required
                                    />
                                </div>
                            </div>
                            {error && <div className="text-red-500 text-xs px-1">{error}</div>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Request Recovery Code"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {step === "VERIFY" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">6-Digit Code</label>
                                <div className="relative group">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all tracking-[0.5em] font-mono text-center"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                            </div>
                            {error && <div className="text-red-500 text-xs px-1">{error}</div>}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep("REQUEST")}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {loading ? "Verifying..." : "Verify Code"}
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}

                    {step === "RESET" && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            {error && <div className="text-red-500 text-xs px-1">{error}</div>}
                            <button
                                type="submit"
                                disabled={loading || !newPassword}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Update Password"}
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {step === "SUCCESS" && (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <Link
                                href="/login"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    )}

                    {step !== "SUCCESS" && (
                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                            <Link href="/login" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                                <ArrowLeft className="w-3 h-3" />
                                RETURN TO SIGN IN
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
