'use client'

import {
    Battery,
    Building2,
    HelpCircle,
    Loader2,
    Plane,
    ShoppingCart,
    TrendingUp,
    Users
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
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const [stats, setStats] = useState<DashboardStats>({ drones: 0, team: 0, orders: 0, batteries: 0, organizations: 0, tickets: 0 })
    const [loading, setLoading] = useState(true)

    const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch data in parallel
                const [dronesRes, teamRes, ordersRes, batteriesRes, orgsRes, ticketsRes] = await Promise.all([
                    fetch('/api/mobile/drones').catch(() => null),
                    fetch('/api/mobile/team').catch(() => null),
                    fetch('/api/mobile/orders').catch(() => null),
                    fetch('/api/mobile/batteries').catch(() => null),
                    fetch('/api/mobile/organizations').catch(() => null),
                    fetch('/api/mobile/support').catch(() => null),
                ])

                const drones = dronesRes?.ok ? await dronesRes.json() : []
                const team = teamRes?.ok ? await teamRes.json() : []
                const orders = ordersRes?.ok ? await ordersRes.json() : []
                const batteries = batteriesRes?.ok ? await batteriesRes.json() : []
                const organizations = orgsRes?.ok ? await orgsRes.json() : []
                const tickets = ticketsRes?.ok ? await ticketsRes.json() : []

                setStats({
                    drones: Array.isArray(drones) ? drones.length : 0,
                    team: Array.isArray(team) ? team.length : 0,
                    orders: Array.isArray(orders) ? orders.length : 0,
                    batteries: Array.isArray(batteries) ? batteries.length : 0,
                    organizations: Array.isArray(organizations) ? organizations.length : 0,
                    tickets: Array.isArray(tickets) ? tickets.length : 0,
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
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const superAdminCards = [
        { name: 'Organizations', value: stats.organizations, icon: Building2, color: 'blue', href: '/dashboard/organizations' },
        { name: 'Support Tickets', value: stats.tickets, icon: HelpCircle, color: 'purple', href: '/dashboard/support' },
    ]

    const orgAdminCards = [
        { name: 'Active Drones', value: stats.drones, icon: Plane, color: 'blue', href: '/dashboard/drones' },
        { name: 'Team Members', value: stats.team, icon: Users, color: 'green', href: '/dashboard/team' },
        { name: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'purple', href: '/dashboard/orders' },
        { name: 'Batteries', value: stats.batteries, icon: Battery, color: 'amber', href: '/dashboard/batteries' },
    ]

    const statCards = isSuperAdmin ? superAdminCards : orgAdminCards

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {session?.user?.name || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">
                    {isSuperAdmin
                        ? 'Here\'s an overview of all platform activity'
                        : 'Here\'s what\'s happening with your organization today'
                    }
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Link
                        key={stat.name}
                        href={stat.href}
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.name}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-gray-500">View all →</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isSuperAdmin ? (
                        <>
                            <Link href="/dashboard/organizations" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
                                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-blue-700">Add Organization</span>
                            </Link>
                            <Link href="/dashboard/support" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
                                <HelpCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-purple-700">View Tickets</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/dashboard/drones" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
                                <Plane className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-blue-700">Add Drone</span>
                            </Link>
                            <Link href="/dashboard/team" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
                                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-green-700">Add Team Member</span>
                            </Link>
                            <Link href="/dashboard/orders" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors">
                                <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-purple-700">New Order</span>
                            </Link>
                            <Link href="/dashboard/support" className="p-4 bg-amber-50 rounded-lg text-center hover:bg-amber-100 transition-colors">
                                <HelpCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-amber-700">Get Support</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
