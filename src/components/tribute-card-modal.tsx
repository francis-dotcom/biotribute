"use client";

import { useEffect, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
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
      setToast({ message: data.error ?? "Unable to send tribute card.", tone: "error" });
      setPending(false);
      return;
    }

    setToast({
      message: data.message ?? "Tribute card sent to the family successfully.",
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
                Send a featured card message for {tributeName}.
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
