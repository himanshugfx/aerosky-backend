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
        // Filter by organization if user is not SUPER_ADMIN
        if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
            if (auth.user.organizationId) {
                where.organizationId = auth.user.organizationId;
            } else {
                // If no organization is set, return empty array for security
                return NextResponse.json([]);
            }
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
        const { name, description, category } = body;

        // Use user's organization or return error
        if (!auth.user.organizationId) {
            return NextResponse.json({ error: "User must be associated with an organization" }, { status: 400 });
        }

        const component = await prisma.component.create({
            data: {
                name,
                description,
                category: category || "Operational",
                organizationId: auth.user.organizationId,
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
