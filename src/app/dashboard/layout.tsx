'use client'

import {
    Battery,
    Bell,
    Building2,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Menu,
    Plane,
    Send,
    Settings,
    Shield,
    ShoppingCart,
    Users,
    X,
    ChevronRight,
    Search,
    Command,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const superAdminNavigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
    { name: 'Financials', href: '/dashboard/accounts', icon: ShoppingCart },
    { name: 'System Settings', href: '/dashboard/settings', icon: Settings },
]

const orgAdminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet', href: '/dashboard/drones', icon: Plane },
    { name: 'Personnel', href: '/dashboard/team', icon: Users },
    { name: 'Partners', href: '/dashboard/subcontractors', icon: Building2 },
    { name: 'Inventory', href: '/dashboard/inventory', icon: ShoppingCart },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Power Units', href: '/dashboard/batteries', icon: Battery },
    { name: 'Flight Logs', href: '/dashboard/flights', icon: Send },
    { name: 'Accounts', href: '/dashboard/accounts', icon: ShoppingCart },
    { name: 'Assistance', href: '/dashboard/support', icon: HelpCircle },
    { name: 'Configuration', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    const navigation = isSuperAdmin ? superAdminNavigation : orgAdminNavigation

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/login')
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 selection:bg-indigo-500/30">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-slate-900 font-bold tracking-tight text-lg">AeroSky</p>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest animate-pulse">Initializing Systems</p>
                    </div>
                </div>
            </div>
        )
    }

    if (status === 'unauthenticated') return null

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row selection:bg-indigo-500/20 antialiased">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[40] lg:hidden animate-in fade-in transition-all duration-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Optimized for Large Screens */}
            <aside className={`
                fixed lg:sticky top-0 left-0 w-80 bg-[#0f172a] h-screen z-[50] transition-all duration-500 ease-out lg:translate-x-0 flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand Header */}
                <div className="p-10 flex items-center justify-between">
                    <Link href="/dashboard" className="group">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 group-active:scale-95 transition-all duration-300">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Role Indicator */}
                <div className="px-8 mb-6">
                    <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 ${isSuperAdmin
                        ? 'bg-indigo-500/10 border-indigo-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isSuperAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isSuperAdmin ? 'text-indigo-400' : 'text-emerald-400'}`}>
                            {isSuperAdmin ? 'Global Commander' : 'Operational Unit'}
                        </span>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar pt-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`nav-item group ${isActive ? 'nav-item-active' : ''}`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:translate-x-1'}`} />
                                <span className="text-sm tracking-tight">{item.name}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Enhanced Profile Section */}
                <div className="p-6 pb-10">
                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 backdrop-blur-sm group hover:border-white/10 transition-all duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center text-white text-xl font-bold shadow-2xl shadow-indigo-500/30">
                                    {session?.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-[3px] border-[#0f172a] rounded-full shadow-lg"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-white truncate leading-tight">{session?.user?.name}</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] mt-1.5 truncate">
                                    {session?.user?.role?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all duration-500 font-bold text-xs uppercase tracking-widest group/btn shadow-lg shadow-transparent hover:shadow-rose-500/20"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                            Disconnect
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main View Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                {/* High-Fidelity Header */}
                <header className="glass-header px-10 py-6 min-h-[100px]">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Page Context */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                <span>AeroSky Command</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>Live Ops</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tightest">
                                {navigation.find(n => n.href === pathname)?.name || 'Command Center'}
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Toolbar */}
                    <div className="hidden lg:flex items-center gap-6">
                        {/* Global Search Interface */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Universal Search..."
                                className="w-72 bg-slate-100/50 hover:bg-slate-100 border-none rounded-2xl py-3 pl-12 pr-12 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white shadow-sm flex items-center gap-1">
                                <Command className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400">K</span>
                            </div>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-200" />

                        <div className="flex items-center gap-3">
                            <button className="relative w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-full"></span>
                            </button>
                            <button className="w-11 h-11 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Unified Stage Area */}
                <main className="main-content-layout animate-slide-up">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                @font-face {
                  font-family: 'Outfit';
                  font-display: swap;
                }
            `}</style>
        </div>
    )
}
