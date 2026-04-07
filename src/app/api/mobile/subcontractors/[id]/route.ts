import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const existingSub = await prisma.subcontractor.findUnique({
            where: { id: params.id },
            /* select: { organizationId: true } removed */
        });

        if (!existingSub) {
            return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
        }

        // Organization scoping check
        // Scoping check removed
        const body = await request.json();
        const { id, createdAt, organizationId, ...data } = body;

        const item = await prisma.subcontractor.update({
            where: { id: params.id },
            data: {
                ...data,
            },
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("Update subcontractor error:", error);
        return NextResponse.json({ error: "Failed to update subcontractor" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const existingSub = await prisma.subcontractor.findUnique({
            where: { id: params.id },
            /* select: { organizationId: true } removed */
        });

        if (!existingSub) {
            return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
        }

        // Organization scoping check
        // Scoping check removed
        await prisma.subcontractor.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete subcontractor error:", error);
        return NextResponse.json({ error: "Failed to delete subcontractor" }, { status: 500 });
    }
}
