"use client";

import { useMemo, useState } from "react";
import type { TributeVisitSessionDetail } from "@/lib/visits";

type VisitorDetailsPanelProps = {
  visits: TributeVisitSessionDetail[];
  error?: string | null;
};

type VisitorSummary = {
  visitorHash: string;
  visits: number;
  firstSeenAt: string;
  lastSeenAt: string;
  pagesVisited: string[];
  lastReferer?: string | null;
  estimatedDurationSeconds: number;
};

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

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
          firstSeenAt: visit.firstSeenAt,
          lastSeenAt: visit.lastSeenAt,
          pagesVisited: [visit.path],
          lastReferer: visit.referer,
          estimatedDurationSeconds: visit.estimatedDurationSeconds,
        });
        continue;
      }

      existing.visits += 1;
      existing.estimatedDurationSeconds += visit.estimatedDurationSeconds;
      if (!existing.pagesVisited.includes(visit.path)) {
        existing.pagesVisited.push(visit.path);
      }
      if (new Date(visit.firstSeenAt).getTime() < new Date(existing.firstSeenAt).getTime()) {
        existing.firstSeenAt = visit.firstSeenAt;
      }
      if (new Date(visit.lastSeenAt).getTime() > new Date(existing.lastSeenAt).getTime()) {
        existing.lastSeenAt = visit.lastSeenAt;
        existing.lastReferer = visit.referer;
      }
    }

    return Array.from(grouped.values()).sort((left, right) => {
      if (right.visits !== left.visits) {
        return right.visits - left.visits;
      }

      return new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime();
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
              <div className="console-visit-item" key={`${visit.sessionId}-${visit.path}`}>
                <p>
                  <strong>{new Date(visit.lastSeenAt).toLocaleString("en-US")}</strong>
                </p>
                <p>Path: {visit.path}</p>
                <p>Visitor: {visit.visitorHash.slice(0, 10)}...</p>
                <p>First seen: {new Date(visit.firstSeenAt).toLocaleString("en-US")}</p>
                <p>Last seen: {new Date(visit.lastSeenAt).toLocaleString("en-US")}</p>
                <p>Estimated time on page: {formatDuration(visit.estimatedDurationSeconds)}</p>
                <p>Heartbeat updates: {visit.heartbeatCount}</p>
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
                  <strong>{visitor.visits} page visit{visitor.visits === 1 ? "" : "s"}</strong>
                </p>
                <p>Visitor: {visitor.visitorHash.slice(0, 10)}...</p>
                <p>First seen: {new Date(visitor.firstSeenAt).toLocaleString("en-US")}</p>
                <p>Last seen: {new Date(visitor.lastSeenAt).toLocaleString("en-US")}</p>
                <p>Pages visited: {visitor.pagesVisited.join(", ")}</p>
                <p>Estimated session duration: {formatDuration(visitor.estimatedDurationSeconds)}</p>
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
