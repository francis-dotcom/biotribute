"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tributeThemePresets, type TributeRecord } from "@/data/tributes";

type TributeBuilderFormProps = {
  tribute: TributeRecord;
  storeConfigured: boolean;
};

type TimelineDraft = {
  year: string;
  title: string;
  copy: string;
};

type ContributorDraft = {
  label: string;
  name: string;
  copy: string;
};

type DraftPersistOverrides = {
  videoThumbnailUrls?: string[];
  activeVideoIndex?: number;
  servicePosterImageUrl?: string;
  livestreamDisplayMode?: "video" | "image-url" | "uploaded-image";
  livestreamThumbnailMode?: "url" | "upload";
  livestreamThumbnailUrlInput?: string;
  uploadedLivestreamThumbnailUrl?: string;
};

function hasStructuredTimeline(entries: TimelineDraft[]) {
  return entries.some((entry) => entry.year.trim() || entry.title.trim());
}

function toTimelineText(entries: TimelineDraft[]) {
  return entries
    .map((entry) => entry.copy.trim())
    .filter(Boolean)
    .join("\n\n");
}

function parseTimelineText(text: string): TimelineDraft[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((copy) => ({
      year: "",
      title: "",
      copy,
    }));
}

function countConfiguredVideos(
  videoUrls: string[],
  videoDescriptions: string[],
  videoThumbnailUrls: string[],
) {
  return [0, 1, 2].reduce((count, index) => {
    return videoUrls[index]?.trim() || videoDescriptions[index]?.trim() || videoThumbnailUrls[index]?.trim()
      ? count + 1
      : count;
  }, 0);
}

