import { notFound } from "next/navigation";
import { ModerationQueue } from "@/components/moderation-queue";
import { NoticeToast } from "@/components/notice-toast";
import { PrivateSubmissionsManager } from "@/components/private-submissions-manager";
import { requireAdminSession } from "@/lib/admin";
import { getFamilyPrivateMessagesForAdmin } from "@/lib/family-private-messages";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord } from "@/lib/tributes-store";

type TributeMessagesPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string; tone?: "success" | "error" }>;
};

export default async function TributeMessagesPage({
  params,
  searchParams,
}: TributeMessagesPageProps) {
  const { slug } = await params;
  const { notice, tone } = await searchParams;
  await requireAdminSession(`/dashboard/${slug}/messages`);
  const tribute = await getTributeRecord(slug);

  if (!tribute) {
    notFound();
  }

  const messages = await getMessagesForAdmin(slug);
  let privateMessagesError: string | null = null;
  let privateMessages = [] as Awaited<ReturnType<typeof getFamilyPrivateMessagesForAdmin>>;
  try {
    privateMessages = await getFamilyPrivateMessagesForAdmin(slug);
  } catch (error) {
    privateMessagesError =
      error instanceof Error ? error.message : "Unable to load private family messages.";
  }
  const redirectTo = `/dashboard/${slug}/messages`;

  return (
    <>
      <NoticeToast message={notice} tone={tone} />
      <section className="dashboard-section">
        <article className="form-card dashboard-section-header">
          <p className="card-label">Moderation Queue</p>
          <h2>Guest messages for {tribute.name}</h2>
          <p className="subtle-note">
            Review submissions, mark verification, and approve only what should appear on
            the public tribute.
          </p>
        </article>

        {messages.length === 0 ? (
          <article className="form-card">
            <h3>No messages yet</h3>
            <p>No submissions have been stored for this tribute.</p>
          </article>
        ) : (
          <ModerationQueue messages={messages} redirectTo={redirectTo} />
        )}

        {privateMessagesError ? (
          <article className="form-card">
            <h3>Private inbox not ready</h3>
            <p>{privateMessagesError}</p>
          </article>
        ) : (
          <PrivateSubmissionsManager messages={privateMessages} redirectTo={redirectTo} />
        )}
      </section>
    </>
  );
}
