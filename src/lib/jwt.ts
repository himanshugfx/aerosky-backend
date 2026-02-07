// JWT utilities for mobile authentication
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface JWTPayload {
    userId: string;
    username: string;
    role: string;
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}
