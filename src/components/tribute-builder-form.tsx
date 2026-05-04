"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TributeRecord } from "@/data/tributes";

type TributeBuilderFormProps = {
  tribute: TributeRecord;
  storeConfigured: boolean;
};

type TimelineDraft = {
  year: string;
  title: string;
  copy: string;
};

export function TributeBuilderForm({
  tribute,
  storeConfigured,
}: TributeBuilderFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showGallerySection, setShowGallerySection] = useState(tribute.showGallerySection);
  const [showVideoSection, setShowVideoSection] = useState(tribute.showVideoSection);
  const [showLivestreamSection, setShowLivestreamSection] = useState(
    tribute.showLivestreamSection
  );
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
  const [videoNote, setVideoNote] = useState(tribute.videoNote ?? "");
  const [livestreamUrl, setLivestreamUrl] = useState(tribute.livestreamUrl ?? "");
  const [livestreamNote, setLivestreamNote] = useState(tribute.livestreamNote ?? "");
  const [timelineEntries, setTimelineEntries] = useState<TimelineDraft[]>(
    tribute.timeline.length > 0
      ? tribute.timeline.map((entry) => ({
          year: entry.year,
          title: entry.title,
          copy: entry.copy,
        }))
      : [{ year: "", title: "", copy: "" }]
  );

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

  async function handleSubmit(formData: FormData) {
    if (!storeConfigured) {
      setStatus("Supabase content storage is not configured yet.");
      return;
    }

    setPending(true);
    setStatus(null);

    const livestreamValue = livestreamUrl.trim();

    const payload = {
      slug: tribute.slug,
      name: String(formData.get("name") ?? ""),
      honorificTitle: String(formData.get("honorificTitle") ?? ""),
      positionTitle: String(formData.get("positionTitle") ?? ""),
      years: String(formData.get("years") ?? ""),
      tagline: String(formData.get("tagline") ?? ""),
      organizer: String(formData.get("organizer") ?? ""),
      theme: String(formData.get("theme") ?? tribute.theme),
      heroImageUrl: String(formData.get("heroImageUrl") ?? ""),
      backgroundImageUrl: String(formData.get("backgroundImageUrl") ?? ""),
      galleryNote: String(formData.get("galleryNote") ?? ""),
      lifeStory: String(formData.get("lifeStory") ?? ""),
      supportNote: String(formData.get("supportNote") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      donationAccountName: String(formData.get("donationAccountName") ?? ""),
      donationAccountNumber: String(formData.get("donationAccountNumber") ?? ""),
      donationBankName: String(formData.get("donationBankName") ?? ""),
      donationPhone: String(formData.get("donationPhone") ?? ""),
      videoUrls: videoUrls.map((value) => value.trim()).filter(Boolean),
      videoDescriptions: videoDescriptions.map((value) => value.trim()),
      videoNote: videoNote.trim(),
      livestreamUrl: livestreamValue,
      livestreamNote: livestreamNote.trim(),
      showGallerySection,
      showVideoSection,
      showLivestreamSection,
      timeline: timelineEntries
        .map((entry) => ({
          year: entry.year.trim(),
          title: entry.title.trim(),
          copy: entry.copy.trim(),
        }))
        .filter((entry) => entry.year || entry.title || entry.copy),
      contributors: tribute.contributors.map((_, index) => ({
        label: String(formData.get(`contributorLabel-${index}`) ?? ""),
        name: String(formData.get(`contributorName-${index}`) ?? ""),
        copy: String(formData.get(`contributorCopy-${index}`) ?? ""),
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

    setPending(false);
    setStatus(data.message ?? data.error ?? "Unable to save tribute.");

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form
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
              <option value="ivory">Ivory Memorial</option>
              <option value="sage">Sage Garden</option>
              <option value="sky">Quiet Sky</option>
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
            <input name="heroImageUrl" type="text" defaultValue={tribute.heroImageUrl ?? ""} />
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
              defaultValue={tribute.backgroundImageUrl ?? ""}
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
      </article>

      <article className="form-card">
        <p className="card-label">Public Section Visibility</p>
        <h3>Control what appears on the tribute page</h3>
        <div className="builder-chip-list builder-visibility-chips" aria-live="polite">
          <span className={showGallerySection ? "builder-visibility-chip is-on" : "builder-visibility-chip is-off"}>
            Photos: {showGallerySection ? "ON" : "OFF"}
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
          <span>Empty state note</span>
          <textarea name="galleryNote" defaultValue={tribute.galleryNote} />
        </label>
      </article>

      <article className="form-card" id="media">
        <p className="card-label">Videos</p>
        <h3>Video uploads and playback</h3>
        <p className="subtle-note">Add up to 3 video links for Video Memories.</p>
        <p className="subtle-note">After deleting a video link, click Save Draft to publish the removal.</p>
        <label className="field-block">
          <span>Video 1 URL</span>
          <input
            name="videoUrl-0"
            type="url"
            value={videoUrls[0]}
            onChange={(event) =>
              setVideoUrls((current) => [event.currentTarget.value, current[1], current[2]])
            }
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>
        <label className="field-block">
          <span>Video 1 Description</span>
          <input
            name="videoDescription-0"
            type="text"
            value={videoDescriptions[0]}
            onChange={(event) =>
              setVideoDescriptions((current) => [event.currentTarget.value, current[1], current[2]])
            }
            placeholder="Short description for video 1"
          />
        </label>
        <div className="builder-inline-actions">
          <button
            className="button-secondary dashboard-danger-button"
            type="button"
            onClick={() => {
              setVideoUrls((current) => ["", current[1], current[2]]);
              setVideoDescriptions((current) => ["", current[1], current[2]]);
            }}
          >
            Delete Video 1
          </button>
        </div>
        <label className="field-block">
          <span>Video 2 URL</span>
          <input
            name="videoUrl-1"
            type="url"
            value={videoUrls[1]}
            onChange={(event) =>
              setVideoUrls((current) => [current[0], event.currentTarget.value, current[2]])
            }
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>
        <label className="field-block">
          <span>Video 2 Description</span>
          <input
            name="videoDescription-1"
            type="text"
            value={videoDescriptions[1]}
            onChange={(event) =>
              setVideoDescriptions((current) => [current[0], event.currentTarget.value, current[2]])
            }
            placeholder="Short description for video 2"
          />
        </label>
        <div className="builder-inline-actions">
          <button
            className="button-secondary dashboard-danger-button"
            type="button"
            onClick={() => {
              setVideoUrls((current) => [current[0], "", current[2]]);
              setVideoDescriptions((current) => [current[0], "", current[2]]);
            }}
          >
            Delete Video 2
          </button>
        </div>
        <label className="field-block">
          <span>Video 3 URL</span>
          <input
            name="videoUrl-2"
            type="url"
            value={videoUrls[2]}
            onChange={(event) =>
              setVideoUrls((current) => [current[0], current[1], event.currentTarget.value])
            }
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>
        <label className="field-block">
          <span>Video 3 Description</span>
          <input
            name="videoDescription-2"
            type="text"
            value={videoDescriptions[2]}
            onChange={(event) =>
              setVideoDescriptions((current) => [current[0], current[1], event.currentTarget.value])
            }
            placeholder="Short description for video 3"
          />
        </label>
        <div className="builder-inline-actions">
          <button
            className="button-secondary dashboard-danger-button"
            type="button"
            onClick={() => {
              setVideoUrls((current) => [current[0], current[1], ""]);
              setVideoDescriptions((current) => [current[0], current[1], ""]);
            }}
          >
            Delete Video 3
          </button>
        </div>
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
              setLivestreamNote("");
            }}
          >
            Delete Live Stream
          </button>
        </div>
      </article>

      <article className="form-card">
        <p className="card-label">Contributors</p>
        <h3>Family and community cards</h3>
        <div className="builder-repeat-grid">
          {tribute.contributors.map((contributor, index) => (
            <div className="builder-repeat-card" key={contributor.name}>
              <label className="field-block">
                <span>Label</span>
                <input
                  name={`contributorLabel-${index}`}
                  type="text"
                  defaultValue={contributor.label}
                />
              </label>
              <label className="field-block">
                <span>Name</span>
                <input
                  name={`contributorName-${index}`}
                  type="text"
                  defaultValue={contributor.name}
                />
              </label>
              <label className="field-block">
                <span>Description</span>
                <textarea
                  name={`contributorCopy-${index}`}
                  defaultValue={contributor.copy}
                />
              </label>
            </div>
          ))}
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
