"use client";

import { useEffect } from "react";

type TributeVisitTrackerProps = {
  tributeSlug: string;
};

export function TributeVisitTracker({ tributeSlug }: TributeVisitTrackerProps) {
  useEffect(() => {
    const sessionStorageKey = `biotribute-visit-session:${tributeSlug}`;
    const sessionId =
      window.sessionStorage.getItem(sessionStorageKey) ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.sessionStorage.setItem(sessionStorageKey, sessionId);

    function sendVisitEvent(eventType: "enter" | "heartbeat" | "leave", useBeacon = false) {
      const payload = JSON.stringify({
        tributeSlug,
        sessionId,
        path: window.location.pathname,
        eventType,
      });

      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/visits", new Blob([payload], { type: "application/json" }));
        return;
      }

      void fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      });
    }

    sendVisitEvent("enter");

    const heartbeatInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendVisitEvent("heartbeat");
      }
    }, 20000);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendVisitEvent("leave", true);
        return;
      }

      sendVisitEvent("heartbeat");
    }

    function handlePageHide() {
      sendVisitEvent("leave", true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      sendVisitEvent("leave", true);
    };
  }, [tributeSlug]);

  return null;
}
