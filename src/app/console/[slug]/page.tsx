import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { GalleryDashboardManager } from "@/components/gallery-dashboard-manager";
import { ThemeConsoleForm } from "@/components/theme-console-form";
import { TributeBuilderForm } from "@/components/tribute-builder-form";
import { requireAdminToken } from "@/lib/admin";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord, isTributeStoreConfigured } from "@/lib/tributes-store";
import { getTributeThemePreset, tributeThemePresets } from "@/data/tributes";

type ConsolePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ConsolePage({
  params,
  searchParams,
}: ConsolePageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  requireAdminToken(token, `/biotribute/${slug}`);

  const tribute = await getTributeRecord(slug);
  if (!tribute) {
    notFound();
  }

  let messages = [] as Awaited<ReturnType<typeof getMessagesForAdmin>>;
  try {
    messages = await getMessagesForAdmin(slug);
  } catch {
    messages = [];
  }
  const approved = messages.filter((message) => message.status === "approved").length;
  const pending = messages.filter((message) => message.status.startsWith("pending")).length;
  const activeTheme = getTributeThemePreset(tribute.theme);
  const storeConfigured = isTributeStoreConfigured();
  const tokenQuery = `?token=${encodeURIComponent(token ?? "")}`;
  const shellStyle = {
    ...activeTheme.variables,
  } as CSSProperties;

  return (
    <main className="landing-shell console-shell dashboard-theme-shell" style={shellStyle}>
      <section className="landing-hero admin-shell dashboard-hero">
        <Link
          className="console-alert-link"
          href={`/console/${slug}/messages${tokenQuery}`}
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
          <Link href={`/console/${slug}/messages${tokenQuery}`}>Approval Page</Link>
          <a href="#media">Video & Live</a>
          <Link href={`/biotribute/${tribute.slug}`}>View Public Page</Link>
        </div>
      </section>

      <section className="dashboard-row-list">
        <article className="dashboard-row">
          <div className="dashboard-row-main">
            <p className="card-label">Public Tribute</p>
            <h2>/biotribute/{tribute.slug}</h2>
            <p>Use this to review exactly what visitors will see after each save.</p>
          </div>
          <Link className="button-secondary" href={`/biotribute/${tribute.slug}`}>
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
          <Link className="button-secondary" href={`/console/${slug}/messages${tokenQuery}`}>
            Open Approval Page
          </Link>
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

      <ThemeConsoleForm tribute={tribute} presets={tributeThemePresets} />
    </main>
  );
}
