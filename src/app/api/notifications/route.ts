import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const whereClause = {};

        // 1. Fetch Recent Flight Logs (Last 3)
        const recentFlights = await prisma.flightLog.findMany({
            where: whereClause,
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { drone: true }
        });

        // 2. Fetch Support Tickets with New Replies
        const supportUpdates = await prisma.supportTicket.findMany({
            where: {
                ...whereClause,
                hasNewReply: true
            },
            take: 2,
            orderBy: { updatedAt: 'desc' }
        });

        // 3. Fetch Recent Order Stage Updates (Last 2)
        const recentOrders = await prisma.order.findMany({
            where: whereClause,
            take: 2,
            orderBy: { updatedAt: 'desc' }
        });

        // Transform into unified notification format
        interface Notification {
            id: string;
            title: string;
            message: string;
            time: string;
            type: 'success' | 'info' | 'warning' | 'error';
        }
        const notifications: Notification[] = [];

        // Add Flight Notifications
        recentFlights.forEach(flight => {
            notifications.push({
                id: `flight-${flight.id}`,
                title: 'Mission Status',
                message: `${flight.missionType} mission logged.`,
                time: formatTimeAgo(flight.createdAt),
                type: 'success'
            });
        });

        // Add Support Notifications
        supportUpdates.forEach(ticket => {
            notifications.push({
                id: `ticket-${ticket.id}`,
                title: 'Support Update',
                message: `New reply on ticket: ${ticket.subject}`,
                time: formatTimeAgo(ticket.updatedAt),
                type: 'info'
            });
        });

        // Add Order Notifications
        recentOrders.forEach(order => {
            notifications.push({
                id: `order-${order.id}`,
                title: 'Production Update',
                message: `Order for ${order.clientName} moved to ${order.manufacturingStage} stage.`,
                time: formatTimeAgo(order.updatedAt),
                type: 'warning'
            });
        });

        return NextResponse.json(notifications);

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
