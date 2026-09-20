import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword) {
            return NextResponse.json({ error: "New password is required" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 });
        }

        // Get fresh user record
        const user = await prisma.user.findUnique({
            where: { id: auth.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If user already has a password, verify current password
        if (user.passwordHash) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required" }, { status: 400 });
            }

            let isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid && user.email) {
                try {
                    const { data: sbData } = await supabase.auth.signInWithPassword({
                        email: user.email,
                        password: currentPassword,
                    });
                    if (sbData?.user) {
                        isValid = true;
                    }
                } catch (sbErr) {
                    console.warn("Supabase password verification check error:", sbErr);
                }
            }

            if (!isValid) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // Update password in Prisma
        await prisma.user.update({
            where: { id: auth.user.id },
            data: { passwordHash: newPasswordHash }
        });

        // Sync with Supabase Auth if user is linked
        if (user.supabaseId && supabaseAdmin) {
            try {
                await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, { password: newPassword });
            } catch (sbErr) {
                console.warn('Supabase admin password update notice:', sbErr);
            }
        }

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error: any) {
        console.error('Password update error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
