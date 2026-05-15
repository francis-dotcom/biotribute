import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { GalleryDashboardManager } from "@/components/gallery-dashboard-manager";
import { ThemeConsoleForm } from "@/components/theme-console-form";
import { TributeBuilderForm } from "@/components/tribute-builder-form";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { VisitorDetailsPanel } from "@/components/visitor-details-panel";
import { requireAdminSession } from "@/lib/admin";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord, isTributeStoreConfigured } from "@/lib/tributes-store";
import {
  getRecentTributeVisitSessions,
  getTributeVisitStats,
  isVisitStoreConfigured,
  type TributeVisitSessionDetail,
  type TributeVisitStats,
} from "@/lib/visits";
import {
  getTributeVideoOpenStats,
  isVideoOpenStoreConfigured,
  type TributeVideoOpenStat,
} from "@/lib/video-opens";
import { getTributeThemePreset, tributeThemePresets } from "@/data/tributes";

type ConsolePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ConsolePage({
  params,
}: ConsolePageProps) {
  const { slug } = await params;
  await requireAdminSession(`/console/${slug}`);

  const tribute = await getTributeRecord(slug);
  if (!tribute) {
    notFound();
  }

  let messages = [] as Awaited<ReturnType<typeof getMessagesForAdmin>>;
  let visitStats: TributeVisitStats = {
    pageViews: 0,
    uniqueVisitors: 0,
  };
  let recentVisits: TributeVisitSessionDetail[] = [];
  let videoOpenStats: TributeVideoOpenStat[] = [];
  let visitStatsError: string | null = null;
  let videoOpenStatsError: string | null = null;
  try {
    messages = await getMessagesForAdmin(slug);
  } catch {
    messages = [];
  }
  try {
    visitStats = await getTributeVisitStats(slug);
    recentVisits = await getRecentTributeVisitSessions(slug);
  } catch (error) {
    visitStats = {
      pageViews: 0,
      uniqueVisitors: 0,
    };
    recentVisits = [];
    visitStatsError =
      error instanceof Error ? error.message : "Visitor tracking is unavailable right now.";
  }
  try {
    videoOpenStats = await getTributeVideoOpenStats(slug);
  } catch (error) {
    videoOpenStats = [];
    videoOpenStatsError =
      error instanceof Error ? error.message : "Video open tracking is unavailable right now.";
  }
  const pending = messages.filter((message) => message.status.startsWith("pending")).length;
  const approved = messages.filter((message) => message.status === "approved").length;
  const rejected = messages.filter((message) => message.status === "rejected").length;
  const deleted = messages.filter((message) => message.status === "deleted").length;
  const activeTheme = getTributeThemePreset(tribute.theme);
  const storeConfigured = isTributeStoreConfigured();
  const visitStoreConfigured = isVisitStoreConfigured();
  const videoOpenStoreConfigured = isVideoOpenStoreConfigured();
  const shellStyle = {
    ...activeTheme.variables,
  } as CSSProperties;
  const sessionUniqueVisitors = new Set(recentVisits.map((visit) => visit.visitorHash)).size;
  const totalVideoOpens = videoOpenStats.reduce((sum, item) => sum + item.totalOpens, 0);
  const totalVideoUniqueViewers = videoOpenStats.reduce((sum, item) => sum + item.uniqueViewers, 0);
  const lastVisitedLabel = visitStats.lastVisitedAt
    ? new Date(visitStats.lastVisitedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No visits recorded yet";

  return (
    <main className="landing-shell console-shell dashboard-theme-shell" style={shellStyle}>
      <AdminSessionGuard />
      <section className="landing-hero admin-shell dashboard-hero">
        <Link
          className="console-alert-link"
          href={`/console/${slug}/messages`}
          aria-label={`${pending} pending message${pending === 1 ? "" : "s"} awaiting review`}
        >
          <span className="console-alert-icon" aria-hidden="true">
            ✉
          </span>
          <span className="console-alert-count">{pending}</span>
        </Link>
        <p className="landing-kicker">bioTributes Console</p>
        <h1>{tribute.name}</h1>
        <p className="landing-copy">
          One owner console for content, images, theme, moderation, and launch review.
        </p>

        <div className="console-quick-links">
          <a href="#details">Details</a>
          <a href="#images">Images</a>
          <a href="#service-poster">Poster</a>
          <a href="#theme">Theme</a>
          <Link href={`/console/${slug}/messages`}>Approval Page</Link>
          <a href="#media">Video & Live</a>
          <a href="#media-opens">Video Opens</a>
          <a href="#visitors">Visitors</a>
          <Link href={`/${tribute.slug}`}>View Public Page</Link>
          <form action="/api/admin/logout" method="post">
            <button className="button-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="dashboard-row-list">
        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Public Tribute</p>
            <h2>/{tribute.slug}</h2>
            <p>Use this to review exactly what visitors will see after each save.</p>
          </div>
          <Link className="button-secondary" href={`/${tribute.slug}`}>
            Open Public Page
          </Link>
        </article>

        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Moderation</p>
            <h2>{messages.length}</h2>
            <p>
              {pending} pending, {approved} approved, {rejected} rejected, and {deleted} deleted.
              Keep the public page clean before launch.
            </p>
          </div>
          <Link className="button-secondary" href={`/console/${slug}/messages`}>
            Open Approval Page
          </Link>
        </article>

        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Visitors</p>
            <h2>{visitStats.pageViews}</h2>
            {visitStoreConfigured ? (
              <p>
                {visitStats.uniqueVisitors} unique visitors tracked. Last visit: {lastVisitedLabel}.
              </p>
            ) : (
              <p>Visitor tracking is not configured because Supabase is not connected.</p>
            )}
            {visitStatsError ? <p>{visitStatsError}</p> : null}
          </div>
          <a className="button-secondary" href="#visitors">
            View Details
          </a>
        </article>

        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Theme</p>
            <h2>{activeTheme.name}</h2>
            <p>{activeTheme.description}</p>
          </div>
          <a className="button-secondary" href="#theme">
            Review Theme
          </a>
        </article>
        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Media</p>
            <h2>Video & Live Stream</h2>
            {videoOpenStoreConfigured ? (
              <p>
                {totalVideoOpens} video opens tracked across {totalVideoUniqueViewers} unique viewer matches.
              </p>
            ) : (
              <p>Upload video links and configure live stream viewing directly in the builder.</p>
            )}
            {videoOpenStatsError ? <p>{videoOpenStatsError}</p> : null}
          </div>
          <a className="button-secondary" href="#media">
            Manage Media
          </a>
        </article>

        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Video Opens</p>
            <h2>{totalVideoOpens}</h2>
            <p>
              {totalVideoUniqueViewers} unique viewer matches across your video memory opens.
            </p>
            {videoOpenStatsError ? <p>{videoOpenStatsError}</p> : null}
          </div>
          <a className="button-secondary" href="#media-opens">
            View Video Stats
          </a>
        </article>
      </section>

      <div id="details">
        <TributeBuilderForm tribute={tribute} storeConfigured={storeConfigured} />
      </div>

      <section className="content-section" id="media-opens">
        <p className="section-kicker">Video Opens</p>
        <h2>Video Memory Engagement</h2>
        <span className="section-accent" />
        <div className="contributors-grid">
          {[0, 1, 2]
            .filter((index) => (tribute.videoUrls[index] ?? "").trim())
            .map((index) => {
              const stat = videoOpenStats.find((item) => item.videoIndex === index);
              const lastOpenedLabel = stat?.lastOpenedAt
                ? new Date(stat.lastOpenedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "No opens recorded yet";

              return (
                <article className="soft-card" key={`video-open-stat-${index}`}>
                  <p className="card-label">Video {index + 1}</p>
                  <h3>{tribute.videoDescriptions[index]?.trim() || `Video Memory ${index + 1}`}</h3>
                  <p>{stat?.totalOpens ?? 0} total opens</p>
                  <p>{stat?.uniqueViewers ?? 0} unique viewers</p>
                  <p>Last open: {lastOpenedLabel}</p>
                </article>
              );
            })}
          {tribute.videoUrls.length === 0 ? (
            <article className="soft-card">
              <p>No public video memories configured yet.</p>
            </article>
          ) : null}
        </div>
        {videoOpenStatsError ? <p>{videoOpenStatsError}</p> : null}
      </section>

      <div id="images">
        <GalleryDashboardManager
          slug={tribute.slug}
          heroImageUrl={tribute.heroImageUrl}
          backgroundImageUrl={tribute.backgroundImageUrl}
          galleryImages={tribute.galleryImages}
        />
      </div>

      <section className="content-section content-section-soft" id="visitors">
        <p className="section-kicker">Visitors</p>
        <h2>Visitor Details</h2>
        <span className="section-accent" />
        <div className="contributors-grid">
          <article className="soft-card">
            <p className="card-label">Summary</p>
            <h3>{visitStats.pageViews} page views</h3>
            <p>{visitStats.uniqueVisitors} unique visitors</p>
            <p>Last visit: {lastVisitedLabel}</p>
          </article>
          <article className="soft-card">
            <p className="card-label">Recent Visits</p>
            <VisitorDetailsPanel
              visits={recentVisits}
              error={visitStatsError}
              note={
                !visitStatsError && sessionUniqueVisitors < visitStats.uniqueVisitors
                  ? "Detailed timing and page-session data is available only for visits recorded after session tracking was enabled."
                  : null
              }
            />
          </article>
        </div>
      </section>

      <ThemeConsoleForm tribute={tribute} presets={tributeThemePresets} />
    </main>
  );
}
