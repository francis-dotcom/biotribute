"use client";

import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NOTICE_TOAST_AUTO_DISMISS_MS } from "@/components/notice-toast";
import {
  turnstileGreenVerifiedNotice,
  turnstileGreenWaitingNotice,
  turnstileNotReadyYetMessage,
  turnstileSubmitWaitingLabel,
} from "@/lib/turnstile-user-copy";

type TributeCardModalProps = {
  recipientEmail?: string;
  tributeSlug: string;
  tributeName: string;
  storeConfigured: boolean;
  imageUrl?: string;
};

const CONDOLENCE_CARD_COPY = `WITH DEEPEST CONDOLENCES

For the loss of our dear friend,
uncle, father, brother and
most importantly lover of Christ.

May his gentle soul rest in peace.

I will keep you in my thoughts and prayers.`;
const POPUP_AUTO_CLOSE_MS = 7000;
const SUCCESS_AUTO_CLOSE_MS = 1800;
const POPUP_RESHOW_DELAY_MS = 1000 * 60 * 60 * 24;

export function TributeCardModal({
  recipientEmail,
  tributeSlug,
  tributeName,
  storeConfigured,
  imageUrl,
}: TributeCardModalProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const sentStorageKey = `biotribute-condolence-sent-${tributeSlug}`;
  const seenStorageKey = `biotribute-condolence-seen-${tributeSlug}`;
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const alreadySent =
      typeof window !== "undefined" &&
      window.localStorage.getItem(sentStorageKey) === "true";
    if (alreadySent) {
      return;
    }

    const lastSeenAt =
      typeof window !== "undefined" ? window.localStorage.getItem(seenStorageKey) : null;
    if (lastSeenAt) {
      const elapsedMs = Date.now() - Number(lastSeenAt);
      if (Number.isFinite(elapsedMs) && elapsedMs < POPUP_RESHOW_DELAY_MS) {
        return;
      }
    }

    const openTimer = window.setTimeout(() => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(seenStorageKey, String(Date.now()));
      }
      setIsOpen(true);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, [seenStorageKey, sentStorageKey]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), NOTICE_TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const hasInputValue = Boolean(name.trim() || email.trim());
    if (!isOpen || hasStartedTyping || hasInputValue || pending || submitted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resetFormState();
      setIsOpen(false);
    }, POPUP_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeout);
  }, [email, hasStartedTyping, isOpen, name, pending, submitted]);

  useEffect(() => {
    if (!isOpen || !submitted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resetFormState();
      setIsOpen(false);
    }, SUCCESS_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeout);
  }, [isOpen, submitted]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.classList.add("condolence-popup-open");

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.classList.remove("condolence-popup-open");
    };
  }, [isOpen]);

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

  function resetFormState() {
    setPending(false);
    setSubmitted(false);
    setName("");
    setEmail("");
    setHasStartedTyping(false);
    setTurnstileToken("");
  }

  function closeModal() {
    resetFormState();
    setIsOpen(false);
  }

  function openModal() {
    resetFormState();
    setIsOpen(true);
  }

  function handleFieldChange(
    setter: Dispatch<SetStateAction<string>>,
    value: string,
  ) {
    setter(value);
    if (!hasStartedTyping && value.trim()) {
      setHasStartedTyping(true);
    }
  }

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
    setSubmitted(false);

    const payload = {
      tributeSlug,
      recipientEmail,
      senderName: String(formData.get("name") ?? ""),
      senderEmail: String(formData.get("email") ?? ""),
      message: CONDOLENCE_CARD_COPY,
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

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setToast({ message: data.error ?? "Unable to send tribute card.", tone: "error" });
      setPending(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(sentStorageKey, "true");
      window.localStorage.removeItem(seenStorageKey);
    }
    setPending(false);
    setSubmitted(true);
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

      <button className="support-action-pill" type="button" onClick={openModal}>
        Card
      </button>

      {mounted && isOpen
        ? createPortal(
            <div className="message-modal-overlay" onClick={closeModal}>
              <div
                className="message-modal-card form-modal-card condolence-popup-card"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="message-modal-head condolence-popup-head">
                  <div className="condolence-popup-title-wrap">
                    <p className="condolence-popup-title">Send Your Condolences</p>
                  </div>
                  <button
                    className="message-modal-close"
                    type="button"
                    aria-label="Close tribute card form"
                    onClick={closeModal}
                  >
                    ×
                  </button>
                </div>

                <div className="condolence-card-preview">
                  <Image
                    src={imageUrl?.trim() || "/condolence-exact.png"}
                    alt={`Condolence card for ${tributeName}`}
                    width={860}
                    height={688}
                    className="condolence-card-image"
                    priority
                  />
                </div>

                <form
                  className="form-modal-body"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit(new FormData(event.currentTarget));
                  }}
                >
                  {submitted ? (
                    <div className="condolence-popup-success" role="status" aria-live="polite">
                      <p>Thank you. The family will receive your card note.</p>
                    </div>
                  ) : (
                    <>
                      <label className="field-block">
                        <span>Name</span>
                        <input
                          name="name"
                          type="text"
                          placeholder="Your name"
                          required
                          value={name}
                          onChange={(event) => handleFieldChange(setName, event.target.value)}
                        />
                      </label>

                      <label className="field-block">
                        <span>Email</span>
                        <input
                          name="email"
                          type="email"
                          placeholder="Your email"
                          required
                          value={email}
                          onChange={(event) => handleFieldChange(setEmail, event.target.value)}
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
                        className="button-primary condolence-popup-submit"
                        type="submit"
                        disabled={
                          pending ||
                          !name.trim() ||
                          !email.trim() ||
                          (Boolean(turnstileSiteKey) && !turnstileToken.trim())
                        }
                      >
                        {pending
                          ? "Sending..."
                          : turnstileSiteKey && !turnstileToken.trim()
                            ? turnstileSubmitWaitingLabel
                            : "SEND"}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
