import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'subcontractor', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const where: any = {};
        // Organization scoping - removed

        const items = await prisma.subcontractor.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error('Fetch subcontractors error:', error);
        return NextResponse.json({ error: "Failed to fetch subcontractors" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'subcontractor', 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { organizationId, ...data } = body;
        const item = await prisma.subcontractor.create({
            data: {
                ...data,
            }
        });
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Create subcontractor error:', error);
        return NextResponse.json({ error: "Failed to create subcontractor" }, { status: 500 });
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
