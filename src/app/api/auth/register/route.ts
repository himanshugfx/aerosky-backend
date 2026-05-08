import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { localLoginLimiter } from "@/lib/rate-limiter";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Input validation schema
const registerSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    full_name: z.string().min(2, "Full name required").max(255),
    role: z.enum(['ADMIN', 'USER', 'MANUFACTURING', 'ADMINISTRATION']).optional().default('USER'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input
        const validated = registerSchema.parse(body);
        const { email, password, full_name, role } = validated;

        // Apply rate limiting (3 registration attempts per 15 minutes per email)
        const { success, retryAfter } = await localLoginLimiter.limit(email, 3, 15 * 60 * 1000);
        if (!success) {
            return NextResponse.json(
                { error: "Too many registration attempts. Try again later." },
                { status: 429 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { 
                OR: [
                    { username: email },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Check if team member exists
        const teamMember = await prisma.teamMember.findFirst({ where: { email } });
        
        // Create user
        const user = await prisma.user.create({
            data: {
                username: email,
                email: email,
                fullName: full_name,
                passwordHash: passwordHash,
                role: (role as any) || 'USER',
                teamMemberId: teamMember?.id || null,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
            }
        });

        return NextResponse.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            message: "User registered successfully"
        }, { status: 201 });

    } catch (error: any) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { 
                    error: "Validation failed",
                    fields: error.flatten().fieldErrors
                },
                { status: 400 }
            );
        }

        console.error("Registration error:", error);
        return NextResponse.json({ 
            error: "Failed to register user",
        }, { status: 500 });
    }
}

