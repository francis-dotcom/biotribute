"use client";

import { useEffect, useState } from "react";

type NoticeToastProps = {
  message?: string;
  tone?: "success" | "error";
};

export function NoticeToast({ message, tone = "success" }: NoticeToastProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const isOpen = Boolean(message) && message !== dismissedMessage;

  useEffect(() => {
    if (!message || !isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedMessage(message);
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, message]);

  if (!message || !isOpen) {
    return null;
  }

  return (
    <div
      className={`notice-toast${tone === "error" ? " is-error" : ""}`}
      role="status"
      aria-live="polite"
    >
      <p>{message}</p>
      <button
        className="notice-toast-close"
        type="button"
        onClick={() => setDismissedMessage(message)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
