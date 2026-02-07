// Support Ticket API - List and Create
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get support tickets
// SUPER_ADMIN sees all tickets, ADMIN sees only their org's tickets
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can view support tickets
        if (auth.user.role !== 'ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let tickets;

        if (auth.user.role === 'SUPER_ADMIN') {
            // Super admin sees all tickets
            tickets = await prisma.supportTicket.findMany({
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
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    },
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: [
                    { status: 'asc' },
                    { priority: 'desc' },
                    { updatedAt: 'desc' }
                ]
            });
        } else {
            // Admin sees only their tickets
            tickets = await prisma.supportTicket.findMany({
                where: {
                    userId: auth.user.id
                },
                include: {
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    },
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: [
                    { status: 'asc' },
                    { updatedAt: 'desc' }
                ]
            });
        }

        return NextResponse.json(tickets, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Get support tickets error:', error);
        return NextResponse.json(
            { error: 'Failed to get tickets', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subject, message, priority } = body;

        if (!subject || !message) {
            return NextResponse.json(
                { error: 'Subject and message are required' },
                { status: 400 }
            );
        }

        // Create ticket with initial message in a transaction
        const ticket = await prisma.$transaction(async (tx) => {
            // Create the ticket
            const newTicket = await tx.supportTicket.create({
                data: {
                    subject,
                    priority: priority || 'NORMAL',
                    userId: auth.user.id,
                    organizationId: auth.user.organizationId
                }
            });

            // Create initial message
            await tx.supportMessage.create({
                data: {
                    ticketId: newTicket.id,
                    senderId: auth.user.id,
                    message
                }
            });

            return newTicket;
        });

        console.log('Created support ticket:', ticket.id, 'by user:', auth.user.username);

        return NextResponse.json({
            success: true,
            ticket,
            message: 'Your support ticket has been created'
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Create support ticket error:', error);
        return NextResponse.json(
            { error: 'Failed to create ticket', details: error.message },
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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
