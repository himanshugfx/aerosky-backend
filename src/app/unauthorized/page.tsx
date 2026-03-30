"use client";

import { WifiOff, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function UnauthorizedContent() {
    const searchParams = useSearchParams();
    const ip = searchParams.get("ip");

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Pattern */}
                <div className="h-32 bg-gradient-to-br from-red-500 to-rose-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm z-10 border border-white/30">
                        <WifiOff className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-10 text-center">
                    <div className="flex justify-center mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold tracking-wide uppercase">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Security Block
                        </span>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        To protect AeroSky systems, access is restricted to devices securely connected to the designated organization WiFi network. 
                    </p>

                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-8 text-left">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Troubleshooting</h3>
                        <ul className="text-sm text-gray-600 space-y-2.5">
                            <li className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                                <span>Ensure you are connected to the correct local WiFi network and not using mobile data.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                                <span>Disable any VPN extensions or software that might obscure your local IP address.</span>
                            </li>
                            {ip && (
                                <li className="flex max-w-full items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                                    <span className="break-all">Detected IP: <code className="bg-gray-200 px-1 py-0.5 rounded text-red-600 font-mono text-xs">{ip}</code></span>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Link 
                            href="/"
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
            
            <p className="mt-8 text-sm text-gray-400">
                AeroSky Secure Gateway &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
}

export default function UnauthorizedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-mono text-gray-400">Verifying Network...</div>}>
            <UnauthorizedContent />
        </Suspense>
    );
}
