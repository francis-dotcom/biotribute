"use client";

import { useState } from "react";

type MessageFormProps = {
  tributeSlug: string;
  storeConfigured: boolean;
};

export function MessageForm({ tributeSlug, storeConfigured }: MessageFormProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [placement, setPlacement] = useState<"feed" | "timeline">("feed");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!storeConfigured) {
      setStatus("Posting is not configured yet. Add Supabase env vars before launch.");
      setOpen(true);
      return;
    }

    setPending(true);
    setStatus(null);

    const payload = {
      tributeSlug,
      author: String(formData.get("author") ?? ""),
      email: String(formData.get("email") ?? ""),
      placement,
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
      turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
    };

    if (turnstileSiteKey && !payload.turnstileToken.trim()) {
      setStatus("Please complete bot verification before submitting.");
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

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatus(data.error ?? "Unable to submit message.");
      setPending(false);
      return;
    }

    setStatus(
      data.message ??
        "Message submitted. Please verify your email from your inbox before your message can be reviewed and shown."
    );
    setPending(false);
    setOpen(true);

    const form = document.getElementById("tribute-message-form") as HTMLFormElement | null;
    form?.reset();
    setPlacement("feed");
  }

  return (
    <>
      <div className="message-trigger-card">
        <p className="card-label">Guestbook</p>
        <p className="subtle-note">
          Share a condolence, short memory, or note of support.
        </p>
        <button className="message-trigger-button" type="button" onClick={() => setOpen(true)}>
          Leave a Message
        </button>
        {status ? <p className="form-status">{status}</p> : null}
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

              <label className="field-block">
                <span>Your name</span>
                <input name="author" type="text" placeholder="Enter your name" required />
              </label>

              <label className="field-block">
                <span>Email</span>
                <input name="email" type="email" placeholder="Enter your email" required />
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

              <label className="field-block">
                <span>Your memory</span>
                <textarea
                  name="message"
                  placeholder="Write a memory, prayer, or note of support"
                  required
                  minLength={12}
                />
              </label>

              {turnstileSiteKey ? (
                <div className="field-block">
                  <span>Bot Verification</span>
                  <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
                </div>
              ) : null}

              <button className="button-primary" type="submit" disabled={pending}>
                {pending ? "Submitting..." : "Submit Message"}
              </button>

              <p className="subtle-note">
                Bot protection can use Cloudflare Turnstile or reCAPTCHA. After you submit,
                please verify your email before moderation and public display.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
