import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Registration attempt:", body);
        const { email, password, full_name, role } = body;

        if (!email || !password) {
            console.log("Missing email or password");
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: { 
                OR: [
                    { username: email },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            console.log("User already exists:", email);
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        console.log("Creating user with role:", role);
        const teamMember = await prisma.teamMember.findFirst({ where: { email } });
        
        const user = await prisma.user.create({
            data: {
                username: email,
                email: email,
                fullName: full_name,
                passwordHash: passwordHash,
                role: (role as any) || 'ADMINISTRATION',
                teamMemberId: teamMember?.id || null,
            }
        });

        console.log("User created successfully:", user.id);
        return NextResponse.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            message: "User registered successfully"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json({ 
            error: "Failed to register user",
            details: error.message || String(error)
        }, { status: 500 });
    }
}
