import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { sendWelcomeEmail } from '@/lib/email';
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'team', 'view');
    if (permCheck !== true) return permCheck;

    try {
        // Enforce organization scoping
        const where: any = {};
        if (auth.user.role !== 'SUPER_ADMIN') {
            where.organizationId = auth.user.organizationId;
        }

        const items = await prisma.teamMember.findMany({
            where,
            include: { user: { select: { role: true, username: true } } },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error('Fetch team error:', error);
        return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'team', 'create');
    if (permCheck !== true) return permCheck;

    try {
        const body = await request.json();
        const { name, accessId, position, email, phone, role, organizationId } = body;

        // Use provided organizationId or the user's own
        const targetOrgId = auth.user.role === 'SUPER_ADMIN' ? organizationId : auth.user.organizationId;

        // Create team member
        const teamMember = await prisma.teamMember.create({
            data: {
                name,
                accessId,
                position,
                email,
                phone,
                organizationId: targetOrgId,
            }
        });

        // Create a User account for the team member if email and phone are provided
        if (email && phone) {
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(phone, 12);

            // Check if user with this email already exists
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email }, { username: email }] }
            });

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        username: email,
                        email,
                        fullName: name,
                        passwordHash,
                        role: role || 'VIEWER',
                        organizationId: targetOrgId,
                        teamMemberId: teamMember.id,
                    }
                });
                console.log(`Created user account for staff: ${email} (password: phone number)`);
            }

            // Always send welcome email when team member is created
            sendWelcomeEmail(email, name, email, phone, 'team_member').catch(err => console.error('Welcome email failed:', err));
        }

        return NextResponse.json(teamMember, { status: 201 });
    } catch (error: any) {
        console.error('Create team member error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "A team member with this Access ID or Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
    }
}

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
