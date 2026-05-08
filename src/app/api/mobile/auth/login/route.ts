// Mobile Authentication API - Login endpoint
import { authService } from '@/lib/auth-service';
import { localLoginLimiter } from '@/lib/rate-limiter';
import { handleError, errors } from '@/lib/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, username } = body;

        // Support both email and username for login
        const loginId = username || email;

        if (!loginId || !password) {
            throw errors.validationError({
                loginId: ['Username/email is required'],
                password: ['Password is required']
            });
        }

        // Apply rate limiting
        const { success, remaining, retryAfter } = await localLoginLimiter.limit(loginId);

        if (!success) {
            return NextResponse.json(
                {
                    error: 'TOO_MANY_ATTEMPTS',
                    message: `Too many login attempts. Try again in ${retryAfter}s`,
                    retryAfter,
                },
                { status: 429 }
            );
        }

        // Authenticate user
        const user = await authService.authenticateWithCredentials(loginId, password);

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = authService.generateJwt(user);

        // Return user data and token
        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email || user.username,
                fullName: user.username, // Assuming username is the display name
                role: user.role,
                organizationId: user.organizationId,
            }
        });

    } catch (error) {
        return handleError(error);
    }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
