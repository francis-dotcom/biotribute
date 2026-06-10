"use client";

import { useMemo } from "react";
import { MarkdownText } from "@/components/markdown-text";
import type { TributeRecord } from "@/data/tributes";

type TributeMediaSectionProps = {
  tributeSlug: string;
  videoUrls: TributeRecord["videoUrls"];
  videoDescriptions: TributeRecord["videoDescriptions"];
  videoThumbnailUrls: TributeRecord["videoThumbnailUrls"];
  activeVideoIndex?: TributeRecord["activeVideoIndex"];
  videoNote?: string;
  livestreamUrl?: string;
  livestreamThumbnailUrl?: string;
  livestreamDisplayMode?: TributeRecord["livestreamDisplayMode"];
  livestreamNote?: string;
  showVideoSection: boolean;
  showLivestreamSection: boolean;
};

type MediaEmbed =
  | { type: "video"; src: string; openUrl: string; thumbnail?: string | null; label: string; description?: string; sourceIndex: number }
  | { type: "iframe"; src: string; openUrl: string; thumbnail?: string | null; label: string; description?: string; sourceIndex: number }
  | { type: "link"; src: string; openUrl: string; thumbnail?: string | null; label: string; description?: string; sourceIndex: number };

function shouldPrioritizeLivestream(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const parts = formatter.formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);

  return month === 6 && (day === 10 || day === 11);
}

function extractYouTubeId(parsed: URL) {
  const host = parsed.hostname.toLowerCase();
  const parts = parsed.pathname.split("/").filter(Boolean);

  if (host.includes("youtu.be")) {
    return parts[0] ?? "";
  }

  if (parts[0] === "watch") {
    return parsed.searchParams.get("v") ?? "";
  }

  if (["live", "embed", "shorts"].includes(parts[0] ?? "")) {
    return parts[1] ?? "";
  }

  return parsed.searchParams.get("v") ?? "";
}

function normalizeMediaUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^www\./i.test(trimmed) || /^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function toEmbedUrl(url: string, index: number): MediaEmbed | null {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const videoId = extractYouTubeId(parsed);
      if (videoId) {
        return {
          type: "iframe",
          src: `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`,
          openUrl: normalized,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          label: `Video Memory ${index + 1}`,
          sourceIndex: index,
        };
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const maybeId = segments[segments.length - 1] ?? "";
      if (maybeId) {
        return {
          type: "iframe",
          src: `https://player.vimeo.com/video/${maybeId}?playsinline=1&title=0&byline=0&portrait=0`,
          openUrl: normalized,
          thumbnail: null,
          label: `Video Memory ${index + 1}`,
          sourceIndex: index,
        };
      }
    }

    if (parsed.pathname.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: "video",
        src: normalized,
        openUrl: normalized,
        thumbnail: null,
        label: `Video Memory ${index + 1}`,
        sourceIndex: index,
      };
    }

    return {
      type: "link",
      src: normalized,
      openUrl: normalized,
      thumbnail: null,
      label: `Video Memory ${index + 1}`,
      sourceIndex: index,
    };
  } catch {
    if (/^https?:\/\//i.test(normalized)) {
      return {
        type: "link",
        src: normalized,
        openUrl: normalized,
        thumbnail: null,
        label: `Video Memory ${index + 1}`,
        sourceIndex: index,
      };
    }
    return null;
  }
}

function createVisitSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visit-session-${new Date().getTime()}`;
}

const MAX_VIDEO_SLOTS = 3;

function getVideoSlotIndices(videoUrls: string[]) {
  const indices: number[] = [];

  for (let index = 0; index < MAX_VIDEO_SLOTS; index += 1) {
    if ((videoUrls[index] ?? "").trim()) {
      indices.push(index);
    }
  }

  // Newest slot (Video 3) first, then Video 2, then Video 1.
  return indices.sort((left, right) => right - left);
}

export function TributeMediaSection({
  tributeSlug,
  videoUrls,
  videoDescriptions,
  videoThumbnailUrls,
  videoNote,
  livestreamUrl,
  livestreamThumbnailUrl,
  livestreamDisplayMode,
  livestreamNote,
  showVideoSection,
  showLivestreamSection,
}: TributeMediaSectionProps) {
  const livestreamNoteText = livestreamNote?.trim();

  function getVisitSessionId() {
    const sessionStorageKey = `biotribute-visit-session:${tributeSlug}`;
    const existing = window.sessionStorage.getItem(sessionStorageKey);
    const sessionId = existing ?? createVisitSessionId();
    window.sessionStorage.setItem(sessionStorageKey, sessionId);
    return sessionId;
  }

  function trackVideoOpen(videoIndex: number) {
    const payload = JSON.stringify({
      tributeSlug,
      sessionId: getVisitSessionId(),
      videoIndex,
      path: window.location.pathname,
    });

    void fetch("/api/video-opens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
    });
  }

  const mediaEmbeds = useMemo(
    () =>
      getVideoSlotIndices(videoUrls)
        .map((index) => {
          const url = (videoUrls[index] ?? "").trim();
          const embed = toEmbedUrl(url, index);
          if (!embed) return null;
          return {
            ...embed,
            thumbnail: videoThumbnailUrls[index]?.trim() || embed.thumbnail,
            description: videoDescriptions[index]?.trim() || undefined,
            label: videoDescriptions[index]?.trim() || embed.label,
          } as MediaEmbed;
        })
        .filter(Boolean) as MediaEmbed[],
    [videoUrls, videoDescriptions, videoThumbnailUrls]
  );

  const streamEmbed = useMemo(() => toEmbedUrl(livestreamUrl ?? "", 0), [livestreamUrl]);
  const activeLivestreamDisplayMode =
    livestreamDisplayMode ?? (livestreamThumbnailUrl?.trim() ? "image-url" : "video");
  const showLivestreamFirst = useMemo(() => shouldPrioritizeLivestream(new Date()), []);

  if (!showVideoSection && !showLivestreamSection) {
    return null;
  }

  const videoSection = showVideoSection ? (
    <section className="content-section content-section-soft">
      <p className="section-kicker">Videos</p>
      <h2>Video Memories</h2>
      <span className="section-accent" />

      {mediaEmbeds.length > 0 ? (
        <div className={`tribute-media-grid tribute-media-grid-count-${Math.min(mediaEmbeds.length, 2)}`}>
          {mediaEmbeds.map((embed) => {
            const tileCopy =
              embed.description?.trim() ||
              (embed.type === "link"
                ? "Tap to open this tribute memory."
                : "Tap to watch this tribute memory.");

            return (
              <a
                key={`${embed.sourceIndex}-${embed.src}`}
                className="tribute-media-thumb tribute-media-selector"
                href={embed.openUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackVideoOpen(embed.sourceIndex)}
              >
                <div
                  className={`tribute-media-thumb-image${embed.thumbnail ? " has-image" : ""}`}
                  style={embed.thumbnail ? { backgroundImage: `url("${embed.thumbnail}")` } : undefined}
                >
                  <span className="tribute-media-play">Open Video</span>
                </div>
                <div className="tribute-media-thumb-copy">
                  <MarkdownText content={tileCopy} />
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <article className="form-card tribute-media-empty">
          <h3>Video memories coming soon</h3>
          <p>
            Add video links from the console builder to create a dedicated memory reel for
            family and friends.
          </p>
        </article>
      )}

      {videoNote?.trim() ? <MarkdownText content={videoNote} className="subtle-note" /> : null}
    </section>
  ) : null;

  const livestreamSection = showLivestreamSection ? (
    <section className="content-section">
      <p className="section-kicker">Live Memorial</p>
      <h2>Live Stream</h2>
      <span className="section-accent" />

      {(activeLivestreamDisplayMode === "video" ? streamEmbed : livestreamThumbnailUrl?.trim()) ? (
        <div className="tribute-stream-card">
          {activeLivestreamDisplayMode !== "video" && livestreamThumbnailUrl?.trim() ? (
            streamEmbed?.openUrl ? (
              <a
                className="tribute-stream-thumbnail tribute-stream-thumbnail-link"
                href={streamEmbed.openUrl}
                target="_blank"
                rel="noreferrer"
                style={{ backgroundImage: `url("${livestreamThumbnailUrl}")` }}
              >
                <span className="tribute-media-play">Watch Live on YouTube</span>
              </a>
            ) : (
              <div
                className="tribute-stream-thumbnail"
                style={{ backgroundImage: `url("${livestreamThumbnailUrl}")` }}
              />
            )
          ) : null}
          {activeLivestreamDisplayMode === "video" && streamEmbed ? (
            streamEmbed.type === "iframe" ? (
              <iframe
                className="tribute-stream-frame"
                src={streamEmbed.src}
                title="Memorial livestream"
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : streamEmbed.type === "video" ? (
              <video
                key={streamEmbed.src}
                className="tribute-stream-frame"
                src={streamEmbed.src}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                title="Memorial livestream"
              />
            ) : (
              <a className="button-primary tribute-media-link" href={streamEmbed.src} target="_blank" rel="noreferrer">
                Open livestream
              </a>
            )
          ) : null}
          {livestreamNoteText ? (
            <MarkdownText content={livestreamNoteText} className="subtle-note" />
          ) : null}
        </div>
      ) : (
        <article className="form-card tribute-media-empty">
          <h3>Live stream link not set</h3>
          <p>
            Add a YouTube or Vimeo live stream URL in the console when streaming is
            scheduled.
          </p>
        </article>
      )}
    </section>
  ) : null;

  return (
    <>
      {showLivestreamFirst ? livestreamSection : videoSection}
      {showLivestreamFirst ? videoSection : livestreamSection}
    </>
  );
}
