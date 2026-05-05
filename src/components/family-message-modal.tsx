"use client";

import { useEffect, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

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
    };

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

              <button className="button-primary" type="submit" disabled={pending}>
                {pending ? "Sending..." : "Send Message"}
              </button>

              {status ? <p className="form-status">{status}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
