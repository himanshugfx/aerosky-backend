import { authOptions } from "@/lib/auth";
import { getTokenFromHeader, verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest } from 'next/server';

// Type for authenticated user with role
export interface AuthenticatedUser {
    id: string;
    username: string;
    email?: string;
    role: Role;
    organizationId?: string;
}

export interface AuthResult {
    user: AuthenticatedUser;
    type: 'session' | 'jwt';
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult | null> {
    try {
        // 1. Try session first (web)
        const session = await getServerSession(authOptions);
        if (session?.user) {
            // Try to find user by id (stored in token), then by email, then by name
            let user = null;

            // First try by id if available in session
            if ((session.user as any).id) {
                user = await prisma.user.findUnique({
                    where: { id: (session.user as any).id },
                    select: { id: true, username: true, email: true, role: true, organizationId: true }
                });
            }

            // Fallback to email
            if (!user && session.user.email) {
                user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true, username: true, email: true, role: true, organizationId: true }
                });
            }

            // Fallback to username (name field)
            if (!user && session.user.name) {
                user = await prisma.user.findUnique({
                    where: { username: session.user.name },
                    select: { id: true, username: true, email: true, role: true, organizationId: true }
                });
            }

            if (user) {
                return {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email || undefined,
                        role: user.role,
                        organizationId: user.organizationId || undefined,
                    },
                    type: 'session'
                };
            }
        }

        // 2. Try JWT (mobile)
        const authHeader = request.headers.get('Authorization');
        const token = getTokenFromHeader(authHeader);

        if (token) {
            const decoded = verifyToken(token) as { userId?: string; id?: string; username?: string; sub?: string } | null;
            // console.log('JWT decoded payload:', decoded); // Removed as per instruction

            if (decoded) {
                const userId = decoded.userId || decoded.id || decoded.sub;

                let user = null;
            if (userId) {
                    console.log('JWT decoded userId:', userId);
                    user = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { id: true, username: true, email: true, role: true, organizationId: true }
                    });
                }

                if (!user && decoded.username) {
                    console.log('Finding user by username:', decoded.username);
                    user = await prisma.user.findUnique({
                        where: { username: decoded.username },
                        select: { id: true, username: true, email: true, role: true, organizationId: true }
                    });
                }

                if (user) {
                    console.log('Authenticated user:', user.username, 'Role:', user.role);
                    return {
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email || undefined,
                            role: user.role,
                            organizationId: user.organizationId || undefined,
                        },
                        type: 'jwt'
                    };
                } else {
                    console.log('No user found for decoded token:', userId || decoded.username);
                }
            } else {
                console.log('JWT decode failed');
            }
        }

        console.log('Authentication failed: No valid session or JWT');
    } catch (error) {
        console.error('Authentication error:', error);
    }

    return null;
}
