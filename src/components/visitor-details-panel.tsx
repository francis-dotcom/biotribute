"use client";

import { useMemo, useState } from "react";
import type { TributeVisitDetail } from "@/lib/visits";

type VisitorDetailsPanelProps = {
  visits: TributeVisitDetail[];
  error?: string | null;
};

type VisitorSummary = {
  visitorHash: string;
  visits: number;
  lastVisitedAt: string;
  lastPath: string;
  lastReferer?: string | null;
};

export function VisitorDetailsPanel({ visits, error }: VisitorDetailsPanelProps) {
  const [mode, setMode] = useState<"recent" | "unique">("recent");

  const groupedVisitors = useMemo(() => {
    const grouped = new Map<string, VisitorSummary>();

    for (const visit of visits) {
      const existing = grouped.get(visit.visitorHash);
      if (!existing) {
        grouped.set(visit.visitorHash, {
          visitorHash: visit.visitorHash,
          visits: 1,
          lastVisitedAt: visit.createdAt,
          lastPath: visit.path,
          lastReferer: visit.referer,
        });
        continue;
      }

      existing.visits += 1;
      if (new Date(visit.createdAt).getTime() > new Date(existing.lastVisitedAt).getTime()) {
        existing.lastVisitedAt = visit.createdAt;
        existing.lastPath = visit.path;
        existing.lastReferer = visit.referer;
      }
    }

    return Array.from(grouped.values()).sort((left, right) => {
      if (right.visits !== left.visits) {
        return right.visits - left.visits;
      }

      return new Date(right.lastVisitedAt).getTime() - new Date(left.lastVisitedAt).getTime();
    });
  }, [visits]);

  return (
    <>
      <div className="console-visit-filters" role="tablist" aria-label="Visitor detail filters">
        <button
          className={`button-secondary ${mode === "recent" ? "is-active" : ""}`}
          type="button"
          onClick={() => setMode("recent")}
        >
          Recent Visits
        </button>
        <button
          className={`button-secondary ${mode === "unique" ? "is-active" : ""}`}
          type="button"
          onClick={() => setMode("unique")}
        >
          Unique Visitors
        </button>
      </div>

      {error ? <p>{error}</p> : null}

      {!error && mode === "recent" ? (
        visits.length > 0 ? (
          <div className="console-visit-list">
            {visits.map((visit) => (
              <div className="console-visit-item" key={`${visit.visitorHash}-${visit.createdAt}`}>
                <p>
                  <strong>{new Date(visit.createdAt).toLocaleString("en-US")}</strong>
                </p>
                <p>Path: {visit.path}</p>
                <p>Visitor: {visit.visitorHash.slice(0, 10)}...</p>
                <p>Referer: {visit.referer?.trim() ? visit.referer : "Direct / unknown"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No visits recorded yet.</p>
        )
      ) : null}

      {!error && mode === "unique" ? (
        groupedVisitors.length > 0 ? (
          <div className="console-visit-list">
            {groupedVisitors.map((visitor) => (
              <div className="console-visit-item" key={visitor.visitorHash}>
                <p>
                  <strong>{visitor.visits} visit{visitor.visits === 1 ? "" : "s"}</strong>
                </p>
                <p>Visitor: {visitor.visitorHash.slice(0, 10)}...</p>
                <p>Last seen: {new Date(visitor.lastVisitedAt).toLocaleString("en-US")}</p>
                <p>Last path: {visitor.lastPath}</p>
                <p>Referer: {visitor.lastReferer?.trim() ? visitor.lastReferer : "Direct / unknown"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No unique visitors recorded yet.</p>
        )
      ) : null}
    </>
  );
}
