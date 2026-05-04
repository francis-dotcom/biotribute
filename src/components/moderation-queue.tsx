"use client";

import { useMemo, useState } from "react";
import type { StoredMessageRow } from "@/lib/messages";

type ModerationQueueProps = {
  messages: StoredMessageRow[];
  redirectTo?: string;
};

type GroupedModerationRow = {
  email: string;
  latest: StoredMessageRow & { preview: string };
  history: StoredMessageRow[];
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
  redirectTo,
}: ModerationQueueProps) {
  const [activeGroup, setActiveGroup] = useState<GroupedModerationRow | null>(null);

  const rows = useMemo(
    () => {
      const grouped = new Map<string, GroupedModerationRow>();

      for (const message of messages) {
        const key = message.email.trim().toLowerCase();
        const existing = grouped.get(key);

        if (!existing) {
          grouped.set(key, {
            email: key,
            latest: {
              ...message,
              preview: getMessagePreview(message.message),
            },
            history: [message],
          });
          continue;
        }

        existing.history.push(message);

        if (new Date(message.created_at).getTime() > new Date(existing.latest.created_at).getTime()) {
          existing.latest = {
            ...message,
            preview: getMessagePreview(message.message),
          };
        }
      }

      return Array.from(grouped.values()).sort(
        (left, right) =>
          new Date(right.latest.created_at).getTime() - new Date(left.latest.created_at).getTime(),
      );
    },
    [messages],
  );

  return (
    <>
      <section className="admin-grid">
        {rows.map((group) => (
          <article className="moderation-row moderation-row-compact" key={group.email}>
            <div className="moderation-row-main">
              <div className="moderation-row-meta">
                <p className="card-label">
                  {group.latest.status.replaceAll("_", " ")} · {group.latest.placement}
                </p>
                <p className="subtle-note">
                  {new Date(group.latest.created_at).toLocaleString("en-US")}
                </p>
              </div>
              <button
                className="moderation-row-open"
                type="button"
                onClick={() => setActiveGroup(group)}
              >
                <span className="moderation-row-summary">
                  <span className="moderation-row-author">{group.latest.author}</span>
                  <span className="moderation-row-preview">{group.latest.preview}</span>
                </span>
                <span className="moderation-row-email">{group.latest.email}</span>
                {group.history.length > 1 ? (
                  <span className="moderation-row-history-count">
                    {group.history.length} posts
                  </span>
                ) : null}
              </button>
            </div>
            <div className="moderation-row-side">
              <span
                className={
                  group.latest.email_verified
                    ? "moderation-email-indicator is-verified"
                    : "moderation-email-indicator is-unverified"
                }
                aria-label={group.latest.email_verified ? "Email verified" : "Email not verified"}
                title={group.latest.email_verified ? "Email verified" : "Email not verified"}
              >
                <span aria-hidden="true">✉</span>
              </span>
              <form
                action={`/api/admin/messages/${group.latest.id}`}
                method="post"
                className="admin-actions admin-actions-inline"
              >
                {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
                {group.latest.status === "pending_unverified" ? (
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

      {activeGroup ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="moderation-message-title"
          onClick={() => setActiveGroup(null)}
        >
          <div className="message-modal-card moderation-message-modal" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">
                  {activeGroup.latest.status.replaceAll("_", " ")} · {activeGroup.latest.placement}
                </p>
                <h3 id="moderation-message-title">{activeGroup.latest.author}</h3>
                <p className="message-date">
                  Latest post · {new Date(activeGroup.latest.created_at).toLocaleString("en-US")}
                </p>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close message"
                onClick={() => setActiveGroup(null)}
              >
                ×
              </button>
            </div>
            <p className="moderation-modal-email">{activeGroup.latest.email}</p>
            <div className="moderation-history-list">
              {activeGroup.history
                .slice()
                .sort(
                  (left, right) =>
                    new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
                )
                .map((message) => (
                  <article className="moderation-history-item" key={message.id}>
                    <div className="moderation-history-meta">
                      <span className="card-label">
                        {message.status.replaceAll("_", " ")} · {message.placement}
                      </span>
                      <span className="message-date">
                        {new Date(message.created_at).toLocaleString("en-US")}
                      </span>
                    </div>
                    <p className="message-modal-copy">{message.message}</p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
