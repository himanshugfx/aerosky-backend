'use client'

import {
    Activity,
    ArrowUpRight,
    Battery,
    Building2,
    Calendar,
    ChevronRight,
    Circle,
    Compass,
    HelpCircle,
    Layers,
    Loader2,
    Map,
    Plane,
    Send,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardStats {
    drones: number
    team: number
    orders: number
    batteries: number
    organizations: number
    tickets: number
    flights: number
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const [stats, setStats] = useState<DashboardStats>({ drones: 0, team: 0, orders: 0, batteries: 0, organizations: 0, tickets: 0, flights: 0 })
    const [loading, setLoading] = useState(true)

    const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [dronesRes, teamRes, ordersRes, batteriesRes, orgsRes, ticketsRes, flightsRes] = await Promise.all([
                    fetch('/api/mobile/drones').catch(() => null),
                    fetch('/api/mobile/team').catch(() => null),
                    fetch('/api/mobile/orders').catch(() => null),
                    fetch('/api/mobile/batteries').catch(() => null),
                    fetch('/api/mobile/organizations').catch(() => null),
                    fetch('/api/mobile/support').catch(() => null),
                    fetch('/api/mobile/flights').catch(() => null),
                ])

                const drones = dronesRes?.ok ? await dronesRes.json() : []
                const team = teamRes?.ok ? await teamRes.json() : []
                const orders = ordersRes?.ok ? await ordersRes.json() : []
                const batteries = batteriesRes?.ok ? await batteriesRes.json() : []
                const organizations = orgsRes?.ok ? await orgsRes.json() : []
                const tickets = ticketsRes?.ok ? await ticketsRes.json() : []
                const flights = flightsRes?.ok ? await flightsRes.json() : []

                setStats({
                    drones: Array.isArray(drones) ? drones.length : 0,
                    team: Array.isArray(team) ? team.length : 0,
                    orders: Array.isArray(orders) ? orders.length : 0,
                    batteries: Array.isArray(batteries) ? batteries.length : 0,
                    organizations: Array.isArray(organizations) ? organizations.length : 0,
                    tickets: Array.isArray(tickets) ? tickets.length : 0,
                    flights: Array.isArray(flights) ? flights.length : 0,
                })
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }

        if (session) fetchStats()
    }, [session])

    if (status === 'loading' || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100/50 border-t-indigo-600 rounded-full animate-spin"></div>
                    <ShieldCheck className="w-8 h-8 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] animate-pulse">Synchronizing Core Telemetry</p>
            </div>
        )
    }

    const statCards = isSuperAdmin ? [
        { name: 'Managed Entities', value: stats.organizations, icon: Building2, trend: '+4', label: 'Organizations', color: 'indigo' },
        { name: 'Active Inquiries', value: stats.tickets, icon: HelpCircle, trend: '-2', label: 'Support Tickets', color: 'slate' },
        { name: 'Core Volume', value: stats.orders, icon: ShoppingCart, trend: '+12%', label: 'Platform Transactions', color: 'violet' },
        { name: 'Global Network', value: stats.team, icon: Users, trend: '+8', label: 'Registered Users', color: 'emerald' },
    ] : [
        { name: 'Mission Fleet', value: stats.drones, icon: Plane, trend: 'Active', label: 'Current Airframes', color: 'indigo' },
        { name: 'Operational Crew', value: stats.team, icon: Users, trend: 'Vetted', label: 'Active Personnel', color: 'slate' },
        { name: 'Supply Units', value: stats.batteries, icon: Battery, trend: '98%', label: 'Power Modules', color: 'emerald' },
        { name: 'Contract Flow', value: stats.orders, icon: ShoppingCart, trend: '+14%', label: 'Active Orders', color: 'violet' },
    ]

    return (
        <div className="space-y-10 animate-slide-up pb-20">
            {/* Contextual Greeting */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="status-badge status-badge-info">System Online</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                        {isSuperAdmin
                            ? "Overview of global infrastructure performance and cross-network telemetry."
                            : "Fleet status remains optimal. All mission-critical systems are reporting green."
                        }
                    </p>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex items-center gap-3 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <button className="btn-premium-primary text-xs !px-5 !py-2.5">
                        <Activity className="w-4 h-4" />
                        Quick Report
                    </button>
                    <button className="btn-premium-ghost text-xs !px-5 !py-2.5">
                        <Plus className="w-4 h-4" />
                        Add Mission
                    </button>
                </div>
            </div>

            {/* Metrics Ecosystem */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="modern-card p-8 group relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />

                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border border-slate-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 ${stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                        stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                            stat.color === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-900'
                                    }`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>{stat.trend}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold mt-1">vs L30D</span>
                                </div>
                            </div>

                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Strategic Stage */}
            <div className="grid lg:grid-cols-3 gap-10">
                {/* Visual Operations Center */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="modern-card overflow-hidden h-[480px] flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <Map className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Fleet Operations Center</h3>
                                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Live Satellite View (Simulated)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-100 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Reload</button>
                                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10">Expand</button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 relative group">
                            {/* Map Placeholder Graphic */}
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 opacity-40">
                                <Globe className="w-20 h-20 text-slate-300 animate-spin-slow" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Awaiting Geodata Stream</p>
                            </div>

                            {/* Simulated Pings */}
                            <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
                            <div className="absolute bottom-1/2 right-1/4 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                        </div>
                    </div>

                    {/* Operational Shortcuts */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Register Drone', icon: Plus, href: '/dashboard/drones', sub: 'Fleet Expansion' },
                            { label: 'Process Inventory', icon: Boxes, href: '/dashboard/inventory', sub: 'Asset Management' },
                            { label: 'Review Logistics', icon: ShoppingCart, href: '/dashboard/orders', sub: 'Orders/Contracts' },
                            { label: 'Squad Management', icon: Users, href: '/dashboard/team', sub: 'Human Resources' },
                        ].map((act, i) => (
                            <Link key={i} href={act.href} className="modern-card p-6 flex flex-col items-center text-center gap-4 group hover:bg-indigo-600 transition-all duration-500">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:rotate-12 transition-all duration-500">
                                    <act.icon className="w-6 h-6 text-slate-900 group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 group-hover:text-white text-sm whitespace-nowrap">{act.label}</p>
                                    <p className="text-[10px] text-slate-400 group-hover:text-white/60 font-medium mt-1 uppercase tracking-tighter">{act.sub}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Intelligence Feed */}
                <div className="space-y-8">
                    <div className="modern-card p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">System Feed</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {[
                                { user: 'Nav-021', text: 'Telemetry linked successfully', type: 'FLIGHT', time: '2m' },
                                { user: 'Operations', text: 'New manufacturing order initialized', type: 'ORDER', time: '14m' },
                                { user: 'Security', text: 'Access token rotation completed', type: 'SYSTEM', time: '1h' },
                                { user: 'Logistics', text: 'Battery Batch-A reached critical capacity', type: 'HEALTH', time: '2h' },
                                { user: 'HQ-Central', text: 'Daily operational report generated', type: 'REPORT', time: '4h' },
                                { user: 'Fleet-Cmd', text: '3 airframes scheduled for maintenance', type: 'FLEET', time: '6h' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group cursor-default">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                            <Circle className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                                        </div>
                                        {i < 5 && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-100" />}
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">{item.user}</p>
                                            <span className="text-[10px] font-bold text-slate-400">{item.time} ago</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="mt-8 w-full btn-premium-ghost !py-3 text-xs flex items-center justify-center gap-2">
                            View Full Logs
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Performance Insight */}
                    <div className="modern-card p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden group">
                        <Sparkles className="absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <div className="relative">
                            <h4 className="text-lg font-black mb-2 tracking-tight">AI Insights</h4>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">Based on last week's telemetry, increasing mission altitude by 5% could optimize battery efficiency by 2.1%.</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Updated moments ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </div>
    )
}

function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

function Globe(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20" />
            <path d="M12 2a14.5 14.5 0 0 1 0 20" />
            <path d="M2 12h20" />
        </svg>
    )
}

function Boxes(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    )
}
