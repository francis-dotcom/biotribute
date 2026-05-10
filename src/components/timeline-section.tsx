"use client";

import { useEffect, useState } from "react";
import { MarkdownInline, MarkdownText } from "@/components/markdown-text";
import type { TributeTimelineEntry } from "@/data/tributes";

type TimelineSectionProps = {
  entries: TributeTimelineEntry[];
};

export function TimelineSection({ entries }: TimelineSectionProps) {
  const [activeEntry, setActiveEntry] = useState<TributeTimelineEntry | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const syncViewport = () => setIsMobile(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  const batchSize = isMobile ? 2 : 3;
  const [visibleCountOverride, setVisibleCountOverride] = useState<number | null>(null);
  const visibleCount = Math.min(
    entries.length,
    Math.max(batchSize, visibleCountOverride ?? batchSize),
  );
  const visibleEntries = entries.slice(0, visibleCount);
  const hasMoreEntries = visibleCount < entries.length;

  return (
    <>
      <div className="timeline-list">
        {visibleEntries.map((entry, index) => (
          <article className="timeline-item" key={`${entry.year}-${entry.title}-${index}`}>
            <span className="timeline-marker" aria-hidden="true" />
            {entry.year.trim() ? (
              <p className="timeline-year">
                <MarkdownInline content={entry.year} />
              </p>
            ) : null}
            {entry.title.trim() ? (
              <h3>
                <MarkdownInline content={entry.title} />
              </h3>
            ) : null}
              <MarkdownText content={entry.copy} />
            <button
              className="timeline-read-more"
              type="button"
              onClick={() => setActiveEntry(entry)}
            >
              Read more
            </button>
          </article>
        ))}
      </div>
      {hasMoreEntries ? (
        <div className="builder-inline-actions">
          <button
            className="button-secondary"
            type="button"
            onClick={() =>
              setVisibleCountOverride((current) =>
                Math.min((current ?? batchSize) + batchSize, entries.length),
              )
            }
          >
            Load more to read more
          </button>
        </div>
      ) : null}
      {visibleCount > batchSize ? (
        <div className="builder-inline-actions">
          <button
            className="button-secondary"
            type="button"
            onClick={() => setVisibleCountOverride(null)}
          >
            Load less
          </button>
        </div>
      ) : null}

      {activeEntry ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="timeline-modal-title"
          onClick={() => setActiveEntry(null)}
        >
          <div className="message-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Timeline Story</p>
                <h3 id="timeline-modal-title">
                  <MarkdownInline content={activeEntry.title.trim() || "Memory"} />
                </h3>
                {activeEntry.year.trim() ? (
                  <p className="message-date">
                    <MarkdownInline content={activeEntry.year} />
                  </p>
                ) : null}
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close timeline story"
                onClick={() => setActiveEntry(null)}
              >
                ×
              </button>
            </div>
            <MarkdownText content={activeEntry.copy} className="message-modal-copy" />
          </div>
        </div>
      ) : null}
    </>
  );
}
