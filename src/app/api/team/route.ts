import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from '@/lib/email';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
        // Fallback if parsing fails, though shouldn't happen with strict format
        return "AS001";
    }

    const nextNumber = numberPart + 1;
    // Pad with leading zeros (e.g., 1 -> "001", 10 -> "010", 100 -> "100")
    return `AS${nextNumber.toString().padStart(3, "0")}`;
}

// GET all team members
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const teamMembers = await prisma.teamMember.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(teamMembers);
    } catch (error) {
        console.error("Failed to fetch team members:", error);
        return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }
}

// POST create team member
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, phone, email, position, role } = body;

        const newAccessId = await generateSequentialAccessId();
        const targetOrgId = (session.user as any).organizationId;

        const teamMember = await prisma.teamMember.create({
            data: {
                accessId: newAccessId,
                name,
                phone,
                email,
                position,
                organizationId: targetOrgId,
            },
        });

        // Create a User account for the team member if email and phone are provided
        if (email && phone) {
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

