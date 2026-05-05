import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { GalleryDashboardManager } from "@/components/gallery-dashboard-manager";
import { ThemeConsoleForm } from "@/components/theme-console-form";
import { TributeBuilderForm } from "@/components/tribute-builder-form";
import { requireAdminSession } from "@/lib/admin";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord, isTributeStoreConfigured } from "@/lib/tributes-store";
import {
  getRecentTributeVisits,
  getTributeVisitStats,
  isVisitStoreConfigured,
  type TributeVisitDetail,
  type TributeVisitStats,
} from "@/lib/visits";
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
  let recentVisits: TributeVisitDetail[] = [];
  let visitStatsError: string | null = null;
  try {
    messages = await getMessagesForAdmin(slug);
  } catch {
    messages = [];
  }
  try {
    visitStats = await getTributeVisitStats(slug);
    recentVisits = await getRecentTributeVisits(slug);
  } catch (error) {
    visitStats = {
      pageViews: 0,
      uniqueVisitors: 0,
    };
    recentVisits = [];
    visitStatsError =
      error instanceof Error ? error.message : "Visitor tracking is unavailable right now.";
  }
  const approved = messages.filter((message) => message.status === "approved").length;
  const latestByEmail = new Map<typeof messages[number]["email"], typeof messages[number]>();
  for (const message of messages) {
    const email = message.email.trim().toLowerCase();
    const existing = latestByEmail.get(email);
    if (!existing) {
      latestByEmail.set(email, message);
      continue;
    }

    if (new Date(message.created_at).getTime() > new Date(existing.created_at).getTime()) {
      latestByEmail.set(email, message);
    }
  }
  const pending = Array.from(latestByEmail.values()).filter((message) =>
    message.status.startsWith("pending"),
  ).length;
  const activeTheme = getTributeThemePreset(tribute.theme);
  const storeConfigured = isTributeStoreConfigured();
  const visitStoreConfigured = isVisitStoreConfigured();
  const shellStyle = {
    ...activeTheme.variables,
  } as CSSProperties;
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
          <a href="#theme">Theme</a>
          <Link href={`/console/${slug}/messages`}>Approval Page</Link>
          <a href="#media">Video & Live</a>
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
              {pending} pending and {approved} approved. Keep the public page clean before
              launch.
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
            <p>Upload video links and configure live stream viewing directly in the builder.</p>
          </div>
          <a className="button-secondary" href="#media">
            Manage Media
          </a>
        </article>
      </section>

      <div id="details">
        <TributeBuilderForm tribute={tribute} storeConfigured={storeConfigured} />
      </div>

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
            {visitStatsError ? <p>{visitStatsError}</p> : null}
            {!visitStatsError && recentVisits.length === 0 ? <p>No visits recorded yet.</p> : null}
            {!visitStatsError && recentVisits.length > 0 ? (
              <div className="console-visit-list">
                {recentVisits.map((visit) => (
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
            ) : null}
          </article>
        </div>
      </section>

      <ThemeConsoleForm tribute={tribute} presets={tributeThemePresets} />
    </main>
  );
}
