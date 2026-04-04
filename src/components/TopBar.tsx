'use client'

import React, { useState } from 'react'
import { 
    LayoutDashboard, 
    TrendingUp, 
    Wrench, 
    ShieldCheck,
    LucideIcon,
    Search,
    Command,
    Settings
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type Category = 'Dashboard' | 'Sales' | 'Operations' | 'Administration'

interface TopBarProps {
    activeCategory: Category
    onCategoryChange: (category: Category) => void
    userRole?: string
    searchQuery: string
    setSearchQuery: (query: string) => void
}

const categories: { name: Category; icon: LucideIcon }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Sales', icon: TrendingUp },
    { name: 'Operations', icon: Wrench },
    { name: 'Administration', icon: ShieldCheck },
]

export default function TopBar({ 
    activeCategory, 
    onCategoryChange, 
    userRole, 
    searchQuery, 
    setSearchQuery,
}: TopBarProps) {
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
    const [isFocused, setIsFocused] = React.useState(false)
    const pathname = usePathname()
    
    const visibleCategories = categories.filter(cat => 
        cat.name !== 'Administration' || isAdmin
    )

    return (
        <div className="flex w-full px-4 lg:px-6 pt-4 lg:pt-6 mb-2 animate-slide-down">
            <div className="bg-white border border-slate-200 rounded-2xl lg:rounded-[2rem] p-1.5 lg:p-2 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full transition-all duration-700">
                <div className="hidden lg:flex items-center gap-1">
                    {visibleCategories.map((cat) => {
                        const isActive = activeCategory === cat.name
                        return (
                            <button
                                key={cat.name}
                                onClick={() => onCategoryChange(cat.name)}
                                className={`
                                    flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500
                                    ${isActive 
                                        ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' 
                                        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <cat.icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                                    {cat.name}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className={`
                    flex items-center relative flex-1 max-w-full lg:max-w-lg ml-2 lg:ml-8 transition-all duration-700
                    ${isFocused ? 'scale-[1.01] lg:scale-[1.02] translate-x-1' : 'opacity-80'}
                `}>
                    <div className="absolute left-4 lg:left-5 text-slate-400">
                        <Search className={`w-3.5 h-3.5 lg:w-4 lg:h-4 transition-all duration-500 ${isFocused ? 'text-orange-600 rotate-90 scale-110' : ''}`} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search AeroSky..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-slate-50/50 border border-slate-100/50 rounded-2xl py-2.5 lg:py-3.5 pl-10 lg:pl-14 pr-4 lg:pr-6 text-[10px] lg:text-xs font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100/50 transition-all shadow-inner"
                    />
                    <div className={`
                        absolute right-5 hidden lg:flex items-center gap-1 px-2 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 select-none transition-all duration-500
                        ${isFocused ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
                    `}>
                        <Command className="w-2.5 h-2.5" />
                        <span>K</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4 mr-2">
                    <Link 
                        href="/dashboard/settings" 
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl border transition-all duration-500 group relative ${
                            pathname === '/dashboard/settings' 
                            ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-600/30' 
                            : 'bg-slate-50 hover:bg-white border-slate-100/50 text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Settings className={`w-4 h-4 transition-transform duration-500 group-hover:rotate-90 ${pathname === '/dashboard/settings' ? 'scale-110' : ''}`} />
                        {pathname === '/dashboard/settings' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-sm animate-pulse border-2 border-white shadow-sm" />
                        )}
                    </Link>
                </div>
            </div>
        </div>
    )
}
