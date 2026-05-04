"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TributeMessage } from "@/data/tributes";

type MessageFeedProps = {
  messages: TributeMessage[];
};

export function MessageFeed({ messages }: MessageFeedProps) {
  const [activeMessage, setActiveMessage] = useState<TributeMessage | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [query, setQuery] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isSearching = query.trim().length > 0;

  const filteredMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return messages;
    }

    return messages.filter((message) =>
      `${message.author} ${message.excerpt} ${message.full} ${message.date}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [messages, query]);

  const visibleMessages = useMemo(() => {
    if (isSearching) {
      return filteredMessages;
    }

    if (filteredMessages.length === 0) {
      return [];
    }

    const minCardsForAutoScroll = 8;
    const repeatCount = Math.max(2, Math.ceil(minCardsForAutoScroll / filteredMessages.length));
    const seed = Array.from({ length: repeatCount }, () => filteredMessages).flat();

    return [...seed, ...seed];
  }, [filteredMessages, isSearching]);

  function scrollMessages(direction: "left" | "right") {
    if (isSearching) {
      return;
    }

    const track = trackRef.current;
    if (!track) {
      return;
    }

    const amount = Math.max(260, track.clientWidth * 0.8);
    track.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  function jumpToDonate() {
    const section = document.getElementById("support-section");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (!isSearching) {
      return;
    }

    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [isSearching]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || isSearching || isHovered || filteredMessages.length === 0) {
      return;
    }

    const loopPoint = track.scrollWidth / 2;
    if (loopPoint <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      track.scrollLeft += 1;

      if (track.scrollLeft >= loopPoint) {
        track.scrollLeft -= loopPoint;
      }
    }, 28);

    return () => {
      window.clearInterval(timerId);
    };
  }, [filteredMessages.length, isHovered, isSearching, visibleMessages.length]);

  return (
    <>
      <div className="messages-toolbar">
        <label className="messages-search" htmlFor="message-search">
          <span>Search messages</span>
          <input
            id="message-search"
            type="search"
            value={query}
            placeholder="Search by name or memory..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="messages-scroll-actions" role="group" aria-label="Scroll messages">
          <button className="messages-donate-button" type="button" onClick={jumpToDonate}>
            Donate
          </button>
          <button
            className="messages-library-button"
            type="button"
            onClick={() => setShowLibrary(true)}
          >
            View all messages
          </button>
          <button
            className="messages-scroll-button"
            type="button"
            disabled={isSearching}
            aria-disabled={isSearching}
            onClick={() => scrollMessages("left")}
          >
            ←
          </button>
          <button
            className="messages-scroll-button"
            type="button"
            disabled={isSearching}
            aria-disabled={isSearching}
            onClick={() => scrollMessages("right")}
          >
            →
          </button>
        </div>
      </div>

      <div
        className="messages-stream"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`messages-track${isSearching ? " is-searching" : ""}`}
          ref={trackRef}
        >
          {visibleMessages.map((message, index) => (
            <article className="message-mini-card" key={`${message.id}-${index}`}>
              <div>
                <div className="message-meta-row">
                  <span
                    className={
                      message.placement === "timeline"
                        ? "message-chip is-timeline"
                        : "message-chip"
                    }
                  >
                    {message.placement}
                  </span>
                  <span className="message-date">{message.date}</span>
                </div>
                <p className="message-author">{message.author}</p>
                <p className="message-excerpt">{message.excerpt}</p>
              </div>
              <button
                className="message-more-button"
                type="button"
                onClick={() => setActiveMessage(message)}
              >
                See more
              </button>
            </article>
          ))}
        </div>
        {filteredMessages.length === 0 ? (
          <p className="subtle-note">No messages match your search yet.</p>
        ) : null}
      </div>

      {activeMessage ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="message-modal-title"
          onClick={() => setActiveMessage(null)}
        >
          <div className="message-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">
                  {activeMessage.placement === "timeline" ? "Timeline Memory" : "Memory Feed"}
                </p>
                <h3 id="message-modal-title">{activeMessage.author}</h3>
                <p className="message-date">{activeMessage.date}</p>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close memory"
                onClick={() => setActiveMessage(null)}
              >
                ×
              </button>
            </div>
            <p className="message-modal-copy">{activeMessage.full}</p>
          </div>
        </div>
      ) : null}

      {showLibrary ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="messages-library-title"
          onClick={() => setShowLibrary(false)}
        >
          <div
            className="message-modal-card messages-library-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Message Archive</p>
                <h3 id="messages-library-title">All messages</h3>
                <p className="message-date">{filteredMessages.length} message(s)</p>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close message archive"
                onClick={() => setShowLibrary(false)}
              >
                ×
              </button>
            </div>

            <div className="messages-library-body">
              <label className="messages-search messages-library-search" htmlFor="message-library-search">
                <span>Search all messages</span>
                <input
                  id="message-library-search"
                  type="search"
                  value={query}
                  placeholder="Search by name or memory..."
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <div className="messages-library-list">
                {filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    className="messages-library-item"
                    type="button"
                    onClick={() => setActiveMessage(message)}
                  >
                    <div className="messages-library-item-top">
                      <span
                        className={
                          message.placement === "timeline"
                            ? "message-chip is-timeline"
                            : "message-chip"
                        }
                      >
                        {message.placement}
                      </span>
                      <span className="message-date">{message.date}</span>
                    </div>
                    <p className="message-author">{message.author}</p>
                    <p className="message-excerpt">{message.excerpt}</p>
                  </button>
                ))}
                {filteredMessages.length === 0 ? (
                  <p className="subtle-note">No messages match your search yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
