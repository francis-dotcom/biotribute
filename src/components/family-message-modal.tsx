"use client";

import { useEffect, useRef, useState } from "react";
import { NOTICE_TOAST_AUTO_DISMISS_MS } from "@/components/notice-toast";
import {
  turnstileGreenVerifiedNotice,
  turnstileGreenWaitingNotice,
  turnstileNotReadyYetMessage,
  turnstileSubmitWaitingLabel,
} from "@/lib/turnstile-user-copy";

type FamilyMessageModalProps = {
  recipientEmail?: string;
  tributeSlug: string;
  tributeName: string;
  organizer: string;
  storeConfigured: boolean;
};

export function FamilyMessageModal({
  recipientEmail,
  tributeSlug,
  tributeName,
  organizer,
  storeConfigured,
}: FamilyMessageModalProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), NOTICE_TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isOpen || !turnstileSiteKey) {
      return;
    }

    let pollingTimer: number | null = null;
    const renderTurnstile = () => {
      const turnstile = (window as unknown as { turnstile?: {
        render: (
          container: HTMLElement,
          options: {
            sitekey: string;
            appearance?: "always" | "execute" | "interaction-only";
            size?: "normal" | "compact" | "flexible";
            theme?: "light" | "dark" | "auto";
            callback?: (token: string) => void;
            "expired-callback"?: () => void;
            "error-callback"?: () => void;
          },
        ) => string;
        reset: (widgetId: string) => void;
      } }).turnstile;

      if (!turnstile || !turnstileContainerRef.current) {
        return false;
      }

      setTurnstileToken("");
      if (turnstileWidgetIdRef.current) {
        turnstile.reset(turnstileWidgetIdRef.current);
        return true;
      }

      turnstileWidgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        appearance: "always",
        size: "normal",
        theme: "auto",
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });

      return true;
    };

    if (!renderTurnstile()) {
      pollingTimer = window.setInterval(() => {
        if (renderTurnstile() && pollingTimer) {
          window.clearInterval(pollingTimer);
          pollingTimer = null;
        }
      }, 250);
    }

    return () => {
      if (pollingTimer) {
        window.clearInterval(pollingTimer);
      }
    };
  }, [isOpen, turnstileSiteKey]);

  async function handleSubmit(formData: FormData) {
    if (!storeConfigured) {
      setToast({ message: "Private family message storage is not configured yet.", tone: "error" });
      return;
    }

    if (!recipientEmail) {
      setToast({ message: "Family contact email is not configured yet.", tone: "error" });
      return;
    }

    setPending(true);
    setStatus(null);

    const payload = {
      tributeSlug,
      recipientEmail,
      senderName: String(formData.get("name") ?? ""),
      senderEmail: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
      turnstileToken,
    };

    if (turnstileSiteKey && !payload.turnstileToken.trim()) {
      setToast({
        message: turnstileNotReadyYetMessage,
        tone: "error",
      });
      setPending(false);
      return;
    }

    const response = await fetch("/api/family-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setToast({ message: data.error ?? "Unable to send private family message.", tone: "error" });
      setPending(false);
      return;
    }

    setToast({
      message:
        data.message ??
        "Confirmation email sent. Until you confirm your email, your message will not be seen by the family.",
      tone: "success",
    });
    setPending(false);
    setIsOpen(false);
    setStatus(null);
  }

  return (
    <>
      {toast ? (
        <div
          className={`notice-toast ${toast.tone === "error" ? "is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          <p>{toast.message}</p>
          <button
            className="notice-toast-close"
            type="button"
            aria-label="Dismiss message"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      ) : null}

      <button className="support-action-pill" type="button" onClick={() => setIsOpen(true)}>
        Message
      </button>

      {isOpen ? (
        <div className="message-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="message-modal-card form-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Private Family Message</p>
                <h3>Send a Message</h3>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close family message form"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="form-modal-body"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit(new FormData(event.currentTarget));
              }}
            >
              <p className="subtle-note">
                Send a private note directly to the family representative for {tributeName}.
                You must confirm your email first; until confirmation, your message will
                not be seen by the family.
              </p>

              <label className="field-block">
                <span>Your name</span>
                <input name="name" type="text" placeholder="Enter your name" required />
              </label>

              <label className="field-block">
                <span>Your email</span>
                <input name="email" type="email" placeholder="Enter your email" required />
              </label>

              <label className="field-block">
                <span>Your message</span>
                <textarea
                  name="message"
                  placeholder="Write your private message to the family"
                  required
                  minLength={12}
                />
              </label>

              <label className="field-block field-honeypot" aria-hidden="true">
                <span>Website</span>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>

              {turnstileSiteKey ? (
                <div className="field-block">
                  <span>Bot verification</span>
                  <div
                    ref={turnstileContainerRef}
                    className="turnstile-mount"
                    aria-label="Cloudflare verification"
                  />
                  {!turnstileToken.trim() ? (
                    <p className="form-status-inline is-waiting" role="status">
                      {turnstileGreenWaitingNotice}
                    </p>
                  ) : (
                    <p className="form-status-inline is-success" role="status">
                      {turnstileGreenVerifiedNotice}
                    </p>
                  )}
                </div>
              ) : null}

              <button
                className="button-primary"
                type="submit"
                disabled={pending || (Boolean(turnstileSiteKey) && !turnstileToken.trim())}
              >
                {pending
                  ? "Sending..."
                  : turnstileSiteKey && !turnstileToken.trim()
                    ? turnstileSubmitWaitingLabel
                    : "Send Message"}
              </button>

              {status ? <p className="form-status">{status}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
