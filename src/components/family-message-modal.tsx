"use client";

import { useMemo, useState } from "react";

type FamilyMessageModalProps = {
  recipientEmail?: string;
  tributeName: string;
  organizer: string;
};

export function FamilyMessageModal({
  recipientEmail,
  tributeName,
  organizer,
}: FamilyMessageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const subject = useMemo(
    () => `Private Message for ${tributeName}`,
    [tributeName],
  );

  function handleSubmit(formData: FormData) {
    if (!recipientEmail) {
      setStatus("Family contact email is not configured yet.");
      return;
    }

    const name = String(formData.get("name") ?? "").trim();
    const senderEmail = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const body = `Dear ${organizer} and family,

${message}

From: ${name}
Reply to: ${senderEmail}`;

    window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("Your email app is opening.");
    setIsOpen(false);
  }

  return (
    <>
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
                Send a private note directly to the family representative.
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

              <button className="button-primary" type="submit">
                Send Message
              </button>

              {status ? <p className="form-status">{status}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
