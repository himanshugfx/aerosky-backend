import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

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
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        if (isAdminPage && !isAuth) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

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
    // 3. Delegate to the NextAuth middleware
    // We cast req as any here because NextAuth types expect NextRequestWithAuth which is tricky to instantiate directly
    return authMiddleware(req as any, event);
}

export const config = {
    // Applied to login, register, reset links, and unauthorized as well to guarantee global coverage
    matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*", "/login", "/register", "/unauthorized"],
};
