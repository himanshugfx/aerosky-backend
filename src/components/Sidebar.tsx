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
            className="relative flex flex-col items-center justify-center w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                href={item.href}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                    isActive 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={item.name}
            >
                <item.icon className="w-5 h-5" />
            </Link>

            {isHovered && rect && (
                <ClientPortal selector="body">
                    <div 
                        style={{ 
                            position: 'fixed',
                            top: rect.top + rect.height / 2,
                            left: rect.right + 12,
                            transform: 'translateY(-50%)',
                            zIndex: 9999
                        }}
                        className="px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-md pointer-events-none"
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
        <aside className="fixed left-4 top-4 bottom-4 w-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-between py-6 z-[50] transition-all">
            {/* Top Section: User Profile */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer flex flex-col items-center" title={session?.user?.name || 'User'}>
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {session?.user?.name ? (
                            <span>{session.user.name.charAt(0).toUpperCase()}</span>
                        ) : (
                            <Shield className="w-5 h-5" />
                        )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
            </div>

            {/* Middle Section: Navigation Icons */}
            <nav className="flex flex-col gap-3 items-center w-full my-6 overflow-y-auto no-scrollbar">
                {items?.map((item) => (
                    <NavigationLink key={item.href} item={item} isActive={pathname === item.href} />
                ))}
            </nav>

            {/* Bottom Section: Logout */}
            <div className="flex flex-col items-center">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </aside>
    )
}
