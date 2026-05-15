import type { Metadata } from "next";
import { LifeStory } from "@/components/life-story";
import { notFound, redirect } from "next/navigation";
import { DonationDetailsModal } from "@/components/donation-details-modal";
import { FamilyMessageModal } from "@/components/family-message-modal";
import { HeroCountdown } from "@/components/hero-countdown";
import { MarkdownInline, MarkdownText } from "@/components/markdown-text";
import { MessageFeed } from "@/components/message-feed";
import { MessageForm } from "@/components/message-form";
import { MessagePromptToast } from "@/components/message-prompt-toast";
import { ShareTributeIconButton } from "@/components/share-tribute-icon-button";
import { TimelineSection } from "@/components/timeline-section";
import { TributeActionBar } from "@/components/tribute-action-bar";
import { TributeCardModal } from "@/components/tribute-card-modal";
import { TributeGallerySection } from "@/components/tribute-gallery-section";
import { TributeMediaSection } from "@/components/tribute-media-section";
import { TributeVisitTracker } from "@/components/tribute-visit-tracker";
import { TributePageThemeMain } from "@/components/tribute-page-theme-main";
import { getActiveThemeFromRotation } from "@/lib/tribute-theme-rotation";
import { getFamilyContactEmail } from "@/lib/env";
import { getApprovedMessages, isMessageStoreConfigured } from "@/lib/messages";
import { isFamilyPrivateMessageStoreConfigured } from "@/lib/family-private-messages";
import { getTributeRecord, resolveCanonicalTributeSlug } from "@/lib/tributes-store";
import { getTributeVisitStats } from "@/lib/visits";

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

  let pageViewsCount: number | null = null;
  try {
    const visitStats = await getTributeVisitStats(tribute.slug);
    pageViewsCount = visitStats.pageViews;
  } catch {
    // Visit stats are optional on public page and must not break rendering.
  }

  const approvedMessages = await getApprovedMessages(tribute.slug);
  const visibleMessages = approvedMessages.length > 0 ? approvedMessages : tribute.messages;
  const familyEmail = tribute.contactEmail || getFamilyContactEmail();
  const storeConfigured = isMessageStoreConfigured();
  const familyMessageStoreConfigured = isFamilyPrivateMessageStoreConfigured();
  const initialActiveTheme = getActiveThemeFromRotation(
    tribute.theme,
    Boolean(tribute.themeRotationEnabled),
    tribute.themeRotationIntervalMinutes ?? 1440,
    tribute.themeRotationThemeIds ?? [],
  );
  const supportNoteText = tribute.supportNote?.trim();

  return (
    <TributePageThemeMain
      baseThemeId={tribute.theme}
      initialActiveThemeId={initialActiveTheme}
      rotationEnabled={Boolean(tribute.themeRotationEnabled)}
      rotationIntervalMinutes={tribute.themeRotationIntervalMinutes ?? 1440}
      rotationThemeIds={tribute.themeRotationThemeIds ?? []}
      heroImageUrl={tribute.heroImageUrl}
      backgroundImageUrl={tribute.backgroundImageUrl}
    >
      <TributeVisitTracker tributeSlug={tribute.slug} />
      <MessagePromptToast tributeSlug={tribute.slug} />
      <div className="tribute-page">
        <section className="hero-section" id="tribute-top">
          {pageViewsCount !== null ? (
            <div className="hero-view-count" aria-label={`${pageViewsCount} page views`}>
              <span className="hero-view-count-label">Views</span>
              <strong>{pageViewsCount.toLocaleString()}</strong>
            </div>
          ) : null}
          <p className="hero-kicker">In Loving Memory</p>
          <div className="hero-avatar-wrap">
            <div
              className={tribute.heroImageUrl ? "avatar-placeholder has-image" : "avatar-placeholder"}
              aria-hidden="true"
            />
            {tribute.heroCountdownTargetDate?.trim() ? (
              <HeroCountdown
                targetDate={tribute.heroCountdownTargetDate.trim()}
                unit={tribute.heroCountdownUnit?.trim() || "Days"}
              />
            ) : null}
            <DonationDetailsModal
              accountName={tribute.donationAccountName}
              accountNumber={tribute.donationAccountNumber}
              bankName={tribute.donationBankName}
              phone={tribute.donationPhone}
              triggerClassName="hero-donation-badge"
              triggerLabel="Donate"
            />
            <ShareTributeIconButton className="hero-share-icon" />
          </div>
          <div className="hero-divider" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          {tribute.honorificTitle?.trim() ? (
            <p className="hero-honorific">
              <MarkdownInline content={tribute.honorificTitle} />
            </p>
          ) : null}
          <h1>
            <MarkdownInline content={tribute.name} />
          </h1>
          {tribute.positionTitle?.trim() ? (
            <p className="hero-position">
              <MarkdownInline content={tribute.positionTitle} />
            </p>
          ) : null}
          <p className="hero-dates">
            <MarkdownInline content={tribute.years} />
          </p>
          <p className="hero-tagline">
            <MarkdownInline content={tribute.tagline} />
          </p>
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

        <section className="content-section" id="messages-section">
          <p className="section-kicker">Messages & Memories</p>
          <h2>Share a Memory</h2>
          <span className="section-accent" />
          <div className="messages-section-stack">
            <MessageFeed messages={visibleMessages} />
            <MessageForm tributeSlug={tribute.slug} storeConfigured={storeConfigured} />
          </div>
        </section>

        {tribute.showGallerySection ? (
          <TributeGallerySection
            galleryIntro={tribute.galleryIntro}
            galleryImages={tribute.galleryImages}
            galleryNote={tribute.galleryNote}
          />
        ) : null}

        {tribute.showServicePosterSection && tribute.servicePosterImageUrl?.trim() ? (
          <section className="content-section">
            <p className="section-kicker">Memorial Program</p>
            <h2>{tribute.servicePosterTitle?.trim() || "Service Poster"}</h2>
            <span className="section-accent" />
            <article className="form-card service-poster-card">
              <a
                className="service-poster-link"
                href={tribute.servicePosterImageUrl.trim()}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  role="img"
                  aria-label={`${tribute.name} service poster`}
                  className="service-poster-image"
                  style={{ backgroundImage: `url("${tribute.servicePosterImageUrl.trim()}")` }}
                />
              </a>
              {tribute.servicePosterNote?.trim() ? (
                <MarkdownText content={tribute.servicePosterNote} className="subtle-note" />
              ) : (
                <p className="subtle-note">Open the poster for a full-size view.</p>
              )}
            </article>
          </section>
        ) : null}

        <TributeMediaSection
          tributeSlug={tribute.slug}
          videoUrls={tribute.videoUrls}
          videoDescriptions={tribute.videoDescriptions}
          videoThumbnailUrls={tribute.videoThumbnailUrls}
          activeVideoIndex={tribute.activeVideoIndex}
          videoNote={tribute.videoNote}
          livestreamUrl={tribute.livestreamUrl}
          livestreamThumbnailUrl={tribute.livestreamThumbnailUrl}
          livestreamDisplayMode={tribute.livestreamDisplayMode}
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

        <section className="content-section">
          <p className="section-kicker">The Family</p>
          <h2>Family & Associates</h2>
          <span className="section-accent" />
          <div className="contributors-grid">
            {tribute.contributors.map((contributor) => (
              <article className="soft-card" key={contributor.name}>
                <p className="card-label">
                  <MarkdownInline content={contributor.label} />
                </p>
                <h3>
                  <MarkdownInline content={contributor.name} />
                </h3>
                <MarkdownText content={contributor.copy} />
              </article>
            ))}
          </div>
        </section>

        <section className="content-section content-section-dark" id="support-section">
          <p className="section-kicker">Show Love to the Family</p>
          <h2>Show Love to the Family</h2>
          <span className="section-accent" />
          <div className="support-grid">
            <article className="form-card support-actions-card">
              <div className="support-action-list">
                {tribute.showCondolencePopup !== false ? (
                  <TributeCardModal
                    recipientEmail={familyEmail}
                    tributeSlug={tribute.slug}
                    tributeName={tribute.name}
                    storeConfigured={familyMessageStoreConfigured}
                    imageUrl={tribute.condolenceCardImageUrl}
                  />
                ) : null}
                <DonationDetailsModal
                  accountName={tribute.donationAccountName}
                  accountNumber={tribute.donationAccountNumber}
                  bankName={tribute.donationBankName}
                  phone={tribute.donationPhone}
                  listenForGlobalOpen
                  triggerClassName="support-action-pill support-action-pill-solid-yellow"
                />
                <FamilyMessageModal
                  recipientEmail={familyEmail}
                  tributeSlug={tribute.slug}
                  tributeName={tribute.name}
                  organizer={tribute.organizer}
                  storeConfigured={familyMessageStoreConfigured}
                />
              </div>
              <p className="support-actions-copy">
                Send a tribute card, make a donation, or write a direct private message
                to the family representative.
              </p>
            </article>
            <article className="form-card support-note-card">
              <h3>Note from the Family</h3>
              <MarkdownText
                content={
                  supportNoteText
                    ? supportNoteText
                    : "Use this section to explain tribute card options, family support contributions, or any other memorial giving details."
                }
              />
            </article>
          </div>
        </section>

        <footer className="tribute-footer">
          <div className="footer-links">
            <a href="#tribute-top">Home</a>
            <a href="#support-section">Support</a>
            <a href="#messages-section">Contact</a>
          </div>
          <div className="footer-credit">
            <span className="footer-credit-line">
              For <strong>Ogini&apos;s Family</strong>
            </span>
            <span className="footer-credit-brand">Ogigrid</span>
          </div>
        </footer>
      </div>
    </TributePageThemeMain>
  );
}
