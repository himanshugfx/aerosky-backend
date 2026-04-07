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
        if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
            // Organization scoping
            if (auth.user.organizationId) {
                where.organizationId = auth.user.organizationId;
            } else {
                // If no organization is set, return empty array for security
                return NextResponse.json([]);
            }
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
        const data = await request.json();

        const item = await prisma.battery.create({
            data: {
                ...data,
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
