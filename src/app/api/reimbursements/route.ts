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

        // Filtering for regular users (only their own)
        // Only ADMINISTRATION can see all reimbursements
        if (auth.user.role !== 'ADMINISTRATION') {
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
        const { name, category, amount, date, billData } = body;

        if (!name || !amount || !date || !billData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const reimbursement = await prisma.reimbursement.create({
            data: {
                name,
                category: category || "Other",
                amount: parseFloat(amount),
                date: new Date(date),
                billData,
                userId: auth.user.id,
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

// PATCH Update reimbursement status (administration only)
export async function PATCH(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only ADMINISTRATION can change status
    if (auth.user.role !== 'ADMINISTRATION') {
        return NextResponse.json({ error: 'Forbidden: Administration access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const validStatuses = ['Pending', 'Approved', 'Completed', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const reimbursement = await prisma.reimbursement.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, status: reimbursement.status });
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
