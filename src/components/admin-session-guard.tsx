"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 30 * 1000;
const REFRESH_THROTTLE_MS = 60 * 1000;

export function AdminSessionGuard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastActivityRef = useRef<number>(0);
  const lastRefreshRef = useRef<number>(0);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    lastActivityRef.current = Date.now();

    function getNextPath() {
      const query = searchParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    }

    function redirectToLogin() {
      if (isLoggingOutRef.current) {
        return;
      }
      isLoggingOutRef.current = true;
      const nextPath = getNextPath();
      window.location.assign(`/console-login?next=${encodeURIComponent(nextPath)}&force=1`);
    }

    async function refreshSession() {
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) {
        return;
      }
      lastRefreshRef.current = now;

      try {
        const response = await fetch("/api/admin/session/refresh", {
          method: "POST",
          credentials: "same-origin",
          keepalive: true,
        });
        if (response.status === 401 || response.status === 403) {
          redirectToLogin();
        }
      } catch {
        // Ignore transient network errors and retry on next activity tick.
      }
    }

    function markActivity() {
      lastActivityRef.current = Date.now();
      void refreshSession();
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    const visibilityListener = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };
    document.addEventListener("visibilitychange", visibilityListener);

    // Refresh once on mount so active sessions start with a fresh 20-minute window.
    void refreshSession();

    const checkInterval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        redirectToLogin();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(checkInterval);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }
      document.removeEventListener("visibilitychange", visibilityListener);
    };
  }, [pathname, searchParams]);

  return null;
}
