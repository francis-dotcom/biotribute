"use client";

import { useEffect, useRef, useState } from "react";
import { NOTICE_TOAST_AUTO_DISMISS_MS } from "@/components/notice-toast";
import {
  turnstileGreenVerifiedNotice,
  turnstileGreenWaitingNotice,
  turnstileNotReadyYetMessage,
  turnstileSubmitWaitingLabel,
} from "@/lib/turnstile-user-copy";

type MessageFormProps = {
  tributeSlug: string;
  storeConfigured: boolean;
};

type MessageFormField = "author" | "email" | "message";

export function MessageForm({ tributeSlug, storeConfigured }: MessageFormProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [placement, setPlacement] = useState<"feed" | "timeline">("feed");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<MessageFormField, string>>>({});
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
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
    function openFromActionBar() {
      setOpen(true);
    }

    window.addEventListener("biotribute:open-message-form", openFromActionBar);
    return () => window.removeEventListener("biotribute:open-message-form", openFromActionBar);
  }, []);

  useEffect(() => {
    if (!open || !turnstileSiteKey) {
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
  }, [open, turnstileSiteKey]);

  function showToast(message: string, tone: "success" | "error") {
    setToast({ message, tone });
  }

  function focusFirstInvalidField(errors: Partial<Record<MessageFormField, string>>) {
    const form = document.getElementById("tribute-message-form");
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const fieldOrder: MessageFormField[] = ["author", "email", "message"];
    const firstInvalidField = fieldOrder.find((field) => Boolean(errors[field]));
    if (!firstInvalidField) {
      return;
    }

    const selector = `[name="${firstInvalidField}"]`;
    const target = form.querySelector(selector);
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function handleSubmit(formData: FormData) {
    if (!storeConfigured) {
      const message = "Posting is not configured yet. Add Supabase env vars before launch.";
      showToast(message, "error");
      setOpen(true);
      return;
    }

    setPending(true);
    setFieldErrors({});

    const payload = {
      tributeSlug,
      author: String(formData.get("author") ?? ""),
      email: String(formData.get("email") ?? ""),
      placement,
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
      turnstileToken,
    };

    if (turnstileSiteKey && !payload.turnstileToken.trim()) {
      showToast(turnstileNotReadyYetMessage, "error");
      setPending(false);
      return;
    }

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      fieldErrors?: Partial<Record<MessageFormField, string>>;
    };

    if (!response.ok) {
      if (data.fieldErrors) {
        setFieldErrors(data.fieldErrors);
        window.setTimeout(() => focusFirstInvalidField(data.fieldErrors ?? {}), 0);
      }
      const message = data.error ?? "Unable to submit message.";
      showToast(message, "error");
      setPending(false);
      return;
    }

    const successMessage =
      data.message ??
        "Message submitted. Please verify your email from your inbox before your message can be reviewed and shown."
    showToast(successMessage, "success");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`biotribute-message-prompt-submitted-${tributeSlug}`, "true");
      window.dispatchEvent(
        new CustomEvent("biotribute:message-submitted", {
          detail: { tributeSlug },
        }),
      );
    }
    setPending(false);
    setOpen(true);
    setFieldErrors({});

    const form = document.getElementById("tribute-message-form") as HTMLFormElement | null;
    form?.reset();
    setPlacement("feed");
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

      <div className="message-trigger-card">
        <p className="card-label">Guestbook</p>
        <p className="subtle-note">
          Share a condolence, short memory, or note of support.
        </p>
        <button className="message-trigger-button" type="button" onClick={() => setOpen(true)}>
          Leave a Message
        </button>
      </div>

      {open ? (
        <div className="message-modal-overlay" onClick={() => setOpen(false)}>
          <div className="message-modal-card form-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Guestbook Submission</p>
                <h3>Leave a Message</h3>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close message form"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              id="tribute-message-form"
              className="form-modal-body"
              action={async (formData) => {
                await handleSubmit(formData);
              }}
            >
              <p className="subtle-note">
                Guests can share condolences, short memories, or a note of support.
                Messages are reviewed before they appear publicly.
              </p>

              <label className={`field-block ${fieldErrors.author ? "has-error" : ""}`}>
                <span>Your name</span>
                <input
                  name="author"
                  type="text"
                  placeholder="Enter your name"
                  required
                  onChange={() =>
                    setFieldErrors((current) => ({ ...current, author: undefined }))
                  }
                />
                {fieldErrors.author ? <p className="field-error">{fieldErrors.author}</p> : null}
              </label>

              <label className={`field-block ${fieldErrors.email ? "has-error" : ""}`}>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  onChange={() =>
                    setFieldErrors((current) => ({ ...current, email: undefined }))
                  }
                />
                {fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
              </label>

              <div className="field-block">
                <span>Show this memory in</span>
                <div className="choice-row">
                  <button
                    className={
                      placement === "feed" ? "choice-chip choice-chip-active" : "choice-chip"
                    }
                    type="button"
                    onClick={() => setPlacement("feed")}
                  >
                    Feed
                  </button>
                  <button
                    className={
                      placement === "timeline"
                        ? "choice-chip choice-chip-active"
                        : "choice-chip"
                    }
                    type="button"
                    onClick={() => setPlacement("timeline")}
                  >
                    Timeline
                  </button>
                </div>
              </div>

              <label className="field-block field-honeypot" aria-hidden="true">
                <span>Website</span>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>

              <label className={`field-block ${fieldErrors.message ? "has-error" : ""}`}>
                <span>Your memory</span>
                <textarea
                  name="message"
                  placeholder="Write a memory, prayer, or note of support"
                  required
                  minLength={12}
                  onChange={() =>
                    setFieldErrors((current) => ({ ...current, message: undefined }))
                  }
                />
                {fieldErrors.message ? <p className="field-error">{fieldErrors.message}</p> : null}
              </label>

              {turnstileSiteKey ? (
                <div className="field-block">
                  <span>Bot verification</span>
                  <div ref={turnstileContainerRef} className="cf-turnstile" data-sitekey={turnstileSiteKey} />
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
                  ? "Submitting..."
                  : turnstileSiteKey && !turnstileToken.trim()
                    ? turnstileSubmitWaitingLabel
                    : "Submit Message"}
              </button>

              <p className="subtle-note">
                Please verify your email after submitting. Your message appears after
                review.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
