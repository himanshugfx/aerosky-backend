// Mobile Authentication API - Get current user endpoint
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);

        if (!auth) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id }
        });

        return NextResponse.json({
            id: auth.user.id,
            email: auth.user.email || user?.email,
            fullName: user?.fullName || auth.user.username,
            role: auth.user.role,
        });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 }
        );
    }
}
