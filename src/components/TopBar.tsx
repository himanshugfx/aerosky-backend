'use client'

import React from 'react'
import { 
    LayoutDashboard, 
    TrendingUp, 
    Wrench, 
    ShieldCheck,
    LucideIcon 
} from 'lucide-react'

export type Category = 'Dashboard' | 'Sales' | 'Operations' | 'Administration'

interface TopBarProps {
    activeCategory: Category
    onCategoryChange: (category: Category) => void
    userRole?: string
}

const categories: { name: Category; icon: LucideIcon }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Sales', icon: TrendingUp },
    { name: 'Operations', icon: Wrench },
    { name: 'Administration', icon: ShieldCheck },
]

export default function TopBar({ activeCategory, onCategoryChange, userRole }: TopBarProps) {
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
    
    const visibleCategories = categories.filter(cat => 
        cat.name !== 'Administration' || isAdmin
    )

    return (
        <div className="flex justify-center w-full px-6 pt-6 mb-2">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-full p-2 flex items-center gap-1 shadow-2xl shadow-slate-200/50">
                {visibleCategories.map((cat) => {
                    const isActive = activeCategory === cat.name
                    return (
                        <button
                            key={cat.name}
                            onClick={() => onCategoryChange(cat.name)}
                            className={`
                                flex items-center gap-3 px-8 py-3 rounded-full transition-all duration-500
                                ${isActive 
                                    ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' 
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                        >
                            <cat.icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {cat.name}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
