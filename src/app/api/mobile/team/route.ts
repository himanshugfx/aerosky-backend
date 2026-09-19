import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permCheck = checkResourceAccess(auth.user, 'team', 'view');
    if (permCheck !== true) return permCheck;

    try {
        const where: any = {};

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
        const { name, accessId, position, email, phone, role } = body;

        // Create team member
        const teamMember = await prisma.teamMember.create({
            data: {
                name,
                accessId,
                position,
                email,
                phone,
            }
        });

        let temporaryPassword: string | undefined;

        // Create a User account for the team member if email is provided
        if (email) {
            const crypto = require('crypto');
            const bcrypt = require('bcryptjs');
            temporaryPassword = crypto.randomBytes(6).toString('hex');
            const passwordHash = await bcrypt.hash(temporaryPassword, 12);

            // Restrict role assignment: only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN
            let assignedRole = role || 'VIEWER';
            if (['SUPER_ADMIN', 'ADMIN'].includes(assignedRole) && auth.user.role !== 'SUPER_ADMIN') {
                assignedRole = 'VIEWER';
            }

            // Check if user with this email already exists
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email }, { username: email }] }
            });

            if (!existingUser) {
                let supabaseId: string | undefined;

                if (supabaseAdmin) {
                    try {
                        const { data: sbUser } = await supabaseAdmin.auth.admin.createUser({
                            email,
                            password: temporaryPassword,
                            email_confirm: true,
                            user_metadata: {
                                full_name: name,
                                role: assignedRole,
                            }
                        });
                        if (sbUser?.user) {
                            supabaseId = sbUser.user.id;
                        }
                    } catch (sbErr) {
                        console.warn('Supabase mobile user creation notice:', sbErr);
                    }
                }

                await prisma.user.create({
                    data: {
                        username: email,
                        email,
                        fullName: name,
                        passwordHash,
                        supabaseId,
                        role: assignedRole,
                        teamMemberId: teamMember.id,
                    }
                });
            }
        }

        return NextResponse.json({
            ...teamMember,
            ...(temporaryPassword ? { temporaryPassword } : {}),
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create team member error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "A team member with this Access ID or Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
    }
}
