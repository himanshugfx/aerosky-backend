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
    const isAdmin = userRole === 'ADMINISTRATION' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
    const pathname = usePathname()
    
    const visibleCategories = categories.filter(cat => 
        cat.name !== 'Administration' || isAdmin
    )

    return (
        <div className="flex w-full px-4 lg:px-6 pt-4 mb-3">
            <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm w-full">
                <div className="hidden lg:flex items-center gap-1.5">
                    {visibleCategories.map((cat) => {
                        const isActive = activeCategory === cat.name
                        return (
                            <button
                                key={cat.name}
                                onClick={() => onCategoryChange(cat.name)}
                                className={`
                                    flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors
                                    ${isActive 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }
                                `}
                            >
                                <cat.icon className="w-4 h-4" />
                                <span>{cat.name}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center relative flex-1 max-w-full lg:max-w-md ml-2 lg:ml-6">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                        type="text" 
                        placeholder="Search dashboard..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-8 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                    />
                    <div className="absolute right-2.5 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 select-none">
                        <Command className="w-2.5 h-2.5" />
                        <span>K</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                    <Link 
                        href="/dashboard/settings" 
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                            pathname === '/dashboard/settings' 
                            ? 'bg-orange-600 border-orange-600 text-white shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
