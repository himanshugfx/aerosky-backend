// Support Ticket Detail API - Get, Update, Delete single ticket
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get single ticket with all messages
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true
                    }
                },
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Check authorization
        if (auth.user.role !== 'SUPER_ADMIN' && ticket.userId !== auth.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Reset hasNewReply if the owner is viewing it
        if (auth.user.role !== 'SUPER_ADMIN' && ticket.userId === auth.user.id && ticket.hasNewReply) {
            await prisma.supportTicket.update({
                where: { id: params.id },
                data: { hasNewReply: false }
            });
            ticket.hasNewReply = false;
        }

        return NextResponse.json(ticket, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Get ticket error:', error);
        return NextResponse.json(
            { error: 'Failed to get ticket', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update ticket status
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only SUPER_ADMIN can update ticket status
        if (auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, priority } = body;

        const ticket = await prisma.supportTicket.update({
            where: { id: params.id },
            data: {
                ...(status && { status }),
                ...(priority && { priority })
            }
        });

        return NextResponse.json(ticket, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Update ticket error:', error);
        return NextResponse.json(
            { error: 'Failed to update ticket', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete ticket
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only SUPER_ADMIN can delete tickets
        if (auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.supportTicket.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Delete ticket error:', error);
        return NextResponse.json(
            { error: 'Failed to delete ticket', details: error.message },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
