import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { checkResourceAccess } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { createTeamMemberSchema, validateRequest } from '@/lib/schemas';
import { handleError, errors } from '@/lib/error-handler';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Generate sequential access ID (AS001, AS002, etc.)
async function generateSequentialAccessId() {
    // Find the member with the highest ID starting with "AS"
    const lastMember = await prisma.teamMember.findFirst({
        where: {
            accessId: {
                startsWith: "AS",
            },
        },
        orderBy: {
            accessId: "desc",
        },
    });

    if (!lastMember) {
        return "AS001";
    }

    // Extract the number part
    const lastId = lastMember.accessId;
    const numberPart = parseInt(lastId.replace("AS", ""), 10);

    if (isNaN(numberPart)) {
        return "AS001";
    }

    const nextNumber = numberPart + 1;
    return `AS${nextNumber.toString().padStart(3, "0")}`;
}

// GET all team members (Authenticated only)
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const permCheck = checkResourceAccess(auth.user, 'team', 'view');
        if (permCheck !== true) return permCheck;

        const teamMembers = await prisma.teamMember.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(teamMembers);
    } catch (error) {
        return handleError(error);
    }
}

// POST create team member
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            throw errors.unauthorized();
        }

        const permCheck = checkResourceAccess(auth.user, 'team', 'create');
        if (permCheck !== true) return permCheck;

        const body = await request.json();

        // Validate input
        const validation = validateRequest(createTeamMemberSchema, body);
        if (validation.error) {
            throw errors.validationError(validation.error.fields);
        }

        const { data: validated } = validation;

        const newAccessId = await generateSequentialAccessId();

        const teamMember = await prisma.teamMember.create({
            data: {
                accessId: newAccessId,
                name: validated.name,
                phone: validated.phone,
                email: validated.email,
                position: validated.position,
            },
        });

        let temporaryPassword: string | undefined;

        // Create a User account for the team member if email and phone are provided
        if (validated.email) {
            // Generate a secure, cryptographically random temporary password
            temporaryPassword = crypto.randomBytes(6).toString('hex');
            const passwordHash = await bcrypt.hash(temporaryPassword, 12);

            // Check if user with this email already exists
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email: validated.email }, { username: validated.email }] }
            });

            if (!existingUser) {
                let supabaseId: string | undefined;

                // Non-admins can only provision VIEWER roles
                const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATION'].includes(auth.user.role);
                const assignedRole = isPrivileged ? (validated.role || 'VIEWER') : 'VIEWER';

                if (supabaseAdmin) {
                    try {
                        const { data: sbUser } = await supabaseAdmin.auth.admin.createUser({
                            email: validated.email,
                            password: temporaryPassword,
                            email_confirm: true,
                            user_metadata: {
                                full_name: validated.name,
                                role: assignedRole,
                            }
                        });
                        if (sbUser?.user) {
                            supabaseId = sbUser.user.id;
                        }
                    } catch (sbErr) {
                        console.warn('Supabase user creation notice:', sbErr);
                    }
                }

                await prisma.user.create({
                    data: {
                        username: validated.email,
                        email: validated.email,
                        fullName: validated.name,
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
            temporaryPassword,
        }, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
