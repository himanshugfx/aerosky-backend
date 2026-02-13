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
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const where: any = {
            organizationId: auth.user.role !== 'SUPER_ADMIN' ? auth.user.organizationId : undefined,
        };

        if (search) {
            where.OR = [
                { component: { name: { contains: search, mode: 'insensitive' } } },
                { subcontractor: { companyName: { contains: search, mode: 'insensitive' } } },
                { takenOutFor: { contains: search, mode: 'insensitive' } },
            ];
        }

        const transactions = await prisma.inventoryTransaction.findMany({
            where,
            include: {
                component: true,
                subcontractor: true,
                user: { select: { fullName: true, username: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Mobile: Fetch transactions error:', error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { componentId, type, quantity, subcontractorId, takenOutFor, date } = body;

        const permAction = type === 'IN' ? 'edit' : 'delete';
        const permCheck = checkResourceAccess(auth.user, 'inventory' as any, permAction as any);
        if (permCheck !== true) return permCheck;

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    componentId,
                    type,
                    quantity,
                    subcontractorId,
                    userId: auth.user.id,
                    takenOutFor,
                    date: date ? new Date(date) : new Date(),
                    organizationId: auth.user.organizationId!,
                }
            });

            const quantityChange = type === 'IN' ? quantity : -quantity;
            await tx.component.update({
                where: { id: componentId },
                data: { quantity: { increment: quantityChange } }
            });

            return transaction;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Mobile: Create transaction error:', error);
        return NextResponse.json({ error: "Failed to process inventory transaction" }, { status: 500 });
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
