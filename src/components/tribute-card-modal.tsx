"use client";

import { useEffect, useRef, useState } from "react";
import { NOTICE_TOAST_AUTO_DISMISS_MS } from "@/components/notice-toast";

type TributeCardModalProps = {
  recipientEmail?: string;
  tributeSlug: string;
  tributeName: string;
  storeConfigured: boolean;
};

const CARD_TYPE_OPTIONS = [
  { value: "condolence", label: "Condolence Card" },
  { value: "memory", label: "Memory Card" },
  { value: "prayer", label: "Prayer Card" },
  { value: "support", label: "Support Card" },
] as const;

export function TributeCardModal({
  recipientEmail,
  tributeSlug,
  tributeName,
  storeConfigured,
}: TributeCardModalProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [isOpen, setIsOpen] = useState(false);
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
      setToast({ message: "Tribute card storage is not configured yet.", tone: "error" });
      return;
    }

    if (!recipientEmail) {
      setToast({ message: "Family contact email is not configured yet.", tone: "error" });
      return;
    }

    setPending(true);

    const cardType = String(formData.get("cardType") ?? "condolence");
    const cardTypeLabel =
      CARD_TYPE_OPTIONS.find((option) => option.value === cardType)?.label ?? "Tribute Card";
    const cardMessage = String(formData.get("message") ?? "").trim();

    const payload = {
      tributeSlug,
      recipientEmail,
      senderName: String(formData.get("name") ?? ""),
      senderEmail: String(formData.get("email") ?? ""),
      message: `[${cardTypeLabel}]

${cardMessage}`,
      website: String(formData.get("website") ?? ""),
      turnstileToken,
    };

    if (turnstileSiteKey && !payload.turnstileToken.trim()) {
      setToast({
        message: "Please complete bot verification before sending your card.",
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
      setToast({ message: data.error ?? "Unable to send tribute card.", tone: "error" });
      setPending(false);
      return;
    }

    setToast({
      message:
        data.message ??
        "Confirmation email sent. Until you confirm your email, your card will not be seen by the family.",
      tone: "success",
    });
    setPending(false);
    setIsOpen(false);
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
        Card
      </button>

      {isOpen ? (
        <div className="message-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="message-modal-card form-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Tribute Card</p>
                <h3>Send a Tribute Card</h3>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close tribute card form"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="form-modal-body"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(new FormData(event.currentTarget));
              }}
            >
              <p className="subtle-note">
                Send a featured card message for {tributeName}. You must confirm your
                email first; until confirmation, your card will not be seen by the family.
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
                <span>Card type</span>
                <select name="cardType" defaultValue="condolence">
                  {CARD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Your card message</span>
                <textarea
                  name="message"
                  placeholder="Write a tribute card message for the family"
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
                  <span>Bot Verification</span>
                  <div ref={turnstileContainerRef} className="cf-turnstile" data-sitekey={turnstileSiteKey} />
                </div>
              ) : null}

              <button className="button-primary" type="submit" disabled={pending}>
                {pending ? "Sending..." : "Send Card"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
