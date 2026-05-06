"use client";

import { useState } from "react";
import type { TributeRecord, TributeThemePreset } from "@/data/tributes";

type ThemeConsoleFormProps = {
  tribute: TributeRecord;
  presets: TributeThemePreset[];
};

export function ThemeConsoleForm({ tribute, presets }: ThemeConsoleFormProps) {
  const [selectedTheme, setSelectedTheme] = useState(tribute.theme);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function applyTheme() {
    setPending(true);
    setStatus(null);

    const response = await fetch(`/api/tributes/${tribute.slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug: tribute.slug,
        name: tribute.name,
        honorificTitle: tribute.honorificTitle ?? "",
        positionTitle: tribute.positionTitle ?? "",
        years: tribute.years,
        tagline: tribute.tagline,
        organizer: tribute.organizer,
        theme: selectedTheme,
        heroImageUrl: tribute.heroImageUrl ?? "",
        backgroundImageUrl: tribute.backgroundImageUrl ?? "",
        galleryIntro: tribute.galleryIntro ?? "",
        galleryNote: tribute.galleryNote,
        lifeStory: tribute.lifeStory.join("\n\n"),
        supportNote: tribute.supportNote ?? "",
        contactEmail: tribute.contactEmail ?? "",
        donationAccountName: tribute.donationAccountName ?? "",
        donationAccountNumber: tribute.donationAccountNumber ?? "",
        donationBankName: tribute.donationBankName ?? "",
        donationPhone: tribute.donationPhone ?? "",
        videoUrls: tribute.videoUrls,
        videoDescriptions: tribute.videoDescriptions,
        videoThumbnailUrls: tribute.videoThumbnailUrls,
        activeVideoIndex: tribute.activeVideoIndex ?? 0,
        videoNote: tribute.videoNote ?? "",
        livestreamUrl: tribute.livestreamUrl ?? "",
        livestreamThumbnailUrl: tribute.livestreamThumbnailUrl ?? "",
        livestreamDisplayMode: tribute.livestreamDisplayMode ?? "video",
        livestreamNote: tribute.livestreamNote ?? "",
        showGallerySection: tribute.showGallerySection,
        showVideoSection: tribute.showVideoSection,
        showLivestreamSection: tribute.showLivestreamSection,
        timeline: tribute.timeline,
        contributors: tribute.contributors,
        supportAmounts: tribute.supportAmounts,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setStatus(data.message ?? data.error ?? "Unable to save theme.");

    if (response.ok) {
      window.location.reload();
    }
  }

  return (
    <section className="dashboard-section" id="theme">
      <article className="form-card">
        <p className="card-label">Theme</p>
        <h2>Visual preference</h2>
        <p className="subtle-note">
          Choose the memorial palette that best reflects the family&apos;s preference.
        </p>
        {status ? <p className="form-status">{status}</p> : null}
      </article>

      <section className="theme-grid">
        {presets.map((theme) => (
          <article className="theme-card" key={theme.id}>
            <div
              className={`theme-preview${theme.id === selectedTheme ? " is-active" : ""}`}
              style={{
                background: `linear-gradient(180deg, ${theme.variables["--bg"]} 0%, ${theme.variables["--bg-2"]} 100%)`,
              }}
            >
              <div
                className="theme-preview-card"
                style={{
                  background: theme.variables["--panel-solid"],
                  borderColor: theme.variables["--line"],
                }}
              >
                <div
                  className="theme-preview-dot"
                  style={{ background: theme.variables["--gold"] }}
                />
                <div className="theme-preview-lines">
                  <span style={{ background: theme.variables["--text"] }} />
                  <span style={{ background: theme.variables["--muted"] }} />
                  <span style={{ background: theme.variables["--gold-soft"] }} />
                </div>
              </div>
            </div>

            <p className="card-label">
              {theme.id === tribute.theme ? "Current Theme" : "Theme Option"}
            </p>
            <h3>{theme.name}</h3>
            <p>{theme.description}</p>
            <button
              className={theme.id === selectedTheme ? "button-primary" : "button-secondary"}
              type="button"
              onClick={() => {
                setSelectedTheme(theme.id);
                setStatus(null);
              }}
            >
              {theme.id === selectedTheme ? "Selected" : "Choose Theme"}
            </button>
          </article>
        ))}
      </section>

      <div className="builder-actions">
        <button className="button-primary" type="button" onClick={applyTheme} disabled={pending}>
          {pending ? "Saving Theme..." : "Save Theme"}
        </button>
      </div>
    </section>
  );
}
