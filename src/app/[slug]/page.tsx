import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { LifeStory } from "@/components/life-story";
import { notFound, redirect } from "next/navigation";
import { FamilyMessageModal } from "@/components/family-message-modal";
import { MessageFeed } from "@/components/message-feed";
import { MessageForm } from "@/components/message-form";
import { TimelineSection } from "@/components/timeline-section";
import { TributeActionBar } from "@/components/tribute-action-bar";
import { TributeMediaSection } from "@/components/tribute-media-section";
import { getTributeThemePreset } from "@/data/tributes";
import { getApprovedMessages, isMessageStoreConfigured } from "@/lib/messages";
import { getTributeRecord, resolveCanonicalTributeSlug } from "@/lib/tributes-store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = await resolveCanonicalTributeSlug(slug);
  const tribute = canonicalSlug ? await getTributeRecord(canonicalSlug) : null;

  if (!tribute) {
    return {
      title: "Tribute Not Found | bioTributes",
    };
  }

  return {
    title: `${tribute.name} | bioTributes`,
    description: `${tribute.name} memorial page`,
  };
}

export default async function TributePage({ params }: PageProps) {
  const { slug } = await params;
  const canonicalSlug = await resolveCanonicalTributeSlug(slug);
  if (!canonicalSlug) {
    notFound();
  }

  if (canonicalSlug !== slug) {
    redirect(`/${canonicalSlug}`);
  }

  const tribute = await getTributeRecord(canonicalSlug);

  if (!tribute) {
    notFound();
  }

  const approvedMessages = await getApprovedMessages(tribute.slug);
  const visibleMessages = approvedMessages.length > 0 ? approvedMessages : tribute.messages;
  const familyEmail = tribute.contactEmail || process.env.NEXT_PUBLIC_FAMILY_EMAIL || "";
  const storeConfigured = isMessageStoreConfigured();
  const themePreset = getTributeThemePreset(tribute.theme);
  const galleryLoop =
    tribute.galleryImages.length > 0
      ? [...tribute.galleryImages, ...tribute.galleryImages]
      : [];
  const pageStyle = {
    ...themePreset.variables,
    "--tribute-hero-image": tribute.heroImageUrl ? `url("${tribute.heroImageUrl}")` : "none",
    "--tribute-background-image": tribute.backgroundImageUrl
      ? `url("${tribute.backgroundImageUrl}")`
      : tribute.heroImageUrl
        ? `url("${tribute.heroImageUrl}")`
        : "none",
  } as CSSProperties;

  return (
    <main className="page-shell tribute-page-shell" style={pageStyle}>
      <div className="tribute-page">
        <section className="hero-section" id="tribute-top">
          <p className="hero-kicker">In Loving Memory</p>
          <div
            className={tribute.heroImageUrl ? "avatar-placeholder has-image" : "avatar-placeholder"}
            aria-hidden="true"
          />
          <div className="hero-divider" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <h1>{tribute.name}</h1>
          <p className="hero-dates">{tribute.years}</p>
          <p className="hero-tagline">{tribute.tagline}</p>
          <div className="hero-theme-indicator" aria-label="Selected theme colors">
            <span className="hero-theme-swatches" aria-hidden="true">
              <i style={{ background: "var(--gold)" }} />
              <i style={{ background: "var(--violet-deep)" }} />
              <i style={{ background: "var(--panel-solid)" }} />
              <i style={{ background: "var(--bg-2)" }} />
            </span>
          </div>
        </section>

        <TributeActionBar />

        <section className="content-section">
          <p className="section-kicker">The Family</p>
          <h2>Family & Contributors</h2>
          <span className="section-accent" />
          <div className="contributors-grid">
            {tribute.contributors.map((contributor) => (
              <article className="soft-card" key={contributor.name}>
                <p className="card-label">{contributor.label}</p>
                <h3>{contributor.name}</h3>
                <p>{contributor.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {tribute.showGallerySection ? (
          <section className="content-section content-section-soft">
            <p className="section-kicker">Photo Gallery</p>
            <h2>Moments in Memory</h2>
            <span className="section-accent" />
            <div className="gallery-card gallery-card-full">
              <p>
                A gentle space for family photos, celebration moments, and the scenes
                that made his life recognizable to everyone who loved him.
              </p>
              <div className="gallery-stream" aria-hidden="true">
                {galleryLoop.length > 0 ? (
                  <div className="gallery-track">
                    {galleryLoop.map((image, index) => (
                      <div
                        className="gallery-item has-image"
                        key={`${image.id}-${index}`}
                        style={{ backgroundImage: `url("${image.imageUrl}")` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="gallery-track">
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                    <div className="gallery-item" />
                  </div>
                )}
              </div>
              {tribute.galleryImages.length === 0 ? (
                <p className="subtle-note">{tribute.galleryNote}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        <TributeMediaSection
          videoUrls={tribute.videoUrls}
          videoDescriptions={tribute.videoDescriptions}
          videoNote={tribute.videoNote}
          livestreamUrl={tribute.livestreamUrl}
          livestreamNote={tribute.livestreamNote}
          showVideoSection={tribute.showVideoSection}
          showLivestreamSection={tribute.showLivestreamSection}
        />

        <section className="content-section">
          <p className="section-kicker">Life Story</p>
          <h2>A Life Well Lived</h2>
          <span className="section-accent" />
          <LifeStory paragraphs={tribute.lifeStory} />
        </section>

        <section className="content-section content-section-soft">
          <p className="section-kicker">Timeline</p>
          <h2>A Journey Through Time</h2>
          <span className="section-accent" />
          <TimelineSection entries={tribute.timeline} />
        </section>

        <section className="content-section" id="messages-section">
          <p className="section-kicker">Messages & Memories</p>
          <h2>Share a Memory</h2>
          <span className="section-accent" />
          <div className="messages-section-stack">
            <MessageFeed messages={visibleMessages} />
            <MessageForm tributeSlug={tribute.slug} storeConfigured={storeConfigured} />
          </div>
        </section>

        <section className="content-section content-section-dark" id="support-section">
          <p className="section-kicker">Support the Family</p>
          <h2>Support the Family</h2>
          <span className="section-accent" />
          <div className="support-grid">
            <article className="form-card support-actions-card">
              <h3>Support options</h3>
              <div className="support-action-list">
                <button className="support-action-pill" type="button">
                  <span aria-hidden="true">✉</span>&nbsp;Card
                </button>
                <button className="support-action-pill support-action-pill-accent" type="button">
                  Donations
                </button>
                <FamilyMessageModal
                  recipientEmail={familyEmail}
                  tributeName={tribute.name}
                  organizer={tribute.organizer}
                />
              </div>
              <p className="support-actions-copy">
                Support the family in the way that feels right for you. Send a paid
                tribute card, make a contribution, or write a direct message to the
                family representative.
              </p>
            </article>
            <article className="form-card">
              <h3>Support note</h3>
              <p>
                {tribute.supportNote?.trim()
                  ? tribute.supportNote
                  : "Use this section to explain tribute card options, family support contributions, or any other memorial giving details."}
              </p>
            </article>
          </div>
        </section>

        <footer className="tribute-footer">
          <div className="footer-links">
            <a href="#tribute-top">Home</a>
            <a href="#support-section">Support</a>
            <a href="#messages-section">Contact</a>
          </div>
          <div>
            Organized by <strong>{tribute.organizer}</strong> · Powered by CyquadTech
          </div>
        </footer>
      </div>
    </main>
  );
}
