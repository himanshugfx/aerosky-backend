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
    Target,
    CreditCard
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import TopBar, { Category } from '@/components/TopBar'

const navigationItems = [
    // Dashboard Category
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Dashboard' as Category },
    
    // Sales Category
    { name: 'Lead Management', href: '/dashboard/leads', icon: Target, category: 'Sales' as Category },
    
    // Operations Category
    { name: 'Inventory Management', href: '/dashboard/inventory', icon: ShoppingCart, category: 'Operations' as Category },
    { name: 'Power Units', href: '/dashboard/batteries', icon: Battery, category: 'Operations' as Category },
    { name: 'Flight Logs', href: '/dashboard/flights', icon: Send, category: 'Operations' as Category },
    { name: 'Partners', href: '/dashboard/subcontractors', icon: Building2, category: 'Operations' as Category },
    { name: 'Accounts / Reimbursements', href: '/dashboard/accounts', icon: CreditCard, category: 'Operations' as Category },
    
    // Administration Category
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, category: 'Administration' as Category },
    { name: 'Fleet', href: '/dashboard/drones', icon: Plane, category: 'Administration' as Category },
    { name: 'Personnel', href: '/dashboard/team', icon: Users, category: 'Administration' as Category },
]

import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [currentCategory, setCurrentCategory] = useState<Category>('Dashboard')
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

    // Sync category with pathname
    useEffect(() => {
        const matchingItem = navigationItems.find(item => item.href === pathname)
        if (matchingItem) {
            setCurrentCategory(matchingItem.category)
        }
    }, [pathname])

    const handleCategoryChange = (category: Category) => {
        setCurrentCategory(category)
        const firstItem = navigationItems.find(item => item.category === category)
        if (firstItem) {
            router.push(firstItem.href)
        }
    }

    const filteredNavigation = navigationItems.filter(item => item.category === currentCategory)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        if (session) {
            const fetchNotifications = async () => {
                try {
                    const res = await fetch('/api/notifications')
                    if (res.ok) {
                        const data = await res.json()
                        if (Array.isArray(data)) {
                            setNotifications(data)
                        }
                    }
                } finally {
                    setIsLoadingNotifications(false)
                }
            }
            fetchNotifications()
        }
    }, [session])

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin" />
                <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Flight Systems</p>
            </div>
        )
    }

    if (status === 'unauthenticated') return null

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-600 selection:text-white">
            {/* Desktop Sidebar - Premium Pill Design */}
            <div className="hidden lg:block">
                <Sidebar items={filteredNavigation} />
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`
                fixed inset-0 z-[100] transition-all duration-500
                ${isMobileMenuOpen ? 'visible' : 'invisible'}
            `}>
                <div className={`
                    absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500
                    ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}
                `} onClick={() => setIsMobileMenuOpen(false)} />
                
                <div className={`
                    absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl transition-transform duration-500 transform
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="p-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                                    <Plane className="w-6 h-6" />
                                </div>
                                <span className="text-xl font-black tracking-tighter text-slate-900">AeroSky</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Navigation Domain</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['Dashboard', 'Sales', 'Operations', 'Administration'] as Category[])
                                        .filter(cat => cat !== 'Administration' || (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'))
                                        .map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => handleCategoryChange(cat)}
                                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                                currentCategory === cat 
                                                ? 'bg-orange-600 text-white shadow-lg' 
                                                : 'bg-slate-50 text-slate-400 hover:text-slate-900'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-3">{currentCategory} Links</p>
                                {filteredNavigation.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-4 px-4 py-4 rounded-2xl transition-all
                                            ${pathname === item.href 
                                                ? 'bg-orange-50 text-orange-600' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }
                                        `}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                        {pathname === item.href && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="mt-8 flex items-center gap-4 px-4 py-5 rounded-2xl bg-rose-50 text-rose-600 font-bold transition-all hover:bg-rose-100"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Dashboard Stage */}
            <div className="lg:pl-36 flex-1 flex flex-col transition-all duration-500">
                <header className="sticky top-0 z-[40] transition-all duration-500 bg-slate-50/80 backdrop-blur-md">
                    <div className="px-6 lg:px-12 py-6 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6 flex-1">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-900"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="hidden lg:flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status: Live</span>
                                </div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tighter">AeroSky Control</h1>
                            </div>

                            <div className={`
                                hidden xl:flex items-center relative flex-1 max-w-xl transition-all duration-500
                                ${isSearchFocused ? 'scale-105' : 'scale-100'}
                            `}>
                                <div className="absolute left-6 text-slate-400">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Universal Search... (⌘ K)" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-4 pl-16 pr-6 text-sm font-medium focus:outline-none focus:border-orange-600/20 focus:bg-white shadow-sm transition-all"
                                />
                                <div className="absolute right-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 select-none">
                                    <Command className="w-3 h-3" />
                                    <span>K</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-600/20 transition-all relative group"
                                >
                                    <Bell className="w-5 h-5 group-hover:animate-bounce" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-600 border-2 border-white rounded-full"></span>
                                    )}
                                </button>
                                
                                {showNotifications && (
                                    <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Telemetry Alerts</h3>
                                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-0.5">Real-time Grid Feedback</p>
                                            </div>
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500">{notifications.length} New</span>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 no-scrollbar bg-slate-50/30">
                                            {isLoadingNotifications ? (
                                                <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                                                    <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-600 rounded-full animate-spin" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Polling Server</span>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map((n: any) => (
                                                    <div key={n.id} className="p-6 bg-white rounded-[1.5rem] border border-slate-100 hover:border-orange-600/10 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                                                        <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed">{n.message}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 flex items-center justify-between">
                                                            <span>Telemetry Sync</span>
                                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Dismiss</span>
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                                                    <Bell className="w-12 h-12 opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Clear Skies</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link href="/dashboard/settings" className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                                <Settings className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Contextual TopBar */}
                <TopBar activeCategory={currentCategory} onCategoryChange={handleCategoryChange} userRole={session?.user?.role} />

                {/* Unified Stage Area - Use flex-1 to push footer down if there was one, or just fill space */}
                <main className="flex-1 px-6 lg:px-12 py-8 animate-slide-up">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
