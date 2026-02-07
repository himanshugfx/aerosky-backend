import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const existingBattery = await prisma.battery.findUnique({
            where: { id: params.id },
            select: { organizationId: true }
        });

        if (!existingBattery) {
            return NextResponse.json({ error: "Battery not found" }, { status: 404 });
        }

        // Organization scoping check
        if (auth.user.role !== 'SUPER_ADMIN' && existingBattery.organizationId !== auth.user.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.battery.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete battery error:", error);
        return NextResponse.json({ error: "Failed to delete battery" }, { status: 500 });
    }
}
