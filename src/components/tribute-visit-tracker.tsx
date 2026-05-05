"use client";

import { useEffect } from "react";

type TributeVisitTrackerProps = {
  tributeSlug: string;
};

export function TributeVisitTracker({ tributeSlug }: TributeVisitTrackerProps) {
  useEffect(() => {
    const storageKey = `biotribute-visit:${tributeSlug}:${window.location.pathname}`;
    const now = Date.now();
    const lastTrackedAt = Number(window.sessionStorage.getItem(storageKey) ?? "0");

    if (Number.isFinite(lastTrackedAt) && now - lastTrackedAt < 15_000) {
      return;
    }

    window.sessionStorage.setItem(storageKey, String(now));

    const payload = JSON.stringify({
      tributeSlug,
      path: window.location.pathname,
    });

    if (navigator.sendBeacon) {
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
  }, [tributeSlug]);

  return null;
}
