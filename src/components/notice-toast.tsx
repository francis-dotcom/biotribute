"use client";

import { useEffect, useState } from "react";

type NoticeToastProps = {
  message?: string;
  tone?: "success" | "error";
};

export function NoticeToast({ message, tone = "success" }: NoticeToastProps) {
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOpen(false);
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  if (!message || !open) {
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
        onClick={() => setOpen(false)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
