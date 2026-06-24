import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { NoticeToast } from "@/components/notice-toast";
import { ModerationQueue } from "@/components/moderation-queue";
import { PrivateSubmissionsManager } from "@/components/private-submissions-manager";
import { UserSignOutButton } from "@/components/user-sign-out-button";
import { getTributeThemePreset } from "@/data/tributes";
import { isAdminAuthenticated } from "@/lib/admin";
import { canManageTribute } from "@/lib/user-auth";
import { getFamilyPrivateMessagesForAdmin } from "@/lib/family-private-messages";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord } from "@/lib/tributes-store";

type ConsoleMessagesPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string; tone?: "success" | "error" }>;
};

export default async function ConsoleMessagesPage({
  params,
  searchParams,
}: ConsoleMessagesPageProps) {
  const { slug } = await params;
  const { notice, tone } = await searchParams;
  if (!(await canManageTribute(slug))) {
    redirect(`/login?next=${encodeURIComponent(`/console/${slug}/messages`)}`);
  }
  const isAdmin = await isAdminAuthenticated();

  const tribute = await getTributeRecord(slug);
  if (!tribute) {
    notFound();
  }
  const themePreset = getTributeThemePreset(tribute.theme);

  let messagesError: string | null = null;
  let messages = [] as Awaited<ReturnType<typeof getMessagesForAdmin>>;
  try {
    messages = await getMessagesForAdmin(slug);
  } catch (error) {
    messagesError = error instanceof Error ? error.message : "Unable to load moderation data.";
  }
  let privateMessagesError: string | null = null;
  let privateMessages = [] as Awaited<ReturnType<typeof getFamilyPrivateMessagesForAdmin>>;
  try {
    privateMessages = await getFamilyPrivateMessagesForAdmin(slug);
  } catch (error) {
    privateMessagesError =
      error instanceof Error ? error.message : "Unable to load private family messages.";
  }
  const redirectTo = `/console/${slug}/messages`;
  const shellStyle = {
    ...themePreset.variables,
  } as CSSProperties;

  return (
    <main className="landing-shell console-shell dashboard-theme-shell" style={shellStyle}>
      <AdminSessionGuard />
      <NoticeToast message={notice} tone={tone} />
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes Console</p>
        <h1>Message Approval</h1>
        <p className="landing-copy">
          Review and approve guest messages before they appear on {tribute.name}&apos;s public
          tribute page.
        </p>
        <div className="console-quick-links">
          <Link href={`/console/${slug}`}>Back to Console</Link>
          <Link href={`/${slug}`}>View Public Page</Link>
          {isAdmin ? (
            <form action="/api/admin/logout" method="post">
              <button className="button-secondary" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <UserSignOutButton />
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <article className="form-card dashboard-section-header">
          <p className="card-label">Moderation Queue</p>
          <h2>Guest messages for {tribute.name}</h2>
          <p className="subtle-note">
            Mark verification, approve what should be public, and reject what should stay
            private.
          </p>
        </article>

        {messagesError ? (
          <article className="form-card">
            <h3>Moderation store not ready</h3>
            <p>{messagesError}</p>
            <p className="subtle-note">
              Apply the migration in Supabase SQL editor, then refresh this page.
            </p>
          </article>
        ) : null}

        {!messagesError ? (
          messages.length === 0 ? (
            <article className="form-card">
              <h3>No messages yet</h3>
              <p>No submissions have been stored for this tribute.</p>
            </article>
          ) : (
            <ModerationQueue messages={messages} redirectTo={redirectTo} />
          )
        ) : null}

        {privateMessagesError ? (
          <article className="form-card">
            <h3>Private inbox not ready</h3>
            <p>{privateMessagesError}</p>
          </article>
        ) : (
          <PrivateSubmissionsManager messages={privateMessages} redirectTo={redirectTo} />
        )}
      </section>
    </main>
  );
}
