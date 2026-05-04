"use client";

import { useState } from "react";
import type { TributeTimelineEntry } from "@/data/tributes";

type TimelineSectionProps = {
  entries: TributeTimelineEntry[];
};

export function TimelineSection({ entries }: TimelineSectionProps) {
  const [activeEntry, setActiveEntry] = useState<TributeTimelineEntry | null>(null);

  return (
    <>
      <div className="timeline-list">
        {entries.map((entry) => (
          <article className="timeline-item" key={`${entry.year}-${entry.title}`}>
            <p className="timeline-year">{entry.year}</p>
            <h3>{entry.title}</h3>
            <p>{entry.copy}</p>
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
                <h3 id="timeline-modal-title">{activeEntry.title}</h3>
                <p className="message-date">{activeEntry.year}</p>
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
            <p className="message-modal-copy">{activeEntry.copy}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
