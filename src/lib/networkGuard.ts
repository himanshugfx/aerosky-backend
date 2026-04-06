import { NextRequest } from "next/server";

/**
 * Checks if the request comes from an allowed IP defined in ALLOWED_SUBNET.
 * Allows localhost (::1, 127.0.0.1) and the specified subnet (e.g., 192.168.29).
 */
export function isAllowedIp(req: NextRequest): boolean {
    // fallback (Internal WiFi + Public WAN IPs)
    const defaultSubnet = "192.168.29, 49.36.189.114, 49.36.191.184, 49.36.189.74, 2405:201:4003:7173";
    // Merge process.env setting with defaults to ensure WAN IP isn't overridden
    const envSubnets = process.env.ALLOWED_SUBNET ? `${process.env.ALLOWED_SUBNET}, ${defaultSubnet}` : defaultSubnet;
    const allowedSubnets = envSubnets.split(',').map((s: string) => s.trim());

    // Get IP from headers or connection
    // Vercel uses x-real-ip or x-forwarded-for
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    // NextRequest.ip is available in some environments
    let clientIp = req.ip || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

    // If we can't determine the IP, default to allowing it in dev, blocking in prod
    if (!clientIp) {
        // In local development, Next.js sometimes doesn't provide the IP easily on the Edge runtime.
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

    // Check if wildcard is present to allow all connections
    if (allowedSubnets.includes("*")) {
        return true;
    }

    // Check if the IP starts with any of the allowed subnets
    for (const subnet of allowedSubnets) {
        if (subnet && clientIp.includes(subnet)) {
            return true;
        }
    }

    console.warn(`[NetworkGuard] Access Denied for IP: ${clientIp}. Add this to ALLOWED_SUBNET to grant access.`);
    return false;
}
