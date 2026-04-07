import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET inventory transactions
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'inventory', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const where: any = {};

        // Add organization scoping
        if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && auth.user.role !== 'ADMINISTRATION') {
            if (auth.user.organizationId) {
                where.organizationId = auth.user.organizationId;
            } else {
                // If no organization is set, return empty array for security
                return NextResponse.json([]);
            }
        }

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
        console.error('Fetch transactions error:', error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

// POST create inventory transaction (IN or OUT)
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { componentId, type, quantity, subcontractorId, takenOutFor, date } = body;

        // Permission check based on type
        const permAction = type === 'IN' ? 'edit' : 'delete';
        const permCheck = checkResourceAccess(auth.user, 'inventory', permAction as any);
        if (permCheck !== true) return permCheck;

        // User must be associated with an organization
        if (!auth.user.organizationId) {
            return NextResponse.json({ error: "User must be associated with an organization" }, { status: 400 });
        }

        // Record the transaction and update the component quantity in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Record transaction
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    componentId,
                    type,
                    quantity: parseInt(quantity),
                    subcontractorId: subcontractorId || null,
                    userId: auth.user.id,
                    takenOutFor: takenOutFor || null,
                    date: date ? new Date(date) : new Date(),
                    organizationId: auth.user.organizationId!,
                }
            });

            // Update component stock
            const quantityChange = type === 'IN' ? parseInt(quantity) : -parseInt(quantity);
            await tx.component.update({
                where: { id: componentId },
                data: {
                    quantity: {
                        increment: quantityChange
                    }
                }
            });

            return transaction;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Create transaction error:', error);
        return NextResponse.json({
            error: "Failed to process inventory transaction",
            details: error.message || String(error)
        }, { status: 500 });
    }
}
