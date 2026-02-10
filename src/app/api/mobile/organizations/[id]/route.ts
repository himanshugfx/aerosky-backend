import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get single organization
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const organization = await prisma.organization.findUnique({
            where: { id: params.id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true
                    }
                },
                _count: {
                    select: { users: true, drones: true }
                }
            }
        });

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        return NextResponse.json(organization, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Get organization error:', error);
        return NextResponse.json(
            { error: 'Failed to get organization', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update organization (also updates admin user email if changed)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, phone, address, otpVerificationId } = body;

        // Get current organization to check for email changes
        const currentOrg = await prisma.organization.findUnique({
            where: { id: params.id },
            include: {
                users: {
                    where: { role: 'ADMIN' },
                    take: 1
                }
            }
        });

        if (!currentOrg) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // If email is changing, check if new email is already in use
        if (email && email !== currentOrg.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { username: email }
                    ],
                    NOT: {
                        organizationId: params.id
                    }
                }
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'A user with this email already exists' },
                    { status: 400 }
                );
            }
        }

        // Update organization and admin user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update organization
            const organization = await tx.organization.update({
                where: { id: params.id },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                    ...(phone && { phone }),
                    ...(address !== undefined && { address })
                }
            });

            // If email changed and org has an admin user, update admin user's credentials
            if (email && email !== currentOrg.email && currentOrg.users.length > 0) {
                const adminUser = currentOrg.users[0];
                await tx.user.update({
                    where: { id: adminUser.id },
                    data: {
                        email: email,
                        username: email
                    }
                });
                console.log('Updated admin user email from', currentOrg.email, 'to', email);
            }

            // If phone changed and org has an admin user, update password (requires OTP verification)
            if (phone && phone !== currentOrg.phone && currentOrg.users.length > 0) {
                // Validate OTP verification
                if (!otpVerificationId) {
                    throw new Error('OTP verification required to change password');
                }
                const otpRecord = await tx.otpVerification.findUnique({
                    where: { id: otpVerificationId },
                });
                if (!otpRecord || !otpRecord.verified || otpRecord.email !== currentOrg.email) {
                    throw new Error('Invalid or expired OTP verification');
                }

                const adminUser = currentOrg.users[0];
                const passwordHash = await bcrypt.hash(phone, 12);
                await tx.user.update({
                    where: { id: adminUser.id },
                    data: { passwordHash }
                });
                // Clean up OTP records
                await tx.otpVerification.deleteMany({
                    where: { email: currentOrg.email! },
                });
                console.log('Updated admin user password (OTP verified)');
            }

            return organization;
        });

        return NextResponse.json(result, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Update organization error:', error);
        return NextResponse.json(
            { error: 'Failed to update organization', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete organization and its admin user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete organization and related data in a transaction
        await prisma.$transaction(async (tx) => {
            // First delete all users in the organization
            await tx.user.deleteMany({
                where: { organizationId: params.id }
            });

            // Delete all drones in the organization
            await tx.drone.deleteMany({
                where: { organizationId: params.id }
            });

            // Delete all team members
            await tx.teamMember.deleteMany({
                where: { organizationId: params.id }
            });

            // Delete all subcontractors
            await tx.subcontractor.deleteMany({
                where: { organizationId: params.id }
            });

            // Delete all batteries
            await tx.battery.deleteMany({
                where: { organizationId: params.id }
            });

            // Delete all orders
            await tx.order.deleteMany({
                where: { organizationId: params.id }
            });

            // Finally delete the organization
            await tx.organization.delete({
                where: { id: params.id }
            });
        });

        console.log('Deleted organization:', params.id);

        return NextResponse.json({ success: true, message: 'Organization deleted' }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('Delete organization error:', error);
        return NextResponse.json(
            { error: 'Failed to delete organization', details: error.message },
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
