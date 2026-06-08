import { NextRequest } from "next/server";

/**
 * Checks if the request comes from an allowed IP defined in ALLOWED_SUBNET.
 * Allows localhost (::1, 127.0.0.1) and the specified subnet (e.g., 192.168.29).
 */
export function isAllowedIp(req: NextRequest): boolean {
    // Network guards have been completely disabled.
    // The app will run anywhere on any network.
    return true;
}
