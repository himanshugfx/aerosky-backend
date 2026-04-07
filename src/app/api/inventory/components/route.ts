import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all components
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'component', 'view' as any);
    if (permCheck !== true) return permCheck;

    try {
        const components = await prisma.component.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(components);
    } catch (error) {
        console.error('Fetch components error:', error);
        return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 });
    }
}

// POST create component
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'component', 'create' as any);
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { name, description, category } = body;

        const component = await prisma.component.create({
            data: {
                name,
                description,
                category: category || "Operational",
            },
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error: any) {
        console.error('Create component error:', error);
        return NextResponse.json({
            error: "Failed to create component",
            details: error.message || String(error)
        }, { status: 500 });
    }
}
