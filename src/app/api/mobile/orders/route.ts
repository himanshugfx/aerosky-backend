import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check permission
    const permCheck = checkResourceAccess(auth.user, 'order', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const where: any = {};
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const items = await prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error('Fetch orders error:', error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check permission
    const permCheck = checkResourceAccess(auth.user, 'order', 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { organizationId, ...data } = body;

        // Use provided organizationId if super admin, else use current user's org
        const targetOrgId = auth.user.role === 'SUPER_ADMIN' ? organizationId : auth.user.organizationId;

        const item = await prisma.order.create({
            data: {
                ...data,
                organizationId: targetOrgId
            }
        });
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
