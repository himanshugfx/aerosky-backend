import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - List organizations (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('Successfully fetched organizations:', organizations.length);
        return NextResponse.json(organizations, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    } catch (error: any) {
        console.error('List organizations error details:', error);
        return NextResponse.json(
            { error: 'Failed to list organizations', details: error.message },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                }
            }
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

// POST - Create organization (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, phone, address } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const organization = await prisma.organization.create({
            data: {
                name,
                email,
                phone,
                address
            }
        });

        return NextResponse.json(organization, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    } catch (error: any) {
        console.error('Create organization error:', error);
        return NextResponse.json(
            { error: 'Failed to create organization', details: error.message },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }
}
