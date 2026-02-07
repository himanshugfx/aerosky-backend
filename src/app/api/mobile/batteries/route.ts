import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'battery', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const where: any = {};
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const items = await prisma.battery.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error('Fetch batteries error:', error);
        return NextResponse.json({ error: "Failed to fetch batteries" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'battery', 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { organizationId, ...data } = body;

        // Use provided organizationId if super admin, else use current user's org
        const targetOrgId = auth.user.role === 'SUPER_ADMIN' ? organizationId : auth.user.organizationId;

        const item = await prisma.battery.create({
            data: {
                ...data,
                organizationId: targetOrgId
            }
        });
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Create battery error:', error);
        return NextResponse.json({ error: "Failed to create battery" }, { status: 500 });
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
