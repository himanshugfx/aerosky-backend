import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
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

                // 1. Resolve email for Supabase Auth
                let emailToAuth = rawUser;
                if (!rawUser.includes('@')) {
                    const existingDbUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: { equals: rawUser, mode: 'insensitive' } },
                                { email: { equals: rawUser, mode: 'insensitive' } }
                            ]
                        }
                    });
                    if (existingDbUser?.email) {
                        emailToAuth = existingDbUser.email;
                    }
                }

                let authUser: any = null;
                let supabaseSession: any = null;

                // 2. Authenticate against Supabase Auth
                try {
                    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email: emailToAuth,
                        password: rawPass,
                    });

                    if (authData?.user) {
                        authUser = authData.user;
                        supabaseSession = authData.session;
                    }
                } catch (err) {
                    console.error("Supabase Auth error during signIn:", err);
                }

                // 3. Backward compatibility / seamless migration fallback:
                // If Supabase Auth failed, check legacy Prisma bcrypt password
                if (!authUser) {
                    const dbUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: { equals: rawUser, mode: 'insensitive' } },
                                { email: { equals: emailToAuth, mode: 'insensitive' } }
                            ]
                        }
                    });

                    if (dbUser?.passwordHash && await bcrypt.compare(rawPass, dbUser.passwordHash)) {
                        // Seamlessly try to provision user in Supabase Auth
                        try {
                            const { data: signUpData } = await supabase.auth.signUp({
                                email: dbUser.email || `${dbUser.username}@aerosysaviation.in`,
                                password: rawPass,
                                options: {
                                    data: {
                                        full_name: dbUser.fullName || dbUser.username,
                                        role: dbUser.role
                                    }
                                }
                            });
                            if (signUpData?.user && !dbUser.supabaseId) {
                                await prisma.user.update({
                                    where: { id: dbUser.id },
                                    data: { supabaseId: signUpData.user.id }
                                });
                            }
                        } catch (e) {
                            console.warn("Supabase auto-provisioning notice:", e);
                        }

                        return {
                            id: dbUser.id,
                            name: dbUser.fullName || dbUser.username,
                            email: dbUser.email || dbUser.username,
                            role: dbUser.role,
                        };
                    }

                    return null;
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
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.supabaseId = user.supabaseId;
                token.accessToken = user.accessToken;
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
