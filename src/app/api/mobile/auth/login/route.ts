// Mobile Authentication API - Login endpoint
import { authService } from '@/lib/auth-service';
import { localLoginLimiter } from '@/lib/rate-limiter';
import { handleError, errors } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, username } = body;

        // Support both email and username for login
        const loginId = (username || email || '').trim();

        if (!loginId || !password) {
            throw errors.validationError({
                loginId: ['Username/email is required'],
                password: ['Password is required']
            });
        }

        // Apply rate limiting
        const limitResult = await localLoginLimiter.limit(loginId);
        const success = typeof limitResult === 'object' && 'success' in limitResult ? limitResult.success : limitResult;

        if (!success) {
            return NextResponse.json(
                {
                    error: 'TOO_MANY_ATTEMPTS',
                    message: `Too many login attempts. Try again later.`,
                },
                { status: 429 }
            );
        }

        // 1. Resolve email for Supabase Auth
        let emailToAuth = loginId;
        if (!loginId.includes('@')) {
            const existingDbUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: { equals: loginId, mode: 'insensitive' } },
                        { email: { equals: loginId, mode: 'insensitive' } }
                    ]
                }
            });
            if (existingDbUser?.email) {
                emailToAuth = existingDbUser.email;
            }
        }

        // 2. Try Supabase Auth
        let authUser: any = null;
        let supabaseSession: any = null;

        try {
            const { data: authData } = await supabase.auth.signInWithPassword({
                email: emailToAuth,
                password,
            });
            if (authData?.user && authData?.session) {
                authUser = authData.user;
                supabaseSession = authData.session;
            }
        } catch (err) {
            console.warn('Supabase mobile signin attempt error:', err);
        }

        // 3. Fallback for legacy DB bcrypt credentials:
        if (!authUser) {
            const legacyUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: { equals: loginId, mode: 'insensitive' } },
                        { email: { equals: emailToAuth, mode: 'insensitive' } }
                    ]
                }
            });

            if (legacyUser?.passwordHash && await bcrypt.compare(password, legacyUser.passwordHash)) {
                // Auto-provision into Supabase Auth if possible
                try {
                    const { data: signUpData } = await supabase.auth.signUp({
                        email: legacyUser.email || `${legacyUser.username}@aerosysaviation.in`,
                        password,
                        options: {
                            data: {
                                full_name: legacyUser.fullName || legacyUser.username,
                                role: legacyUser.role
                            }
                        }
                    });
                    if (signUpData?.user && !legacyUser.supabaseId) {
                        await prisma.user.update({
                            where: { id: legacyUser.id },
                            data: { supabaseId: signUpData.user.id }
                        });
                    }
                    if (signUpData?.session) {
                        return NextResponse.json({
                            token: signUpData.session.access_token,
                            refreshToken: signUpData.session.refresh_token,
                            user: {
                                id: legacyUser.id,
                                email: legacyUser.email || legacyUser.username,
                                fullName: legacyUser.fullName || legacyUser.username,
                                role: legacyUser.role,
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Supabase auto-signup warning:', e);
                }

                // If Supabase session isn't available immediately (e.g. email confirmation), issue token
                const token = authService.generateJwt(legacyUser as any);
                return NextResponse.json({
                    token,
                    user: {
                        id: legacyUser.id,
                        email: legacyUser.email || legacyUser.username,
                        fullName: legacyUser.fullName || legacyUser.username,
                        role: legacyUser.role,
                    }
                });
            }

            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // 4. Supabase Auth successful - fetch/link Prisma user
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { supabaseId: authUser.id },
                    { email: { equals: authUser.email, mode: 'insensitive' } },
                    { username: { equals: loginId, mode: 'insensitive' } }
                ]
            }
        });

        if (user) {
            if (!user.supabaseId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { supabaseId: authUser.id }
                });
            }
        } else {
            user = await prisma.user.create({
                data: {
                    username: authUser.email?.split('@')[0] || loginId,
                    email: authUser.email,
                    fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || loginId,
                    supabaseId: authUser.id,
                    role: 'SUPER_ADMIN',
                }
            });
        }

        return NextResponse.json({
            token: supabaseSession.access_token,
            refreshToken: supabaseSession.refresh_token,
            user: {
                id: user.id,
                email: user.email || user.username,
                fullName: user.fullName || user.username,
                role: user.role,
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
