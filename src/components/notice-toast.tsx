"use client";

import { useEffect, useState } from "react";

/** Shared auto-dismiss duration for all `notice-toast` usage across the app. */
export const NOTICE_TOAST_AUTO_DISMISS_MS = 7000;

type NoticeToastProps = {
  message?: string;
  tone?: "success" | "error";
};

function normalizeToastMessage(message?: string) {
  const value = message?.trim();
  if (!value) {
    return "";
  }

  if (value.length % 2 === 0) {
    const midpoint = value.length / 2;
    const left = value.slice(0, midpoint).trim();
    const right = value.slice(midpoint).trim();

    if (left && left === right) {
      return left;
    }
  }

  return value;
}

export function NoticeToast({ message, tone = "success" }: NoticeToastProps) {
  const normalizedMessage = normalizeToastMessage(message);
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const isOpen = Boolean(normalizedMessage) && normalizedMessage !== dismissedMessage;

  useEffect(() => {
    if (!normalizedMessage || !isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedMessage(normalizedMessage);
    }, NOTICE_TOAST_AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, normalizedMessage]);

  if (!normalizedMessage || !isOpen) {
    return null;
  }

  return (
    <div
      className={`notice-toast${tone === "error" ? " is-error" : ""}`}
      role="status"
      aria-live="polite"
    >
      <p>{normalizedMessage}</p>
      <button
        className="notice-toast-close"
        type="button"
        onClick={() => setDismissedMessage(normalizedMessage)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
