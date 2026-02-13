import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'inventory' as any, 'view');
    if (permCheck !== true) return permCheck;

    try {
        const where: any = {};
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const components = await prisma.component.findMany({
            where,
            orderBy: { name: "asc" },
        });
        return NextResponse.json(components);
    } catch (error) {
        console.error('Mobile: Fetch components error:', error);
        return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'inventory' as any, 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { name, description } = body;

        const component = await prisma.component.create({
            data: {
                name,
                description,
                organizationId: auth.user.organizationId!,
            },
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        console.error('Mobile: Create component error:', error);
        return NextResponse.json({ error: "Failed to create component" }, { status: 500 });
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
