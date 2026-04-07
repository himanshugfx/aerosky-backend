'use client'

import Sidebar from '@/components/Sidebar'
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
    CreditCard,
    Wallet,
    ShieldCheck
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
    { name: 'Enquiry Management', href: '/dashboard/leads', icon: Target, category: 'Sales' as Category },
    
    // Operations Category
    { name: 'Stock Management', href: '/dashboard/inventory', icon: ShoppingCart, category: 'Operations' as Category },
    { name: 'Battery Packs', href: '/dashboard/batteries', icon: Battery, category: 'Operations' as Category },
    { name: 'Flight Records', href: '/dashboard/flights', icon: Send, category: 'Operations' as Category },
    { name: 'Vendor Partners', href: '/dashboard/subcontractors', icon: Building2, category: 'Operations' as Category },
    { name: 'Reimbursements', href: '/dashboard/accounts', icon: Wallet, category: 'Operations' as Category },
    
    // Administration Category
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, category: 'Administration' as Category },
    { name: 'Drone Fleet', href: '/dashboard/drones', icon: Plane, category: 'Administration' as Category },
    { name: 'Staff Details', href: '/dashboard/team', icon: Users, category: 'Administration' as Category },
    { name: 'Expense Tracker', href: '/dashboard/admin/expenses', icon: CreditCard, category: 'Administration' as Category },
    { name: 'Administrative Hub', href: '/dashboard/admin/reimbursements', icon: ShieldCheck, category: 'Administration' as Category },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [currentCategory, setCurrentCategory] = useState<Category>('Dashboard')
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchFocused, setIsSearchFocused] = useState(false)

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



    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-600 rounded-2xl animate-spin" />
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
                <Sidebar items={filteredNavigation} activeCategory={currentCategory} />
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
                    absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-500 transform
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
                                        .filter(cat => cat !== 'Administration' || (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN' || session?.user?.role === 'ADMINISTRATION'))
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
                {/* Contextual TopBar - Now at the very top with Search and Settings */}
                <TopBar 
                    activeCategory={currentCategory} 
                    onCategoryChange={handleCategoryChange} 
                    userRole={session?.user?.role} 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <header className="sticky top-0 z-[40] bg-slate-50/80 backdrop-blur-md lg:hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-slate-900 active:scale-95 transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-black">AS</div>
                            <span className="text-sm font-black tracking-tighter text-slate-900">AeroSky</span>
                        </div>
                        <div className="w-10"></div> {/* Spacer for symmetry */}
                    </div>
                </header>


                {/* Unified Stage Area - Use flex-1 to push footer down if there was one, or just fill space */}
                <main className="flex-1 px-4 lg:px-12 py-4 lg:py-8 animate-slide-up">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
