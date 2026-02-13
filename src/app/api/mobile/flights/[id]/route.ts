import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const flightLog = await prisma.flightLog.findUnique({
            where: { id },
            include: {
                drone: true,
                pic: true,
                vo: true,
                battery: true
            }
        });

        if (!flightLog) {
            return NextResponse.json({ error: "Flight log not found" }, { status: 404 });
        }

        // Organization scoping check
        if (auth.user.role !== 'SUPER_ADMIN' && flightLog.organizationId !== auth.user.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(flightLog);
    } catch (error) {
        console.error("Error fetching flight log:", error);
        return NextResponse.json({ error: "Failed to fetch flight log" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        const flightLog = await prisma.flightLog.findUnique({
            where: { id },
            select: { organizationId: true }
        });

        if (!flightLog) {
            return NextResponse.json({ error: "Flight log not found" }, { status: 404 });
        }

        // Organization scoping check
        if (auth.user.role !== 'SUPER_ADMIN' && flightLog.organizationId !== auth.user.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.flightLog.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting flight log:", error);
        return NextResponse.json({ error: "Failed to delete flight log" }, { status: 500 });
    }
}
