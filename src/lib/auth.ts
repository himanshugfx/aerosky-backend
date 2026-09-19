import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const providers: any[] = [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            if (!credentials?.username || !credentials?.password) {
                return null;
            }

            const rawUser = credentials.username.trim();
            const rawPass = credentials.password.trim();

            // 1. Resolve email for Supabase Auth and locate database user
            let emailToAuth = rawUser;
            const dbUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: { equals: rawUser, mode: 'insensitive' } },
                        { email: { equals: rawUser, mode: 'insensitive' } }
                    ]
                }
            });
            if (dbUser?.email) {
                emailToAuth = dbUser.email;
            }

            let authUser: any = null;
            let supabaseSession: any = null;

            // 2. Try Supabase Auth
            try {
                const { data: authData } = await supabase.auth.signInWithPassword({
                    email: emailToAuth,
                    password: rawPass,
                });

                if (authData?.user) {
                    authUser = authData.user;
                    supabaseSession = authData.session;
                }
            } catch (err) {
                console.warn("Supabase Auth error during signIn:", err);
            }

            // 3. Fallback: Local database password verification with bcrypt
            if (!authUser) {
                if (!dbUser) {
                    return null;
                }

                let isPasswordValid = false;
                if (dbUser.passwordHash) {
                    isPasswordValid = await bcrypt.compare(rawPass, dbUser.passwordHash);
                }

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: dbUser.id,
                    name: dbUser.fullName || dbUser.username,
                    email: dbUser.email || dbUser.username,
                    role: dbUser.role,
                    supabaseId: dbUser.supabaseId,
                };
            }

            // 4. Supabase Auth Succeeded: Match or link with Prisma user record
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { supabaseId: authUser.id },
                        { email: { equals: authUser.email, mode: 'insensitive' } },
                        { username: { equals: rawUser, mode: 'insensitive' } }
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
                        username: authUser.email?.split('@')[0] || rawUser,
                        email: authUser.email,
                        fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || rawUser,
                        supabaseId: authUser.id,
                        role: 'SUPER_ADMIN',
                    }
                });
            }

            return {
                id: user.id,
                name: user.fullName || user.username,
                email: user.email || user.username,
                role: user.role,
                supabaseId: authUser.id,
                accessToken: supabaseSession?.access_token,
            };
        }
    })
];

// Add Google OAuth Provider if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

export const authOptions: NextAuthOptions = {
    providers,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }: any) {
            if (account?.provider === "google") {
                const email = user.email || profile?.email;
                if (!email) return false;

                try {
                    // Check if user exists in database
                    let dbUser = await prisma.user.findFirst({
                        where: { email: { equals: email, mode: 'insensitive' } }
                    });

                    if (dbUser) {
                        // Update name if missing
                        if (!dbUser.fullName && user.name) {
                            await prisma.user.update({
                                where: { id: dbUser.id },
                                data: { fullName: user.name }
                            });
                        }
                    } else {
                        // Check if a team member exists with this email
                        const teamMember = await prisma.teamMember.findFirst({
                            where: { email: { equals: email, mode: 'insensitive' } }
                        });

                        // If database is empty or email belongs to the primary admin, grant SUPER_ADMIN
                        const totalUsers = await prisma.user.count();
                        const isPrimaryAdmin = totalUsers === 0 || email.toLowerCase().includes('himanshu') || email.toLowerCase().includes('admin');
                        const assignedRole = isPrimaryAdmin ? 'SUPER_ADMIN' : (teamMember ? 'SOFTWARE' : 'VIEWER');

                        // Create new User record in database
                        let username = email.split('@')[0];
                        const existingWithUsername = await prisma.user.findUnique({ where: { username } });
                        if (existingWithUsername) {
                            username = `${username}-${Math.random().toString(36).substring(2, 6)}`;
                        }

                        dbUser = await prisma.user.create({
                            data: {
                                username,
                                email,
                                fullName: user.name || teamMember?.name || username,
                                role: assignedRole,
                                teamMemberId: teamMember ? teamMember.id : undefined,
                                isActive: true,
                            }
                        });
                    }

                    // Attach DB fields to user object for downstream callbacks
                    user.id = dbUser.id;
                    user.role = dbUser.role;
                    user.name = dbUser.fullName || dbUser.username;
                    return true;
                } catch (error) {
                    console.error("Error linking Google user account:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.supabaseId = user.supabaseId;
                token.accessToken = user.accessToken;
            }
            // If signing in via Google, ensure we attach database user ID and role
            if (account?.provider === "google" && (!token.role || !token.id)) {
                const dbUser = await prisma.user.findFirst({
                    where: { email: { equals: token.email, mode: 'insensitive' } }
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.supabaseId = token.supabaseId;
                (session as any).accessToken = token.accessToken;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
