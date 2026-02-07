import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
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

        // If a role is provided, create a User record
        if (role && email) {
            const passwordHash = await require('bcryptjs').hash('AeroSky2026', 10);

            // Generate unique username from email or name
            const username = email.split('@')[0].toLowerCase() + '_' + Math.floor(Math.random() * 1000);

            await prisma.user.create({
                data: {
                    username,
                    email,
                    fullName: name,
                    passwordHash,
                    role: role,
                    organizationId: targetOrgId,
                    teamMemberId: teamMember.id,
                }
            });
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
