// Mobile Authentication API - Register/update push token endpoint
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Update user's push token in the database
        await prisma.user.update({
            where: { id: auth.user.id },
            data: { pushToken: token }
        });

        console.log(`[PUSH TOKEN] Registered token for user ${auth.user.username}: ${token}`);

        return NextResponse.json({ success: true, message: 'Push token registered successfully' }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });

    } catch (error) {
        console.error('Register push token error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
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
