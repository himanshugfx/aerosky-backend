// Mobile Authentication API - Login endpoint
import { signToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, username } = body;

        // Support both email and username for login
        const loginId = username || email;

        if (!loginId || !password) {
            return NextResponse.json(
                { error: 'Username/email and password are required' },
                { status: 400 }
            );
        }

        // Find user by username OR email
        let user = await prisma.user.findUnique({
            where: { username: loginId }
        });

        // If not found by username, try email
        if (!user) {
            user = await prisma.user.findUnique({
                where: { email: loginId }
            });
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = signToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        // Return user data and token with CORS headers
        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email || user.username,
                fullName: user.fullName || user.username,
                role: user.role,
                organizationId: user.organizationId,
            }
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'An error occurred during login' },
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
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
