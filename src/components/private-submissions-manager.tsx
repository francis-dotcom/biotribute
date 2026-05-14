"use client";

import { useMemo, useState } from "react";
import type { StoredFamilyPrivateMessageRow } from "@/lib/family-private-messages";

type PrivateSubmissionsManagerProps = {
  messages: StoredFamilyPrivateMessageRow[];
  redirectTo?: string;
};

function getPrivatePreview(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

export function PrivateSubmissionsManager({
  messages,
  redirectTo,
}: PrivateSubmissionsManagerProps) {
  const [activeMessage, setActiveMessage] = useState<StoredFamilyPrivateMessageRow | null>(null);
  const [query, setQuery] = useState("");

  const filteredMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return messages;
    }

    return messages.filter((message) =>
      `${message.sender_name} ${message.sender_email} ${message.recipient_email} ${message.message}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [messages, query]);

  return (
    <>
      <article className="form-card moderation-group">
        <div className="moderation-group-header private-submissions-header">
          <div>
            <p className="card-label">Private Inbox</p>
            <p className="subtle-note">
              Direct submissions sent privately to the family. These never appear on the public tribute.
            </p>
          </div>
          <label className="messages-search private-submissions-search" htmlFor="private-submission-search">
            <span>Search private submissions</span>
            <input
              id="private-submission-search"
              type="search"
              value={query}
              placeholder="Search by sender or message..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {filteredMessages.length === 0 ? (
          <p className="subtle-note">
            {messages.length === 0
              ? "No private messages yet."
              : "No private submissions match your search."}
          </p>
        ) : (
          <section className="admin-grid">
            {filteredMessages.map((message) => (
              <article className="moderation-row moderation-row-compact private-inbox-row" key={message.id}>
                <div className="moderation-row-main">
                  <div className="moderation-row-meta">
                    <p className="card-label">Private submission</p>
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
                      <span className="moderation-row-author">{message.sender_name}</span>
                      <span className="moderation-row-preview">{getPrivatePreview(message.message)}</span>
                    </span>
                    <span className="moderation-row-email">{message.sender_email}</span>
                  </button>
                </div>
                <div className="moderation-row-side">
                  <form
                    action={`/api/admin/family-messages/${message.id}`}
                    method="post"
                    className="admin-actions admin-actions-inline"
                  >
                    {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
                    <button
                      className="moderation-icon-button is-delete"
                      type="submit"
                      name="action"
                      value="delete"
                      aria-label="Delete private message"
                      title="Delete private message"
                    >
                      <span aria-hidden="true">🗑</span>
                      <span className="sr-only">Delete private message</span>
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </section>
        )}
      </article>

      {activeMessage ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="private-submission-title"
          onClick={() => setActiveMessage(null)}
        >
          <div
            className="message-modal-card moderation-message-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Private submission</p>
                <h3 id="private-submission-title">{activeMessage.sender_name}</h3>
                <p className="message-date">
                  {new Date(activeMessage.created_at).toLocaleString("en-US")}
                </p>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close private message"
                onClick={() => setActiveMessage(null)}
              >
                ×
              </button>
            </div>
            <div className="private-submission-detail-grid">
              <p className="moderation-modal-email">
                <strong>From:</strong> {activeMessage.sender_email}
              </p>
              <p className="moderation-modal-email">
                <strong>To:</strong> {activeMessage.recipient_email}
              </p>
            </div>
            <p className="message-modal-copy moderation-message-body">{activeMessage.message}</p>
            <div className="moderation-history-actions">
              <form
                action={`/api/admin/family-messages/${activeMessage.id}`}
                method="post"
                className="admin-actions admin-actions-inline"
              >
                {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
                <button
                  className="moderation-icon-button is-delete"
                  type="submit"
                  name="action"
                  value="delete"
                  aria-label="Delete private message"
                  title="Delete private message"
                >
                  <span aria-hidden="true">🗑</span>
                  <span className="sr-only">Delete private message</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
