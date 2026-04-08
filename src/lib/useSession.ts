"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Decode a JWT payload without external libraries. */
function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const WARNING_BEFORE_MS = 2 * 60 * 1000; // show warning 2 min before expiry

/**
 * Session management hook.
 * - Reads JWT from localStorage, extracts `exp` claim
 * - Shows a warning toast 2 minutes before expiry
 * - Auto-logouts and redirects to /login when token expires
 * - Cleans up timers on unmount
 */
export function useSession() {
  const router = useRouter();
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasWarned = useRef(false);

  const logout = useCallback(
    (reason: string) => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      toast.error(reason, { duration: 5000 });
      router.push("/login");
    },
    [router],
  );

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return; // can't determine expiry

    const expiresAt = payload.exp * 1000; // seconds → ms
    const now = Date.now();
    const msUntilExpiry = expiresAt - now;

    // Already expired
    if (msUntilExpiry <= 0) {
      logout("Your session has expired. Please log in again.");
      return;
    }

    // Warning timer (2 min before expiry)
    const msUntilWarning = msUntilExpiry - WARNING_BEFORE_MS;
    if (msUntilWarning > 0) {
      warningTimer.current = setTimeout(() => {
        if (!hasWarned.current) {
          hasWarned.current = true;
          toast.warning("Your session will expire in 2 minutes. Please save your work.", {
            duration: 10000,
          });
        }
      }, msUntilWarning);
    }

    // Auto-logout timer
    logoutTimer.current = setTimeout(() => {
      logout("Your session has expired. Please log in again.");
    }, msUntilExpiry);

    return () => {
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [router, logout]);
}
