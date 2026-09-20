'use client'

import Sidebar from '@/components/Sidebar'
import AeroAssistant from '@/components/AeroAssistant'
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
    ShieldCheck,
    Receipt,
    FileText
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
    { name: 'Reimbursements', href: '/dashboard/admin/reimbursements', icon: Receipt, category: 'Administration' as Category },
    { name: 'Reports', href: '/dashboard/admin/reports', icon: FileText, category: 'Administration' as Category },
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
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar items={filteredNavigation} activeCategory={currentCategory} />
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`
                fixed inset-0 z-[100] transition-all duration-300
                ${isMobileMenuOpen ? 'visible' : 'invisible'}
            `}>
                <div className={`
                    absolute inset-0 bg-black/50 transition-opacity duration-300
                    ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}
                `} onClick={() => setIsMobileMenuOpen(false)} />
                
                <div className={`
                    absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl transition-transform duration-300 transform
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                    <Plane className="w-5 h-5" />
                                </div>
                                <span className="text-lg font-bold text-slate-900">AeroSky</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Domain</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['Dashboard', 'Sales', 'Operations', 'Administration'] as Category[])
                                        .filter(cat => cat !== 'Administration' || (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN' || session?.user?.role === 'ADMINISTRATION'))
                                        .map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => handleCategoryChange(cat)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                                currentCategory === cat 
                                                ? 'bg-slate-900 text-white' 
                                                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">{currentCategory}</p>
                                {filteredNavigation.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                            ${pathname === item.href 
                                                ? 'bg-slate-100 text-slate-900 font-semibold' 
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }
                                        `}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                        {pathname === item.href && <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="mt-6 flex items-center gap-3 px-4 py-3 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Dashboard Stage */}
            <div className="lg:pl-24 flex-1 flex flex-col transition-all duration-300">
                <TopBar 
                    activeCategory={currentCategory} 
                    onCategoryChange={handleCategoryChange} 
                    userRole={session?.user?.role} 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <header className="sticky top-0 z-[40] bg-white border-b border-slate-200 lg:hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-700 active:scale-95 transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-bold">AS</div>
                            <span className="text-sm font-bold text-slate-900">AeroSky</span>
                        </div>
                        <div className="w-9"></div>
                    </div>
                </header>

                {/* Unified Stage Area */}
                <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Aero AI Assistant - Floating on all dashboard pages */}
            <AeroAssistant />
        </div>
    )
}
