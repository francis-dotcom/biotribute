"use client";

import { useMemo, useState } from "react";
import type { StoredMessageRow } from "@/lib/messages";

type ModerationQueueProps = {
  messages: StoredMessageRow[];
  token?: string;
  redirectTo?: string;
};

function getMessagePreview(message: string) {
  const words = message.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 4) {
    return message;
  }

  return `${words.slice(0, 4).join(" ")}...`;
}

export function ModerationQueue({
  messages,
  token,
  redirectTo,
}: ModerationQueueProps) {
  const [activeMessage, setActiveMessage] = useState<StoredMessageRow | null>(null);

  const rows = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        preview: getMessagePreview(message.message),
      })),
    [messages],
  );

  return (
    <>
      <section className="admin-grid">
        {rows.map((message) => (
          <article className="moderation-row moderation-row-compact" key={message.id}>
            <div className="moderation-row-main">
              <div className="moderation-row-meta">
                <p className="card-label">{message.status.replaceAll("_", " ")} · {message.placement}</p>
                <p className="subtle-note">
                  {new Date(message.created_at).toLocaleString("en-US")}
                </p>
              </div>
              <button
                className="moderation-row-open"
                type="button"
                onClick={() => setActiveMessage(message)}
              >
                <span className="moderation-row-summary">
                  <span className="moderation-row-author">{message.author}</span>
                  <span className="moderation-row-preview">{message.preview}</span>
                </span>
                <span className="moderation-row-email">{message.email}</span>
              </button>
            </div>
            <div className="moderation-row-side">
              <span
                className={
                  message.email_verified
                    ? "moderation-email-indicator is-verified"
                    : "moderation-email-indicator is-unverified"
                }
                aria-label={message.email_verified ? "Email verified" : "Email not verified"}
                title={message.email_verified ? "Email verified" : "Email not verified"}
              >
                <span aria-hidden="true">✉</span>
              </span>
              <form
                action={`/api/admin/messages/${message.id}`}
                method="post"
                className="admin-actions admin-actions-inline"
              >
                <input type="hidden" name="token" value={token} />
                {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
                {message.status === "pending_unverified" ? (
                  <button
                    className="moderation-icon-button"
                    type="submit"
                    name="status"
                    value="pending_verified"
                    aria-label="Mark pending verified"
                    title="Mark pending verified"
                  >
                    <span aria-hidden="true">⌛</span>
                    <span className="sr-only">Mark pending verified</span>
                  </button>
                ) : null}
                <button
                  className="moderation-icon-button is-approve"
                  type="submit"
                  name="status"
                  value="approved"
                  aria-label="Approve message"
                  title="Approve message"
                >
                  <span aria-hidden="true">✓</span>
                  <span className="sr-only">Approve message</span>
                </button>
                <button
                  className="moderation-icon-button is-reject"
                  type="submit"
                  name="status"
                  value="rejected"
                  aria-label="Reject message"
                  title="Reject message"
                >
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Reject message</span>
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>

      {activeMessage ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="moderation-message-title"
          onClick={() => setActiveMessage(null)}
        >
          <div className="message-modal-card moderation-message-modal" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">
                  {activeMessage.status.replaceAll("_", " ")} · {activeMessage.placement}
                </p>
                <h3 id="moderation-message-title">{activeMessage.author}</h3>
                <p className="message-date">
                  {new Date(activeMessage.created_at).toLocaleString("en-US")}
                </p>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close message"
                onClick={() => setActiveMessage(null)}
              >
                ×
              </button>
            </div>
            <p className="moderation-modal-email">{activeMessage.email}</p>
            <p className="message-modal-copy">{activeMessage.message}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
