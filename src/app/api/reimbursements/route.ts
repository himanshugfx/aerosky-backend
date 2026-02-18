import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET Fetch reimbursements
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: any = {};

        // Organization scoping
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        // Filtering for regular users (only their own)
        if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && auth.user.role !== 'OPERATIONS_MANAGER') {
            where.userId = auth.user.id;
        }

        if (status) {
            where.status = status;
        }

        const reimbursements = await prisma.reimbursement.findMany({
            where,
            include: {
                user: {
                    select: {
                        fullName: true,
                        username: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(reimbursements);
    } catch (error) {
        console.error('Fetch reimbursements error:', error);
        return NextResponse.json({ error: "Failed to fetch reimbursements" }, { status: 500 });
    }
}

// POST Submit a reimbursement
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, amount, date, billData } = body;

        if (!name || !amount || !date || !billData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!auth.user.organizationId) {
            return NextResponse.json({ error: "User is not associated with any organization" }, { status: 400 });
        }

        const reimbursement = await prisma.reimbursement.create({
            data: {
                name,
                amount: parseFloat(amount),
                date: new Date(date),
                billData,
                userId: auth.user.id,
                organizationId: auth.user.organizationId,
            }
        });

        return NextResponse.json(reimbursement, { status: 201 });
    } catch (error: any) {
        console.error('Create reimbursement error:', error);
        return NextResponse.json({
            error: "Failed to submit reimbursement",
            details: error.message
        }, { status: 500 });
    }
}

// PATCH Update reimbursement status (admin only)
export async function PATCH(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins can change status
    if (!['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'].includes(auth.user.role)) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const validStatuses = ['Pending', 'Approved', 'Completed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        // Ensure reimbursement belongs to the same organization
        const where: any = { id };
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const reimbursement = await prisma.reimbursement.updateMany({
            where,
            data: { status }
        });

        if (reimbursement.count === 0) {
            return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, status });
    } catch (error: any) {
        console.error('Update reimbursement status error:', error);
        return NextResponse.json({
            error: 'Failed to update status',
            details: error.message
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
