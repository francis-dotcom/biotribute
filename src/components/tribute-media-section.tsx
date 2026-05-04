"use client";

import { useMemo, useState } from "react";
import type { TributeRecord } from "@/data/tributes";

type TributeMediaSectionProps = {
  videoUrls: TributeRecord["videoUrls"];
  videoDescriptions: TributeRecord["videoDescriptions"];
  videoNote?: string;
  livestreamUrl?: string;
  livestreamThumbnailUrl?: string;
  livestreamNote?: string;
  showVideoSection: boolean;
  showLivestreamSection: boolean;
};

type MediaEmbed =
  | { type: "video"; src: string; thumbnail?: string | null; label: string; description?: string }
  | { type: "iframe"; src: string; thumbnail?: string | null; label: string; description?: string }
  | { type: "link"; src: string; thumbnail?: string | null; label: string; description?: string };

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
          src: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          label: `Video Memory ${index + 1}`,
        };
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const maybeId = segments[segments.length - 1] ?? "";
      if (maybeId) {
        return {
          type: "iframe",
          src: `https://player.vimeo.com/video/${maybeId}`,
          thumbnail: null,
          label: `Video Memory ${index + 1}`,
        };
      }
    }

    if (parsed.pathname.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        type: "video",
        src: normalized,
        thumbnail: null,
        label: `Video Memory ${index + 1}`,
      };
    }

    return {
      type: "link",
      src: normalized,
      thumbnail: null,
      label: `Video Memory ${index + 1}`,
    };
  } catch {
    if (/^https?:\/\//i.test(normalized)) {
      return {
        type: "link",
        src: normalized,
        thumbnail: null,
        label: `Video Memory ${index + 1}`,
      };
    }
    return null;
  }
}

function renderMedia(embed: MediaEmbed, title: string) {
  if (embed.type === "video") {
    return (
      <video className="tribute-media-frame" controls preload="metadata">
        <source src={embed.src} />
      </video>
    );
  }

  if (embed.type === "iframe") {
    return (
      <iframe
        className="tribute-media-frame"
        src={embed.src}
        title={title}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <a className="button-primary" href={embed.src} target="_blank" rel="noreferrer">
      Open Video Link
    </a>
  );
}

export function TributeMediaSection({
  videoUrls,
  videoDescriptions,
  videoNote,
  livestreamUrl,
  livestreamThumbnailUrl,
  livestreamNote,
  showVideoSection,
  showLivestreamSection,
}: TributeMediaSectionProps) {
  const [activeEmbed, setActiveEmbed] = useState<MediaEmbed | null>(null);

  const mediaEmbeds = useMemo(
    () =>
      videoUrls
        .map((url, index) => {
          const embed = toEmbedUrl(url, index);
          if (!embed) return null;
          return {
            ...embed,
            description: videoDescriptions[index]?.trim() || undefined,
          } as MediaEmbed;
        })
        .filter(Boolean) as MediaEmbed[],
    [videoUrls, videoDescriptions]
  );

  const streamEmbed = useMemo(() => toEmbedUrl(livestreamUrl ?? "", 0), [livestreamUrl]);
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
        <div
          className={`tribute-media-grid tribute-media-grid-count-${Math.min(
            mediaEmbeds.length,
            3,
          )}`}
        >
          {mediaEmbeds.map((embed, index) => (
            <button
              className="tribute-media-thumb"
              key={`${embed.src}-${index}`}
              type="button"
              onClick={() => setActiveEmbed(embed)}
            >
              <div
                className={`tribute-media-thumb-image${embed.thumbnail ? " has-image" : ""}`}
                style={embed.thumbnail ? { backgroundImage: `url("${embed.thumbnail}")` } : undefined}
              >
                <span className="tribute-media-play">Play</span>
              </div>
              <div className="tribute-media-thumb-copy">
                <p>{embed.description ?? "Tap to watch this tribute memory."}</p>
              </div>
            </button>
          ))}
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

      {videoNote?.trim() ? <p className="subtle-note">{videoNote}</p> : null}
    </section>
  ) : null;

  const livestreamSection = showLivestreamSection ? (
    <section className="content-section">
      <p className="section-kicker">Live Memorial</p>
      <h2>Live Stream</h2>
      <span className="section-accent" />

      {streamEmbed || livestreamThumbnailUrl?.trim() ? (
        <div className="tribute-stream-card">
          {livestreamThumbnailUrl?.trim() ? (
            <div
              className="tribute-stream-thumbnail"
              style={{ backgroundImage: `url("${livestreamThumbnailUrl}")` }}
            />
          ) : null}
          {streamEmbed ? (
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
              <video className="tribute-stream-frame" controls preload="metadata">
                <source src={streamEmbed.src} />
              </video>
            ) : (
              <a className="button-primary tribute-media-link" href={streamEmbed.src} target="_blank" rel="noreferrer">
                Open livestream
              </a>
            )
          ) : null}
          {livestreamNote?.trim() ? <p className="subtle-note">{livestreamNote}</p> : null}
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

      {activeEmbed ? (
        <div
          className="message-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-memory-modal-title"
          onClick={() => setActiveEmbed(null)}
        >
          <div className="message-modal-card tribute-media-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Video Memory</p>
                <h3 id="video-memory-modal-title">{activeEmbed.label}</h3>
              </div>
              <button className="message-modal-close" type="button" onClick={() => setActiveEmbed(null)}>
                Close
              </button>
            </div>
            {renderMedia(activeEmbed, activeEmbed.label)}
          </div>
        </div>
      ) : null}
    </>
  );
}
