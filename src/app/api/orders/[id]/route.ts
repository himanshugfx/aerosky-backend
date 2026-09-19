import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/api-auth';
import { checkResourceAccess } from '@/lib/authorize';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permCheck = checkResourceAccess(auth.user, 'order', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Failed to fetch order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permCheck = checkResourceAccess(auth.user, 'order', 'edit');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();

        const updateData: any = {};
        if (body.clientName !== undefined) updateData.clientName = body.clientName;
        if (body.clientSegment !== undefined) updateData.clientSegment = body.clientSegment;
        if (body.orderDate !== undefined) updateData.orderDate = new Date(body.orderDate);
        if (body.estimatedCompletionDate !== undefined) {
            updateData.estimatedCompletionDate = body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : null;
        }
        if (body.contractValue !== undefined) updateData.contractValue = parseFloat(body.contractValue);
        if (body.currency !== undefined) updateData.currency = body.currency;
        if (body.revenueRecognitionStatus !== undefined) updateData.revenueRecognitionStatus = body.revenueRecognitionStatus;
        if (body.manufacturingStage !== undefined) updateData.manufacturingStage = body.manufacturingStage;
        if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
        if (body.deliveryAddress !== undefined) updateData.deliveryAddress = body.deliveryAddress;
        if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson;
        if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
        if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
        if (body.quantity !== undefined) updateData.quantity = parseInt(body.quantity);
        if (body.unitPrice !== undefined) updateData.unitPrice = parseFloat(body.unitPrice);
        if (body.priorityLevel !== undefined) updateData.priorityLevel = body.priorityLevel;
        if (body.qualityCheckStatus !== undefined) updateData.qualityCheckStatus = body.qualityCheckStatus;
        if (body.internalOrderNotes !== undefined) updateData.internalOrderNotes = body.internalOrderNotes;
        if (body.cocData !== undefined) updateData.cocData = body.cocData;

        const order = await prisma.order.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Failed to update order:', error);
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Contract number already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await authenticateRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permCheck = checkResourceAccess(auth.user, 'order', 'delete');
    if (permCheck !== true) return permCheck;

    try {
        await prisma.order.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete order:', error);
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
}
