import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from '@/lib/email';
import { authService } from '@/lib/auth-service';
import { createTeamMemberSchema, validateRequest } from '@/lib/schemas';
import { handleError, errors } from '@/lib/error-handler';
import bcrypt from 'bcryptjs';

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

// GET all team members
export async function GET(request: NextRequest) {
    try {
        // For now, allow unauthenticated access to team list
        // In production, you might want to add authentication here
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
        // Authenticate user (assuming session-based for web)
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            throw errors.unauthorized();
        }

        // Get authenticated user details
        const authUser = await authService.authenticateWithCredentials(
            session.user.email || session.user.name || '',
            '' // Password not needed for session auth
        );

        if (!authUser) {
            throw errors.unauthorized();
        }

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
                organizationId: authUser.organizationId, // Add organization scoping
            },
        });

        // Create a User account for the team member if email and phone are provided
        if (validated.email && validated.phone) {
            const passwordHash = await authService.hashPassword(validated.phone);

            // Check if user with this email already exists
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email: validated.email }, { username: validated.email }] }
            });

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        username: validated.email,
                        email: validated.email,
                        fullName: validated.name,
                        passwordHash,
                        role: validated.role || 'ADMINISTRATION',
                        teamMemberId: teamMember.id,
                        organizationId: authUser.organizationId, // Add organization scoping
                    }
                });
                console.log(`Created user account for staff: ${validated.email} (password: phone number)`);
            }

            // Always send welcome email when team member is created
            sendWelcomeEmail(validated.email, validated.name, validated.email, validated.phone, 'team_member').catch(err => console.error('Welcome email failed:', err));
        }

        return NextResponse.json(teamMember, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