export function TributeBuilderForm({
  tribute,
  storeConfigured,
}: TributeBuilderFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showGallerySection, setShowGallerySection] = useState(tribute.showGallerySection);
  const [showServicePosterSection, setShowServicePosterSection] = useState(
    tribute.showServicePosterSection
  );
  const [showVideoSection, setShowVideoSection] = useState(tribute.showVideoSection);
  const [showLivestreamSection, setShowLivestreamSection] = useState(
    tribute.showLivestreamSection
  );
  const [heroImageUrl, setHeroImageUrl] = useState(tribute.heroImageUrl ?? "");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(tribute.backgroundImageUrl ?? "");
  const [servicePosterImageUrl, setServicePosterImageUrl] = useState(
    tribute.servicePosterImageUrl ?? ""
  );
  const [servicePosterTitle, setServicePosterTitle] = useState(
    tribute.servicePosterTitle ?? "Service Poster"
  );
  const [servicePosterNote, setServicePosterNote] = useState(tribute.servicePosterNote ?? "");
  const [uploadingServicePoster, setUploadingServicePoster] = useState(false);
  const servicePosterInputRef = useRef<HTMLInputElement | null>(null);
  const [videoUrls, setVideoUrls] = useState([
    tribute.videoUrls[0] ?? "",
    tribute.videoUrls[1] ?? "",
    tribute.videoUrls[2] ?? "",
  ]);
  const [videoDescriptions, setVideoDescriptions] = useState([
    tribute.videoDescriptions[0] ?? "",
    tribute.videoDescriptions[1] ?? "",
    tribute.videoDescriptions[2] ?? "",
  ]);
  const [videoThumbnailUrls, setVideoThumbnailUrls] = useState([
    tribute.videoThumbnailUrls[0] ?? "",
    tribute.videoThumbnailUrls[1] ?? "",
    tribute.videoThumbnailUrls[2] ?? "",
  ]);
  const [visibleVideoCount, setVisibleVideoCount] = useState(() =>
    Math.max(1, countConfiguredVideos(
      [tribute.videoUrls[0] ?? "", tribute.videoUrls[1] ?? "", tribute.videoUrls[2] ?? ""],
      [
        tribute.videoDescriptions[0] ?? "",
        tribute.videoDescriptions[1] ?? "",
        tribute.videoDescriptions[2] ?? "",
      ],
      [
        tribute.videoThumbnailUrls[0] ?? "",
        tribute.videoThumbnailUrls[1] ?? "",
        tribute.videoThumbnailUrls[2] ?? "",
      ],
    ))
  );
  const [activeVideoIndex, setActiveVideoIndex] = useState(tribute.activeVideoIndex ?? 0);
  const [videoNote, setVideoNote] = useState(tribute.videoNote ?? "");
  const [uploadingVideoThumbIndex, setUploadingVideoThumbIndex] = useState<number | null>(null);
  const videoThumbInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [livestreamUrl, setLivestreamUrl] = useState(tribute.livestreamUrl ?? "");
  const [livestreamDisplayMode, setLivestreamDisplayMode] = useState<
    "video" | "image-url" | "uploaded-image"
  >(
    tribute.livestreamDisplayMode ??
      (tribute.livestreamThumbnailUrl ? "image-url" : "video")
  );
  const [livestreamThumbnailMode, setLivestreamThumbnailMode] = useState<"url" | "upload">(
    tribute.livestreamDisplayMode === "uploaded-image" ? "upload" : "url"
  );
  const [livestreamThumbnailUrlInput, setLivestreamThumbnailUrlInput] = useState(
    tribute.livestreamThumbnailUrl ?? ""
  );
  const [uploadedLivestreamThumbnailUrl, setUploadedLivestreamThumbnailUrl] = useState(
    tribute.livestreamDisplayMode === "uploaded-image" ? tribute.livestreamThumbnailUrl ?? "" : ""
  );
  const [livestreamNote, setLivestreamNote] = useState(tribute.livestreamNote ?? "");
  const [uploadingLivestreamThumb, setUploadingLivestreamThumb] = useState(false);
  const livestreamThumbInputRef = useRef<HTMLInputElement | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineDraft[]>(
    tribute.timeline.length > 0
      ? tribute.timeline.map((entry) => ({
          year: entry.year,
          title: entry.title,
          copy: entry.copy,
        }))
      : [{ year: "", title: "", copy: "" }]
  );
  const [timelineMode, setTimelineMode] = useState<"milestones" | "text">(
    hasStructuredTimeline(
      tribute.timeline.length > 0
        ? tribute.timeline.map((entry) => ({
            year: entry.year,
            title: entry.title,
            copy: entry.copy,
          }))
        : [{ year: "", title: "", copy: "" }],
    )
      ? "milestones"
      : "text",
  );
  const [timelineText, setTimelineText] = useState(
    toTimelineText(
      tribute.timeline.length > 0
        ? tribute.timeline.map((entry) => ({
            year: entry.year,
            title: entry.title,
            copy: entry.copy,
          }))
        : [],
    ),
  );
  const [contributorEntries, setContributorEntries] = useState<ContributorDraft[]>(() => {
    const firstContributor = tribute.contributors[0];
    if (!firstContributor) {
      return [{ label: "", name: "", copy: "" }];
    }

    return [
      {
        label: firstContributor.label,
        name: firstContributor.name,
        copy: firstContributor.copy,
      },
    ];
  });

  useEffect(() => {
    function syncHeroImage(event: Event) {
      const customEvent = event as CustomEvent<{ imageUrl?: string }>;
      setHeroImageUrl(customEvent.detail?.imageUrl ?? "");
    }

    function syncBackgroundImage(event: Event) {
      const customEvent = event as CustomEvent<{ imageUrl?: string }>;
      setBackgroundImageUrl(customEvent.detail?.imageUrl ?? "");
    }

    window.addEventListener("biotribute:hero-image-updated", syncHeroImage);
    window.addEventListener("biotribute:background-image-updated", syncBackgroundImage);

    return () => {
      window.removeEventListener("biotribute:hero-image-updated", syncHeroImage);
      window.removeEventListener("biotribute:background-image-updated", syncBackgroundImage);
    };
  }, []);

  function updateTimelineEntry(
    index: number,
    field: keyof TimelineDraft,
    value: string
  ) {
    setTimelineEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    );
  }

  function addTimelineEntry() {
    setTimelineEntries((current) => [...current, { year: "", title: "", copy: "" }]);
  }

  function removeTimelineEntry(index: number) {
    setTimelineEntries((current) => {
      if (current.length <= 1) {
        return [{ year: "", title: "", copy: "" }];
      }
      return current.filter((_, entryIndex) => entryIndex !== index);
    });
  }

  function updateContributorEntry(
    index: number,
    field: keyof ContributorDraft,
    value: string
  ) {
    setContributorEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    );
  }

  function addContributorEntry() {
    setContributorEntries((current) =>
      current.length >= 8 ? current : [...current, { label: "", name: "", copy: "" }]
    );
  }

  function removeContributorEntry(index: number) {
    setContributorEntries((current) => {
      if (current.length <= 1) {
        return [{ label: "", name: "", copy: "" }];
      }
      return current.filter((_, entryIndex) => entryIndex !== index);
    });
  }

  async function persistDraft(formData: FormData, overrides?: DraftPersistOverrides) {
    const nextVideoThumbnailUrls = overrides?.videoThumbnailUrls ?? videoThumbnailUrls;
    const nextActiveVideoIndex = overrides?.activeVideoIndex ?? activeVideoIndex;
    const nextServicePosterImageUrl = overrides?.servicePosterImageUrl ?? servicePosterImageUrl;
    const nextLivestreamDisplayMode = overrides?.livestreamDisplayMode ?? livestreamDisplayMode;
    const nextLivestreamThumbnailMode = overrides?.livestreamThumbnailMode ?? livestreamThumbnailMode;
    const nextLivestreamThumbnailUrlInput =
      overrides?.livestreamThumbnailUrlInput ?? livestreamThumbnailUrlInput;
    const nextUploadedLivestreamThumbnailUrl =
      overrides?.uploadedLivestreamThumbnailUrl ?? uploadedLivestreamThumbnailUrl;
    const rawLivestreamValue = livestreamUrl.trim();
    const livestreamValue =
      nextLivestreamDisplayMode === "video" ? rawLivestreamValue : "";
    const livestreamThumbnailUrl =
      nextLivestreamThumbnailMode === "upload"
        ? nextUploadedLivestreamThumbnailUrl.trim()
        : nextLivestreamThumbnailUrlInput.trim();
    const payload = {
      slug: tribute.slug,
      name: String(formData.get("name") ?? ""),
      honorificTitle: String(formData.get("honorificTitle") ?? ""),
      positionTitle: String(formData.get("positionTitle") ?? ""),
      years: String(formData.get("years") ?? ""),
      tagline: String(formData.get("tagline") ?? ""),
      organizer: String(formData.get("organizer") ?? ""),
      theme: String(formData.get("theme") ?? tribute.theme),
      heroImageUrl: heroImageUrl.trim(),
      backgroundImageUrl: backgroundImageUrl.trim(),
      galleryIntro: String(formData.get("galleryIntro") ?? ""),
      galleryNote: String(formData.get("galleryNote") ?? ""),
      servicePosterImageUrl: nextServicePosterImageUrl.trim(),
      servicePosterTitle: servicePosterTitle.trim(),
      servicePosterNote: servicePosterNote.trim(),
      lifeStory: String(formData.get("lifeStory") ?? ""),
      supportNote: String(formData.get("supportNote") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      donationAccountName: String(formData.get("donationAccountName") ?? ""),
      donationAccountNumber: String(formData.get("donationAccountNumber") ?? ""),
      donationBankName: String(formData.get("donationBankName") ?? ""),
      donationPhone: String(formData.get("donationPhone") ?? ""),
      videoUrls: videoUrls.map((value) => value.trim()).filter(Boolean),
      videoDescriptions: videoDescriptions.map((value) => value.trim()),
      videoThumbnailUrls: nextVideoThumbnailUrls.map((value) => value.trim()),
      activeVideoIndex: nextActiveVideoIndex,
      videoNote: videoNote.trim(),
      livestreamUrl: livestreamValue,
      livestreamThumbnailUrl:
        nextLivestreamDisplayMode === "video"
          ? livestreamThumbnailUrl
          : nextLivestreamDisplayMode === "uploaded-image"
            ? nextUploadedLivestreamThumbnailUrl.trim()
            : nextLivestreamThumbnailUrlInput.trim(),
      livestreamDisplayMode: nextLivestreamDisplayMode,
      livestreamNote: livestreamNote.trim(),
      showGallerySection,
      showServicePosterSection,
      showVideoSection,
      showLivestreamSection,
      timeline:
        timelineMode === "text"
          ? parseTimelineText(timelineText)
          : timelineEntries
              .map((entry) => ({
                year: entry.year.trim(),
                title: entry.title.trim(),
                copy: entry.copy.trim(),
              }))
              .filter((entry) => entry.year || entry.title || entry.copy),
      contributors: contributorEntries
        .map((entry) => ({
          label: entry.label.trim(),
          name: entry.name.trim(),
          copy: entry.copy.trim(),
        }))
        .filter((entry) => entry.label || entry.name || entry.copy)
        .map((entry) => ({
          label: entry.label || "Loved One",
          name: entry.name || "Family Member",
          copy: entry.copy || "Shared in loving memory.",
        })),
      supportAmounts: tribute.supportAmounts.map((amount, index) => ({
        label: String(formData.get(`supportLabel-${index}`) ?? amount.label),
        featured: formData.get(`supportFeatured-${index}`) === "on",
      })),
    };
    const requestPayload = livestreamValue ? payload : { ...payload, livestreamUrl: undefined };
    const response = await fetch(`/api/tributes/${tribute.slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    return { response, data };
  }

  async function handleSubmit(formData: FormData) {
    if (!storeConfigured) {
      setStatus("Supabase content storage is not configured yet.");
      return;
    }

    setPending(true);
    setStatus(null);

    const { response, data } = await persistDraft(formData);

    setPending(false);
    setStatus(data.message ?? data.error ?? "Unable to save tribute.");

    if (response.ok) {
      router.refresh();
    }
  }

  async function uploadServicePoster(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploadingServicePoster(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("kind", "service-poster");
    formData.append("files", files[0]);

    const response = await fetch(`/api/tributes/${tribute.slug}/images`, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      uploads?: { imageUrl: string }[];
    };

    if (!response.ok) {
      setStatus(data.error ?? "Unable to upload service poster.");
      setUploadingServicePoster(false);
      return;
    }

    const uploadedUrl = data.uploads?.[0]?.imageUrl ?? "";
    if (uploadedUrl) {
      setServicePosterImageUrl(uploadedUrl);

      if (formRef.current && storeConfigured) {
        const { response: persistResponse, data: persistData } = await persistDraft(
          new FormData(formRef.current),
          {
            servicePosterImageUrl: uploadedUrl,
          },
        );
        if (!persistResponse.ok) {
          setStatus(persistData.error ?? "Service poster uploaded, but auto-save failed.");
          setUploadingServicePoster(false);
          return;
        }
      }
    }

    setStatus(data.message ?? "Service poster uploaded and saved.");
    setUploadingServicePoster(false);
  }

  async function uploadLivestreamThumbnail(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploadingLivestreamThumb(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("kind", "livestream-thumb");
    formData.append("files", files[0]);

    const response = await fetch(`/api/tributes/${tribute.slug}/images`, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      uploads?: { imageUrl: string }[];
    };

    if (!response.ok) {
      setStatus(data.error ?? "Unable to upload thumbnail image.");
      setUploadingLivestreamThumb(false);
      return;
    }

    const uploadedUrl = data.uploads?.[0]?.imageUrl ?? "";
    if (uploadedUrl) {
      setUploadedLivestreamThumbnailUrl(uploadedUrl);
      setLivestreamDisplayMode("uploaded-image");
      setLivestreamThumbnailMode("upload");

      if (formRef.current && storeConfigured) {
        const { response: persistResponse, data: persistData } = await persistDraft(
          new FormData(formRef.current),
          {
            livestreamDisplayMode: "uploaded-image",
            livestreamThumbnailMode: "upload",
            uploadedLivestreamThumbnailUrl: uploadedUrl,
          },
        );
        if (!persistResponse.ok) {
          setStatus(persistData.error ?? "Thumbnail uploaded, but auto-save failed.");
          setUploadingLivestreamThumb(false);
          return;
        }
      }
    }

    setStatus(data.message ?? "Thumbnail uploaded and saved.");
    setUploadingLivestreamThumb(false);
  }

  async function uploadVideoThumbnail(index: number, files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploadingVideoThumbIndex(index);
    setStatus(null);

    const formData = new FormData();
    formData.append("kind", "video-thumb");
    formData.append("files", files[0]);

    const response = await fetch(`/api/tributes/${tribute.slug}/images`, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      uploads?: { imageUrl: string }[];
    };

    if (!response.ok) {
      setStatus(data.error ?? "Unable to upload video placeholder image.");
      setUploadingVideoThumbIndex(null);
      return;
    }

    const uploadedUrl = data.uploads?.[0]?.imageUrl ?? "";
    if (uploadedUrl) {
      const nextVideoThumbnailUrls = videoThumbnailUrls.map((value, currentIndex) =>
        currentIndex === index ? uploadedUrl : value
      );
      setVideoThumbnailUrls(nextVideoThumbnailUrls);
      setActiveVideoIndex(index);

      if (formRef.current && storeConfigured) {
        const { response: persistResponse, data: persistData } = await persistDraft(
          new FormData(formRef.current),
          {
            videoThumbnailUrls: nextVideoThumbnailUrls,
            activeVideoIndex: index,
          },
        );
        if (!persistResponse.ok) {
          setStatus(persistData.error ?? "Video placeholder uploaded, but auto-save failed.");
          setUploadingVideoThumbIndex(null);
          return;
        }
      }
    }

    setStatus(data.message ?? "Video placeholder uploaded and saved.");
    setUploadingVideoThumbIndex(null);
  }

  return (
    <form
      ref={formRef}
      className="dashboard-section"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <article className="form-card dashboard-section-header">
        <p className="card-label">Page Builder</p>
        <h2>Build and prepare this tribute page</h2>
        <p className="subtle-note">
          This is the single-owner working page for now. It brings content, images,
          timeline, and launch actions into one place so you can prepare the public
          tribute efficiently.
        </p>
        {status ? <p className="form-status">{status}</p> : null}
      </article>

      <div className="builder-grid">
        <article className="form-card">
          <p className="card-label">Core Identity</p>
          <h3>Name, title, position, and tribute line</h3>
          <label className="field-block">
            <span>Name</span>
            <input name="name" type="text" defaultValue={tribute.name} />
          </label>
          <label className="field-block">
            <span>Title</span>
            <input
              name="honorificTitle"
              type="text"
              defaultValue={tribute.honorificTitle ?? ""}
              placeholder="Chief, Dr., Pastor, Sir..."
            />
          </label>
          <label className="field-block">
            <span>Position</span>
            <input
              name="positionTitle"
              type="text"
              defaultValue={tribute.positionTitle ?? ""}
              placeholder="Chairman, Elder, Community Leader..."
            />
          </label>
          <label className="field-block">
            <span>Years</span>
            <input name="years" type="text" defaultValue={tribute.years} />
          </label>
          <label className="field-block">
            <span>Tagline</span>
            <input name="tagline" type="text" defaultValue={tribute.tagline} />
          </label>
          <label className="field-block">
            <span>Organizer</span>
            <input name="organizer" type="text" defaultValue={tribute.organizer} />
          </label>
          <label className="field-block">
            <span>Theme</span>
            <select name="theme" defaultValue={tribute.theme}>
              {tributeThemePresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </article>

        <article className="form-card">
          <p className="card-label">Launch State</p>
          <h3>Post and publish</h3>
          <p className="subtle-note">
            Use this section to prepare the tribute for public launch. Publishing
            persistence is the next backend step.
          </p>
          <div className="builder-status-stack">
            <div className="dashboard-info-banner">
              Public route: <strong>/{tribute.slug}</strong>
            </div>
            <div className="dashboard-info-banner">
              Messages remain moderated even after the page is public.
            </div>
          </div>
          <div className="builder-actions">
            <button className="button-primary button-save-draft" type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Draft"}
            </button>
            <a
              className="button-secondary"
              href={`/${tribute.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Public Page
            </a>
          </div>
        </article>
      </div>

      <div className="dashboard-image-grid">
        <article className="form-card">
          <p className="card-label">Hero Portrait</p>
          <h3>Main photo</h3>
          <label className="field-block">
            <span>Hero image URL</span>
            <input
              name="heroImageUrl"
              type="text"
              value={heroImageUrl}
              onChange={(event) => setHeroImageUrl(event.currentTarget.value)}
            />
          </label>
          <div className="field-block">
            <span>Upload hero photo</span>
            <a className="button-secondary" href="#images">
              Open Images tab
            </a>
          </div>
        </article>

        <article className="form-card">
          <p className="card-label">Background Image</p>
          <h3>Soft backdrop</h3>
          <label className="field-block">
            <span>Background image URL</span>
            <input
              name="backgroundImageUrl"
              type="text"
              value={backgroundImageUrl}
              onChange={(event) => setBackgroundImageUrl(event.currentTarget.value)}
            />
          </label>
          <div className="field-block">
            <span>Upload background image</span>
            <a className="button-secondary" href="#images">
              Open Images tab
            </a>
          </div>
        </article>
      </div>

      <article className="form-card">
        <p className="card-label">Life Story</p>
        <h3>Main biography</h3>
        <label className="field-block">
          <span>Life story content</span>
          <textarea name="lifeStory" defaultValue={tribute.lifeStory.join("\n\n")} />
        </label>
      </article>

      <article className="form-card">
        <p className="card-label">Timeline</p>
        <h3>Milestones and key memories</h3>
        <div className="builder-inline-actions">
          <button
            className="button-secondary"
            type="button"
            aria-pressed={timelineMode === "text"}
            onClick={() => {
              setTimelineMode("text");
              setTimelineText((current) => current || toTimelineText(timelineEntries));
            }}
          >
            Simple text mode
          </button>
          <button
            className="button-secondary"
            type="button"
            aria-pressed={timelineMode === "milestones"}
            onClick={() => {
              setTimelineMode("milestones");
              setTimelineEntries((current) => {
                if (current.some((entry) => entry.year || entry.title || entry.copy)) {
                  return current;
                }
                const parsed = parseTimelineText(timelineText);
                return parsed.length > 0 ? parsed : [{ year: "", title: "", copy: "" }];
              });
            }}
          >
            Milestone mode
          </button>
        </div>
        {timelineMode === "text" ? (
          <label className="field-block">
            <span>Timeline text</span>
            <textarea
              name="timelineText"
              value={timelineText}
              onChange={(event) => setTimelineText(event.currentTarget.value)}
              placeholder="Write memories freely. Separate entries with a blank line."
            />
          </label>
        ) : (
          <>
            <div className="builder-repeat-grid">
              {timelineEntries.map((entry, index) => (
                <div className="builder-repeat-card" key={`timeline-entry-${index}`}>
                  <label className="field-block">
                    <span>Year {index + 1}</span>
                    <input
                      name={`timelineYear-${index}`}
                      type="text"
                      value={entry.year}
                      onChange={(event) =>
                        updateTimelineEntry(index, "year", event.currentTarget.value)
                      }
                    />
                  </label>
                  <label className="field-block">
                    <span>Title</span>
                    <input
                      name={`timelineTitle-${index}`}
                      type="text"
                      value={entry.title}
                      onChange={(event) =>
                        updateTimelineEntry(index, "title", event.currentTarget.value)
                      }
                    />
                  </label>
                  <label className="field-block">
                    <span>Story</span>
                    <textarea
                      name={`timelineCopy-${index}`}
                      value={entry.copy}
                      onChange={(event) =>
                        updateTimelineEntry(index, "copy", event.currentTarget.value)
                      }
                    />
                  </label>
                  <div className="builder-inline-actions">
                    <button
                      className="button-secondary dashboard-danger-button"
                      type="button"
                      onClick={() => removeTimelineEntry(index)}
                    >
                      Remove milestone
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="builder-inline-actions">
              <button className="button-secondary" type="button" onClick={addTimelineEntry}>
                Add milestone
              </button>
            </div>
          </>
        )}
      </article>

      <article className="form-card">
        <p className="card-label">Public Section Visibility</p>
        <h3>Control what appears on the tribute page</h3>
        <div className="builder-chip-list builder-visibility-chips" aria-live="polite">
          <span className={showGallerySection ? "builder-visibility-chip is-on" : "builder-visibility-chip is-off"}>
            Photos: {showGallerySection ? "ON" : "OFF"}
          </span>
          <span
            className={
              showServicePosterSection
                ? "builder-visibility-chip is-on"
                : "builder-visibility-chip is-off"
            }
          >
            Poster: {showServicePosterSection ? "ON" : "OFF"}
          </span>
          <span className={showVideoSection ? "builder-visibility-chip is-on" : "builder-visibility-chip is-off"}>
            Videos: {showVideoSection ? "ON" : "OFF"}
          </span>
          <span className={showLivestreamSection ? "builder-visibility-chip is-on" : "builder-visibility-chip is-off"}>
            Live Stream: {showLivestreamSection ? "ON" : "OFF"}
          </span>
        </div>
        <label className="field-block builder-checkbox">
          <input
            name="showGallerySection"
            type="checkbox"
            checked={showGallerySection}
            onChange={(event) => setShowGallerySection(event.currentTarget.checked)}
          />
          <span>Show Photo section on public page</span>
        </label>
        <label className="field-block builder-checkbox">
          <input
            name="showServicePosterSection"
            type="checkbox"
            checked={showServicePosterSection}
            onChange={(event) => setShowServicePosterSection(event.currentTarget.checked)}
          />
          <span>Show Service Poster section on public page</span>
        </label>
        <label className="field-block builder-checkbox">
          <input
            name="showVideoSection"
            type="checkbox"
            checked={showVideoSection}
            onChange={(event) => setShowVideoSection(event.currentTarget.checked)}
          />
          <span>Show Video section on public page</span>
        </label>
        <label className="field-block builder-checkbox">
          <input
            name="showLivestreamSection"
            type="checkbox"
            checked={showLivestreamSection}
            onChange={(event) => setShowLivestreamSection(event.currentTarget.checked)}
          />
          <span>Show Live Stream section on public page</span>
        </label>
      </article>

      <article className="form-card">
        <p className="card-label">Gallery</p>
        <h3>Photo memory uploads</h3>
        <div className="field-block">
          <span>Upload gallery images</span>
          <a className="button-secondary" href="#images">
            Open Images tab
          </a>
        </div>
        <label className="field-block">
          <span>Gallery intro text</span>
          <textarea name="galleryIntro" defaultValue={tribute.galleryIntro ?? ""} />
        </label>
        <label className="field-block">
          <span>Empty state note</span>
          <textarea name="galleryNote" defaultValue={tribute.galleryNote} />
        </label>
      </article>

      <article className="form-card" id="service-poster">
        <p className="card-label">Service Poster</p>
        <h3>Funeral program poster</h3>
        <div className="field-block">
          <span>Upload service poster image</span>
          <input
            ref={servicePosterInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => {
              void uploadServicePoster(event.currentTarget.files);
            }}
          />
          <p className="subtle-note">
            {uploadingServicePoster
              ? "Uploading service poster..."
              : servicePosterImageUrl.trim()
                ? "Poster uploaded. Save Draft to keep title, note, and visibility changes."
                : "Upload one poster image for funeral program details."}
          </p>
        </div>
        {servicePosterImageUrl.trim() ? (
          <div className="field-block">
            <span>Saved service poster preview</span>
            <img
              src={servicePosterImageUrl.trim()}
              alt="Service poster preview"
              className="builder-livestream-preview"
            />
          </div>
        ) : null}
        <label className="field-block">
          <span>Section title</span>
          <input
            name="servicePosterTitle"
            type="text"
            value={servicePosterTitle}
            onChange={(event) => setServicePosterTitle(event.currentTarget.value)}
            placeholder="Service Poster"
          />
        </label>
        <label className="field-block">
          <span>Section note (optional)</span>
          <textarea
            name="servicePosterNote"
            value={servicePosterNote}
            onChange={(event) => setServicePosterNote(event.currentTarget.value)}
            placeholder="Optional context shown under the poster."
          />
        </label>
        <div className="builder-inline-actions">
          <button
            className="button-secondary dashboard-danger-button"
            type="button"
            onClick={() => {
              setServicePosterImageUrl("");
              if (servicePosterInputRef.current) {
                servicePosterInputRef.current.value = "";
              }
            }}
          >
            Delete Service Poster
          </button>
        </div>
      </article>

      <article className="form-card" id="media">
        <p className="card-label">Videos</p>
        <h3>Video uploads and playback</h3>
        <p className="subtle-note">Add up to 3 video links for Video Memories.</p>
        <p className="subtle-note">After deleting a video link, click Save Draft to publish the removal.</p>
        <div className="builder-repeat-grid">
          {[0, 1, 2].slice(0, visibleVideoCount).map((index) => (
            <div className="builder-repeat-card" key={`video-memory-${index}`}>
              <label className="field-block">
                <span>{`Video ${index + 1} URL`}</span>
                <input
                  name={`videoUrl-${index}`}
                  type="url"
                  value={videoUrls[index] ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setVideoUrls((current) => {
                      const next = [...current];
                      next[index] = nextValue;
                      return next;
                    });
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
              <label className="field-block">
                <span>{`Video ${index + 1} Description`}</span>
                <input
                  name={`videoDescription-${index}`}
                  type="text"
                  value={videoDescriptions[index] ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setVideoDescriptions((current) => {
                      const next = [...current];
                      next[index] = nextValue;
                      return next;
                    });
                  }}
                  placeholder={`Short description for video ${index + 1}`}
                />
              </label>
              <div className="field-block">
                <span>{`Upload Video ${index + 1} placeholder image`}</span>
                <input
                  ref={(node) => {
                    videoThumbInputRefs.current[index] = node;
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={(event) => {
                    void uploadVideoThumbnail(index, event.currentTarget.files);
                  }}
                />
                <p className="subtle-note">
                  {uploadingVideoThumbIndex === index
                    ? "Uploading video placeholder..."
                    : (videoThumbnailUrls[index] ?? "").trim()
                      ? `Video ${index + 1} placeholder saved. Save Draft to apply it.`
                      : `Upload an image to use as the Video ${index + 1} placeholder.`}
                </p>
              </div>
              {(videoUrls[index] ?? "").trim() ? (
                <label className="field-block builder-checkbox">
                  <input
                    type="checkbox"
                    checked={activeVideoIndex === index}
                    onChange={() => setActiveVideoIndex(index)}
                  />
                  <span>{`Display Video ${index + 1} on the public page`}</span>
                </label>
              ) : null}
              {(videoThumbnailUrls[index] ?? "").trim() ? (
                <div className="field-block">
                  <span>{`Saved Video ${index + 1} placeholder`}</span>
                  <img
                    src={(videoThumbnailUrls[index] ?? "").trim()}
                    alt={`Video ${index + 1} placeholder preview`}
                    className="builder-livestream-preview"
                  />
                </div>
              ) : null}
              <div className="builder-inline-actions">
                <button
                  className="button-secondary dashboard-danger-button"
                  type="button"
                  onClick={() => {
                    setVideoUrls((current) =>
                      current.map((value, currentIndex) => (currentIndex === index ? "" : value))
                    );
                    setVideoDescriptions((current) =>
                      current.map((value, currentIndex) => (currentIndex === index ? "" : value))
                    );
                    setVideoThumbnailUrls((current) =>
                      current.map((value, currentIndex) => (currentIndex === index ? "" : value))
                    );
                    if (activeVideoIndex === index) {
                      setActiveVideoIndex(0);
                    }
                    if (videoThumbInputRefs.current[index]) {
                      videoThumbInputRefs.current[index].value = "";
                    }
                    const remainingConfiguredCount = countConfiguredVideos(
                      videoUrls.map((value, currentIndex) => (currentIndex === index ? "" : value)),
                      videoDescriptions.map((value, currentIndex) =>
                        currentIndex === index ? "" : value
                      ),
                      videoThumbnailUrls.map((value, currentIndex) =>
                        currentIndex === index ? "" : value
                      ),
                    );
                    setVisibleVideoCount(Math.max(1, Math.min(visibleVideoCount, remainingConfiguredCount + 1)));
                  }}
                >
                  {`Delete Video ${index + 1}`}
                </button>
              </div>
            </div>
          ))}
        </div>
        {visibleVideoCount < 3 ? (
          <div className="builder-inline-actions">
            <button
              className="button-secondary"
              type="button"
              onClick={() => setVisibleVideoCount((current) => Math.min(current + 1, 3))}
            >
              {`Add Video ${visibleVideoCount + 1}`}
            </button>
          </div>
        ) : null}
        {visibleVideoCount > 1 ? (
          <div className="builder-inline-actions">
            <button
              className="button-secondary"
              type="button"
              onClick={() => setVisibleVideoCount((current) => Math.max(current - 1, 1))}
            >
              Load less videos
            </button>
          </div>
        ) : null}
        <label className="field-block">
          <span>Video section note</span>
          <textarea
            name="videoNote"
            value={videoNote}
            onChange={(event) => setVideoNote(event.currentTarget.value)}
            placeholder="Optional note shown under the video section"
          />
        </label>
      </article>

      <article className="form-card">
        <p className="card-label">Live Stream</p>
        <h3>Memorial stream embed</h3>
        <p className="subtle-note">After deleting the stream, click Save Draft to publish the removal.</p>
        <label className="field-block">
          <span>Livestream URL (YouTube or Vimeo preferred)</span>
          <input
            name="livestreamUrl"
            type="url"
            value={livestreamUrl}
            onChange={(event) => setLivestreamUrl(event.currentTarget.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>
        <div className="field-block">
          <span>Saved video URL</span>
          {livestreamUrl.trim() ? (
            <label className="builder-checkbox">
              <input
                type="checkbox"
                checked={livestreamDisplayMode === "video"}
                onChange={() => setLivestreamDisplayMode("video")}
              />
              <span>Display this video URL on the tribute page</span>
            </label>
          ) : (
            <p className="subtle-note">Paste a livestream URL above, then save it and select it here.</p>
          )}
          {livestreamUrl.trim() ? <p className="subtle-note">{livestreamUrl.trim()}</p> : null}
        </div>
        <label className="field-block">
          <span>Livestream thumbnail image URL (optional)</span>
          <input
            name="livestreamThumbnailUrl"
            type="url"
            value={livestreamThumbnailUrlInput}
            onChange={(event) => {
              setLivestreamThumbnailUrlInput(event.currentTarget.value);
              setLivestreamThumbnailMode("url");
            }}
            placeholder="https://example.com/livestream-thumbnail.jpg"
          />
        </label>
        {livestreamThumbnailUrlInput.trim() ? (
          <div className="field-block">
            <span>Saved image URL</span>
            <label className="builder-checkbox">
              <input
                type="checkbox"
                checked={livestreamDisplayMode === "image-url"}
                onChange={() => {
                  setLivestreamDisplayMode("image-url");
                  setLivestreamThumbnailMode("url");
                }}
              />
              <span>Display this image URL on the tribute page</span>
            </label>
            <p className="subtle-note">{livestreamThumbnailUrlInput.trim()}</p>
          </div>
        ) : null}
        <div className="field-block">
          <span>Upload livestream thumbnail image</span>
          <input
            ref={livestreamThumbInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => {
              void uploadLivestreamThumbnail(event.currentTarget.files);
            }}
          />
          <p className="subtle-note">
            {uploadingLivestreamThumb
              ? "Uploading livestream thumbnail..."
              : uploadedLivestreamThumbnailUrl
                ? "Uploaded image saved. Select it below if you want to display it."
                : "Upload one image, then save it and select it below."}
          </p>
        </div>
        {uploadedLivestreamThumbnailUrl.trim() ? (
          <div className="field-block">
            <span>Saved uploaded image</span>
            <label className="builder-checkbox">
              <input
                type="checkbox"
                checked={livestreamDisplayMode === "uploaded-image"}
                onChange={() => {
                  setLivestreamDisplayMode("uploaded-image");
                  setLivestreamThumbnailMode("upload");
                }}
              />
              <span>Display this uploaded image on the tribute page</span>
            </label>
            <img
              src={uploadedLivestreamThumbnailUrl.trim()}
              alt="Uploaded livestream thumbnail preview"
              className="builder-livestream-preview"
            />
          </div>
        ) : null}
        <p className="subtle-note">Only one checkbox can control what is displayed at a time.</p>
        <label className="field-block">
          <span>Livestream note</span>
          <input
            name="livestreamNote"
            type="text"
            value={livestreamNote}
            onChange={(event) => setLivestreamNote(event.currentTarget.value)}
            placeholder="Optional schedule or viewing note"
          />
        </label>
        <div className="builder-inline-actions">
          <button
            className="button-secondary dashboard-danger-button"
            type="button"
            onClick={() => {
              setLivestreamUrl("");
              setLivestreamThumbnailUrlInput("");
              setUploadedLivestreamThumbnailUrl("");
              setLivestreamDisplayMode("video");
              setLivestreamThumbnailMode("url");
              setLivestreamNote("");
              if (livestreamThumbInputRef.current) {
                livestreamThumbInputRef.current.value = "";
              }
            }}
          >
            Delete Live Stream
          </button>
        </div>
      </article>

      <article className="form-card">
        <p className="card-label">Special Tributes</p>
        <h3>8 featured messages from family and loved ones</h3>
        <p className="subtle-note">
          Add as many as you need, then load more cards. Maximum: 8 cards.
        </p>
        <div className="builder-repeat-grid">
          {contributorEntries.map((contributor, index) => (
            <div className="builder-repeat-card" key={`contributor-card-${index}`}>
              <label className="field-block">
                <span>Label</span>
                <input
                  name={`contributorLabel-${index}`}
                  type="text"
                  value={contributor.label}
                  onChange={(event) =>
                    updateContributorEntry(index, "label", event.currentTarget.value)
                  }
                  placeholder="Family Representative"
                />
              </label>
              <label className="field-block">
                <span>Name</span>
                <input
                  name={`contributorName-${index}`}
                  type="text"
                  value={contributor.name}
                  onChange={(event) =>
                    updateContributorEntry(index, "name", event.currentTarget.value)
                  }
                  placeholder="Name"
                />
              </label>
              <label className="field-block">
                <span>Message</span>
                <textarea
                  name={`contributorCopy-${index}`}
                  value={contributor.copy}
                  onChange={(event) =>
                    updateContributorEntry(index, "copy", event.currentTarget.value)
                  }
                  placeholder="Write a tribute message from this loved one..."
                />
              </label>
              <div className="builder-inline-actions">
                <button
                  className="button-secondary dashboard-danger-button"
                  type="button"
                  onClick={() => removeContributorEntry(index)}
                >
                  Remove card
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="builder-inline-actions">
          <button
            className="button-secondary"
            type="button"
            onClick={addContributorEntry}
            disabled={contributorEntries.length >= 8}
          >
            {contributorEntries.length >= 8 ? "Maximum cards reached" : "Load more cards"}
          </button>
          <span className="subtle-note">{contributorEntries.length}/8 cards in use</span>
        </div>
      </article>

      <article className="form-card">
        <p className="card-label">Support Section</p>
        <h3>Contribution options</h3>
        <div className="builder-repeat-grid">
          {tribute.supportAmounts.map((amount, index) => (
            <div className="builder-repeat-card" key={amount.label}>
              <label className="field-block">
                <span>Label</span>
                <input
                  name={`supportLabel-${index}`}
                  type="text"
                  defaultValue={amount.label}
                />
              </label>
              <label className="field-block builder-checkbox">
                <input
                  name={`supportFeatured-${index}`}
                  type="checkbox"
                  defaultChecked={Boolean(amount.featured)}
                />
                <span>Featured amount</span>
              </label>
            </div>
          ))}
        </div>
        <label className="field-block">
          <span>Tribute card note</span>
          <input
            name="supportNote"
            type="text"
            defaultValue={tribute.supportNote ?? ""}
            placeholder="Explain your tribute card offer"
          />
        </label>
        <label className="field-block">
          <span>Family contact email</span>
          <input
            name="contactEmail"
            type="email"
            defaultValue={tribute.contactEmail ?? ""}
            placeholder="family@example.com"
          />
        </label>
        <label className="field-block">
          <span>Donation account name</span>
          <input
            name="donationAccountName"
            type="text"
            defaultValue={tribute.donationAccountName ?? ""}
            placeholder="Account holder name"
          />
        </label>
        <label className="field-block">
          <span>Donation account number</span>
          <input
            name="donationAccountNumber"
            type="text"
            defaultValue={tribute.donationAccountNumber ?? ""}
            placeholder="Account number"
          />
        </label>
        <label className="field-block">
          <span>Donation bank</span>
          <input
            name="donationBankName"
            type="text"
            defaultValue={tribute.donationBankName ?? ""}
            placeholder="Bank name"
          />
        </label>
        <label className="field-block">
          <span>Donation phone / text line</span>
          <input
            name="donationPhone"
            type="text"
            defaultValue={tribute.donationPhone ?? ""}
            placeholder="+1 555 000 0000"
          />
        </label>
      </article>
    </form>
  );
}
