'use client'

import {
    LayoutDashboard,
    Building2,
    ShoppingCart,
    Package,
    Users,
    Plane,
    Battery,
    Send,
    HelpCircle,
    X,
    LogOut,
    Shield,
    Target
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const superAdminNavigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Leads', href: '/dashboard/leads', icon: Target },
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
    { name: 'Financials', href: '/dashboard/accounts', icon: ShoppingCart },
]

const orgAdminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet', href: '/dashboard/drones', icon: Plane },
    { name: 'Leads', href: '/dashboard/leads', icon: Target },
    { name: 'Personnel', href: '/dashboard/team', icon: Users },
    { name: 'Partners', href: '/dashboard/subcontractors', icon: Building2 },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Power Units', href: '/dashboard/batteries', icon: Battery },
    { name: 'Flight Logs', href: '/dashboard/flights', icon: Send },
    // { name: 'Accounts', href: '/dashboard/accounts', icon: ShoppingCart },
    { name: 'Assistance', href: '/dashboard/support', icon: HelpCircle },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    const navigation = isSuperAdmin ? superAdminNavigation : orgAdminNavigation

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/login')
    }

    return (
        <aside className="fixed left-6 top-6 bottom-6 w-24 bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center py-10 z-[50] transition-all duration-500 overflow-visible">
            {/* User Avatar */}
            <div className="mb-12 relative group cursor-pointer px-4">
                <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-600/30 overflow-hidden ring-4 ring-white group-hover:scale-105 transition-transform duration-300">
                    {session?.user?.name ? (
                        <div className="text-2xl font-black uppercase tracking-tighter">
                            {session.user.name.charAt(0)}
                        </div>
                    ) : (
                        <Shield className="w-7 h-7" />
                    )}
                </div>
                <div className="absolute -bottom-1 -right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                
                {/* User Role Tooltip */}
                <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
                    <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl">
                        <p className="text-sm font-black tracking-tight">{session?.user?.name}</p>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-0.5">
                            {session?.user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Icons Scrollable Area */}
            <nav className="flex-1 flex flex-col gap-5 w-full items-center overflow-y-auto overflow-x-visible no-scrollbar px-2 pb-6">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <div key={item.href} className="relative group flex items-center justify-center w-full">
                            <Link
                                href={item.href}
                                className={`p-4 rounded-2xl transition-all duration-500 ${
                                    isActive 
                                    ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30 ring-4 ring-orange-600/10' 
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            </Link>

                            {/* Tooltip - Moved outside the link container to avoid clipping if possible, but still needs parent overflow:visible */}
                            <span className="absolute left-full ml-6 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100]">
                                {item.name}
                            </span>
                        </div>
                    )
                })}
            </nav>

            {/* Logout/Disconnect Button */}
            <button
                onClick={handleLogout}
                className="mt-auto p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all duration-500 group relative"
            >
                <div className="w-12 h-12 border-2 border-slate-100 rounded-full flex items-center justify-center group-hover:border-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-rose-500/20">
                    <X className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                </div>
                
                <span className="absolute left-full ml-6 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100]">
                    Disconnect
                </span>
            </button>
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </aside>
    )
}
