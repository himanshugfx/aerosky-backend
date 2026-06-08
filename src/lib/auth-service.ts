import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, verifyToken as verifyTokenUtil } from '@/lib/jwt';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: Role;
  organizationId?: string;
}

export class AuthService {
  // Authenticate with credentials
  async authenticateWithCredentials(
    username: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        organizationId: true,
        passwordHash: true,
      },
    });

    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return null;

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName || undefined,
      email: user.email || undefined,
      role: user.role,
      organizationId: user.organizationId || undefined,
    };
  }

  // Authenticate with token (JWT or session)
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
          organizationId: true,
        },
      });
      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName || undefined,
        email: user.email || undefined,
        role: user.role,
        organizationId: user.organizationId || undefined,
      };
    } catch (error) {
      return null;
    }
  }

  private async verifySessionToken(token: string): Promise<AuthenticatedUser | null> {
    // Implementation for session verification
    // Could use NextAuth session verification
    return null;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Generate JWT token
  generateJwt(user: AuthenticatedUser): string {
    return signToken({
      userId: user.id, // Using userId for consistency with jwt.ts
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
    } as any);
  }
}

export const authService = new AuthService();