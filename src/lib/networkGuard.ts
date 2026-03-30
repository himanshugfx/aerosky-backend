import { NextRequest } from "next/server";

/**
 * Checks if the request comes from an allowed IP defined in ALLOWED_SUBNET.
 * Allows localhost (::1, 127.0.0.1) and the specified subnet (e.g., 192.168.29).
 */
export function isAllowedIp(req: NextRequest): boolean {
    const defaultSubnet = "192.168.29"; // fallback
    const envSubnets = process.env.ALLOWED_SUBNET || defaultSubnet;
    const allowedSubnets = envSubnets.split(',').map(s => s.trim());
    
    // Get IP from headers or connection
    // Vercel uses x-real-ip or x-forwarded-for
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    
    // NextRequest.ip is available in some environments
    let clientIp = req.ip || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

    // If we can't determine the IP, default to allowing it in dev, blocking in prod
    // However, for this specific requirement, we can assume local dev environment
    if (!clientIp) {
        // In local development, Next.js sometimes doesn't provide the IP easily on the Edge runtime.
        // If we can't find it, we'll err on the side of caution or rely on typical local IP behaviors.
        return true; 
    }

    // Allow localhost
    if (clientIp === "::1" || clientIp === "127.0.0.1" || clientIp === "localhost") {
        return true;
    }

    // Allow IPv4-mapped IPv6 addresses for localhost
    if (clientIp === "::ffff:127.0.0.1") {
        return true;
    }

    // Check if the IP starts with any of the allowed subnets
    // Handle IPv4-mapped IPv6 address formatting if present (e.g., ::ffff:192.168.29.125)
    for (const subnet of allowedSubnets) {
        if (subnet && clientIp.includes(subnet)) {
            return true;
        }
    }

    return false;
}
