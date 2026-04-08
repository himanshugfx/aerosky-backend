import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { isAllowedIp } from "@/lib/networkGuard";

// CORS allowed origins by environment
const ALLOWED_ORIGINS = {
  development: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.29.125:3000'],
  production: [
    'https://app.aerosysaviation.in',
    'https://mobile.aerosysaviation.in',
    'https://dashboard.aerosysaviation.in',
  ],
};

function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV || 'development';
  return ALLOWED_ORIGINS[env as keyof typeof ALLOWED_ORIGINS] || ALLOWED_ORIGINS.development;
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

// 1. Wrap your NextAuth logic
const authMiddleware = withAuth(
    function middleware(req: NextRequestWithAuth) {
        // Auth Check - Skip for mobile auth routes and other public APIs
        const publicPaths = ["/api/mobile/auth", "/api/auth", "/unauthorized", "/login", "/register", "/forgot-password"];
        const isPublicPath = publicPaths.some(path => 
            req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
        );
        
        if (isPublicPath) {
            return NextResponse.next();
        }

        const token = req.nextauth?.token;
        const isAuth = !!token;

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }: { token: any, req: NextRequest }) => {
                const publicPaths = ["/api/mobile/auth", "/api/auth", "/unauthorized", "/login", "/register", "/forgot-password"];
                const isPublicPath = publicPaths.some(path => 
                    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
                );
                if (isPublicPath) return true;
                return !!token;
            },
        },
    }
);

// 2. Export a top-level middleware properly intercepting the request first
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
    // Top-Level IP Filtering Check
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = req.ip || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 'unknown';
    
    // Only redirect to unauthorized if they aren't already on the unauthorized page
    const isUnauthorizedPage = req.nextUrl.pathname === "/unauthorized" || req.nextUrl.pathname.startsWith("/unauthorized/");

    if (!isAllowedIp(req) && !isUnauthorizedPage) {
        if (req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Access Denied: Your IP is not authorized." },
                { status: 403 }
            );
        }
        // Redirect web pages to unauthorized
        const unauthorizedUrl = new URL(req.nextUrl.origin + "/unauthorized");
        unauthorizedUrl.searchParams.set("ip", clientIp);
        return NextResponse.redirect(unauthorizedUrl);
    }

    // CORS Origin Validation for API routes
    if (req.nextUrl.pathname.startsWith("/api/")) {
        const origin = req.headers.get("origin");
        
        // For OPTIONS requests (preflight), validate and respond
        if (req.method === "OPTIONS") {
            if (origin && isOriginAllowed(origin)) {
                return new NextResponse(null, {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                        'Access-Control-Max-Age': '86400',
                        'Access-Control-Allow-Credentials': 'true',
                    },
                });
            } else if (!origin) {
                // Allow requests without origin (e.g., mobile apps, server-to-server)
                return new NextResponse(null, {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                        'Access-Control-Max-Age': '86400',
                    },
                });
            } else {
                // Origin not allowed
                return NextResponse.json(
                    { error: "CORS policy violation" },
                    { status: 403 }
                );
            }
        }
    }

    // 3. Delegate to the NextAuth middleware
    // We cast req as any here because NextAuth types expect NextRequestWithAuth which is tricky to instantiate directly
    return authMiddleware(req as any, event);
}

export const config = {
    // Applied to login, register, reset links, and unauthorized as well to guarantee global coverage
    matcher: ["/dashboard/:path*", "/api/:path*", "/login", "/register", "/unauthorized"],
};

