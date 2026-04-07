import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET Fetch expenses
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins can access general expenses
    if (!['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'].includes(auth.user.role)) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');

        const where: any = {};

        // Organization scoping
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        if (category) where.category = category;
        if (status) where.status = status;

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Fetch expenses error:', error);
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

// POST Create an expense
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'].includes(auth.user.role)) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { description, amount, date, category, paymentMethod, status, attachment } = body;

        if (!description || !amount || !date || !category) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!auth.user.organizationId) {
            return NextResponse.json({ error: "User is not associated with any organization" }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: parseFloat(amount),
                date: new Date(date),
                category,
                paymentMethod,
                status: status || "Paid",
                attachment,
                organizationId: auth.user.organizationId,
            }
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error: any) {
        console.error('Create expense error:', error);
        return NextResponse.json({
            error: "Failed to create expense",
            details: error.message
        }, { status: 500 });
    }
}

// PATCH Update an expense
export async function PATCH(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'].includes(auth.user.role)) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing expense id' }, { status: 400 });
        }

        // Ensure expense belongs to the same organization
        const where: any = { id };
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        if (data.date) data.date = new Date(data.date);
        if (data.amount) data.amount = parseFloat(data.amount);

        const expense = await prisma.expense.updateMany({
            where,
            data
        });

        if (expense.count === 0) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update expense error:', error);
        return NextResponse.json({
            error: 'Failed to update expense',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE an expense
export async function DELETE(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER'].includes(auth.user.role)) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing expense id' }, { status: 400 });
        }

        const where: any = { id };
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const deleted = await prisma.expense.deleteMany({
            where
        });

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete expense error:', error);
        return NextResponse.json({
            error: 'Failed to delete expense',
            details: error.message
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
