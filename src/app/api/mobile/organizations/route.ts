import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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
// Also creates an admin user for the organization
// Admin Login: organization email, Password: organization phone
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

        if (!email) {
            return NextResponse.json({ error: 'Email is required for admin login' }, { status: 400 });
        }

        if (!phone) {
            return NextResponse.json({ error: 'Phone is required for admin password' }, { status: 400 });
        }

        // Check if a user with this email already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Create organization and admin user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the organization
            const organization = await tx.organization.create({
                data: {
                    name,
                    email,
                    phone,
                    address
                }
            });

            // Hash the phone number as password
            const passwordHash = await bcrypt.hash(phone, 12);

            // Create admin user for this organization
            const adminUser = await tx.user.create({
                data: {
                    username: email,
                    email: email,
                    passwordHash: passwordHash,
                    fullName: `${name} Admin`,
                    role: 'ADMIN',
                    organizationId: organization.id
                }
            });

            return { organization, adminUser };
        });

        console.log('Created organization and admin:', result.organization.name, result.adminUser.email);

        return NextResponse.json({
            ...result.organization,
            adminCredentials: {
                login: email,
                password: phone,
                note: 'Organization admin created automatically'
            }
        }, {
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

