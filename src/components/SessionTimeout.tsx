"use client";

import { useEffect, useCallback, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/store";

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes (600,000 ms)

export function SessionTimeout() {
    const { data: session } = useSession();
    const { isAuthenticated, logout } = useAuthStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(() => {
        // Handle NextAuth
        if (session) {
            signOut({ callbackUrl: "/login" });
        }
        // Handle Custom Store (Dashboard)
        if (isAuthenticated) {
            logout();
            window.location.href = "/login";
        }
    }, [session, isAuthenticated, logout]);

    const lastResetRef = useRef<number>(Date.now());

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (session || isAuthenticated) {
            timeoutRef.current = setTimeout(handleLogout, TIMEOUT_DURATION);
        }
        lastResetRef.current = Date.now();
    }, [handleLogout, session, isAuthenticated]);

    const handleActivity = useCallback(() => {
        // Throttle resets to at most once every 15 seconds
        if (Date.now() - lastResetRef.current > 15000) {
            resetTimer();
        }
    }, [resetTimer]);

    useEffect(() => {
        if (!session && !isAuthenticated) return;

        // Set initial timer
        resetTimer();

        // Events to track user activity
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click",
        ];

        // Add event listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [session, isAuthenticated, resetTimer, handleActivity]);

    return null;
}

