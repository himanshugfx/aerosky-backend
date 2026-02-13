import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT update subcontractor
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'subcontractor', 'edit');
    if (permCheck !== true) return permCheck;

    try {
        const { id } = await params;
        const body = await request.json();
        const { companyName, type, contactPerson, contactEmail, contactPhone, agreementDate } = body;

        // Check if user has access to this subcontractor
        const existing = await prisma.subcontractor.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });

        if (auth.user.role !== 'SUPER_ADMIN' && existing.organizationId !== auth.user.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const subcontractor = await prisma.subcontractor.update({
            where: { id },
            data: { companyName, type, contactPerson, contactEmail, contactPhone, agreementDate },
        });

        return NextResponse.json(subcontractor);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update subcontractor" }, { status: 500 });
    }
}

// DELETE subcontractor
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'subcontractor', 'delete');
    if (permCheck !== true) return permCheck;

    try {
        const { id } = await params;

        // Check if user has access to this subcontractor
        const existing = await prisma.subcontractor.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });

        if (auth.user.role !== 'SUPER_ADMIN' && existing.organizationId !== auth.user.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.subcontractor.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete subcontractor" }, { status: 500 });
    }
}
