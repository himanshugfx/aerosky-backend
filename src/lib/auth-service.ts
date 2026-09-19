import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { signToken, verifyToken as verifyTokenUtil } from '@/lib/jwt';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: Role;
}

export class AuthService {
  // Authenticate with credentials via Supabase Auth (with DB bcrypt fallback)
  async authenticateWithCredentials(
    username: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    const rawUser = username.trim();
    let emailToAuth = rawUser;

    if (!rawUser.includes('@')) {
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
    }

    // 1. Try Supabase Auth
    try {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password,
      });

      if (authData?.user) {
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseId: authData.user.id },
              { email: { equals: authData.user.email, mode: 'insensitive' } },
              { username: { equals: rawUser, mode: 'insensitive' } }
            ]
          }
        });

        if (user) {
          if (!user.supabaseId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { supabaseId: authData.user.id }
            });
          }
          return {
            id: user.id,
            username: user.username,
            fullName: user.fullName || undefined,
            email: user.email || undefined,
            role: user.role,
          };
        }
      }
    } catch (err) {
      console.warn('AuthService Supabase Auth error:', err);
    }

    // Credentials failed Supabase Auth
    return null;
  }

  // Authenticate with token (Supabase JWT, legacy JWT, or session)
  async authenticateWithToken(
    token: string,
    isJwt: boolean = false
  ): Promise<AuthenticatedUser | null> {
    if (isJwt) {
      return this.verifyJwt(token);
    } else {
      return this.verifySessionToken(token);
    }
  }

  // JWT helpers
  private async verifyJwt(token: string): Promise<AuthenticatedUser | null> {
    try {
      // 1. Try Supabase token
      const { data: sbData } = await supabase.auth.getUser(token);
      if (sbData?.user) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseId: sbData.user.id },
              { email: { equals: sbData.user.email, mode: 'insensitive' } }
            ]
          }
        });
        if (user) {
          return {
            id: user.id,
            username: user.username,
            fullName: user.fullName || undefined,
            email: user.email || undefined,
            role: user.role,
          };
        }
      }

      // 2. Legacy JWT
      const decoded = verifyTokenUtil(token) as any;
      if (!decoded) return null;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id || decoded.userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
        },
      });
      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName || undefined,
        email: user.email || undefined,
        role: user.role,
      };
    } catch (error) {
      return null;
    }
  }

  private async verifySessionToken(token: string): Promise<AuthenticatedUser | null> {
    return null;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Generate JWT token
  generateJwt(user: AuthenticatedUser): string {
    return signToken({
      userId: user.id,
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    } as any);
  }
}

export const authService = new AuthService();