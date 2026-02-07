// Mobile Authentication API - Get current user endpoint
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const token = getTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        // Verify token
        const payload = verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Return user data
        return NextResponse.json({
            id: user.id,
            email: user.email,
            fullName: user.fullName || user.username,
            role: user.role,
            organizationId: user.organizationId,
        });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
