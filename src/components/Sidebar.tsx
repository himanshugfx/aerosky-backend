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
import { useState, useEffect, useRef } from 'react'
import ClientPortal from './ClientPortal'

function NavigationLink({ item, isActive }: { item: any, isActive: boolean }) {
    const [isHovered, setIsHovered] = useState(false)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (ref.current) {
            setRect(ref.current.getBoundingClientRect())
        }
    }, [isHovered])

    return (
        <div 
            ref={ref}
            className="relative group flex flex-col items-center justify-center w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                href={item.href}
                className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 hover:scale-105 active:scale-95 ${
                    isActive 
                    ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30 ring-4 ring-orange-600/10' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                }`}
            >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
            </Link>

            {isHovered && rect && (
                <ClientPortal selector="body">
                    <div 
                        style={{ 
                            position: 'fixed',
                            top: rect.top + rect.height / 2,
                            left: rect.right + 24,
                            transform: 'translateY(-50%)',
                            zIndex: 9999
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap shadow-2xl border border-white/10"
                    >
                        {item.name}
                    </div>
                </ClientPortal>
            )}
        </div>
    )
}

export default function Sidebar({ items, activeCategory }: { items: any[], activeCategory?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/login')
    }

    return (
        <aside className="fixed left-6 top-6 bottom-6 w-24 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 flex flex-col items-center justify-between py-12 z-[50] transition-all duration-500 overflow-hidden">
            {/* Background Category Watermark */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none overflow-hidden h-full z-0">
                <span className="text-[5.5rem] font-black text-slate-300/50 -rotate-90 uppercase tracking-tighter opacity-70 whitespace-nowrap leading-none filter blur-[0.5px]">
                    {activeCategory || 'AERO'}
                </span>
            </div>

            {/* Top Section: User Profile */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative group cursor-pointer flex flex-col items-center">
                    <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-xl font-bold shadow-2xl shadow-slate-900/30 overflow-hidden ring-4 ring-white group-hover:scale-105 transition-transform duration-300">
                        {session?.user?.name ? (
                            <div className="text-2xl font-black uppercase tracking-tighter">
                                {session.user.name.charAt(0)}
                            </div>
                        ) : (
                            <Shield className="w-7 h-7" />
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-sm"></div>
                    
                    {/* User Role Tooltip */}
                    <div className="absolute left-full ml-8 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
                        <div className="bg-slate-900 text-white px-5 py-4 rounded-[1.5rem] shadow-2xl border border-white/10">
                            <p className="text-base font-black tracking-tight">{session?.user?.name}</p>
                            <p className="text-[11px] font-black text-slate-500 tracking-widest uppercase mt-0.5">
                                {session?.user?.role?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Navigation Icons */}
            <nav className="relative z-10 flex flex-col gap-6 items-center w-full my-10 overflow-y-auto no-scrollbar scroll-smooth">
                {items?.map((item) => (
                    <NavigationLink key={item.href} item={item} isActive={pathname === item.href} />
                ))}
            </nav>

            {/* Bottom Section: Logout/Disconnect */}
            <div className="relative z-10">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-14 h-14 rounded-3xl text-rose-500 hover:bg-rose-50 transition-all duration-500 group relative"
                >
                    <div className="w-12 h-12 border-2 border-slate-200 rounded-2xl flex items-center justify-center group-hover:border-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-rose-500/20">
                        <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                    </div>
                    
                    <span className="absolute left-full ml-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100] border border-white/10 shadow-2xl">
                        Terminate Session
                    </span>
                </button>
            </div>

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
