import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                passwordHash: true,
                teamMember: {
                    select: {
                        name: true,
                        position: true,
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            fullName: user.fullName || user.teamMember?.name || user.username,
            email: user.email,
            username: user.username,
            role: user.role,
            hasPassword: Boolean(user.passwordHash),
        });
    } catch (error: any) {
        console.error('Error fetching profile settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { fullName, name } = body;
        const nameToSave = (fullName || name);

        if (!nameToSave || typeof nameToSave !== 'string' || !nameToSave.trim()) {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
        }

        const trimmedName = nameToSave.trim();
        if (trimmedName.length > 100) {
            return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
        }

        // Update user record
        const updatedUser = await prisma.user.update({
            where: { id: auth.user.id },
            data: { fullName: trimmedName },
            select: { id: true, fullName: true, teamMemberId: true, supabaseId: true }
        });

        // If linked to team member, sync team member name
        if (updatedUser.teamMemberId) {
            try {
                await prisma.teamMember.update({
                    where: { id: updatedUser.teamMemberId },
                    data: { name: trimmedName }
                });
            } catch (tmErr) {
                console.warn('Error syncing team member name:', tmErr);
            }
        }

        // If linked to Supabase, sync metadata
        if (updatedUser.supabaseId && supabaseAdmin) {
            try {
                await supabaseAdmin.auth.admin.updateUserById(updatedUser.supabaseId, {
                    user_metadata: { full_name: trimmedName }
                });
            } catch (sbErr) {
                console.warn('Supabase admin name update notice:', sbErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Profile details updated successfully',
            name: trimmedName
        });
    } catch (error: any) {
        console.error('Error updating profile settings:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return PUT(request);
}
