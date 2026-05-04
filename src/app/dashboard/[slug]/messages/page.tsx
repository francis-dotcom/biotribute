import { notFound } from "next/navigation";
import { ModerationQueue } from "@/components/moderation-queue";
import { NoticeToast } from "@/components/notice-toast";
import { requireAdminToken } from "@/lib/admin";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord } from "@/lib/tributes-store";

type TributeMessagesPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; notice?: string; tone?: "success" | "error" }>;
};

export default async function TributeMessagesPage({
  params,
  searchParams,
}: TributeMessagesPageProps) {
  const { slug } = await params;
  const { token, notice, tone } = await searchParams;
  requireAdminToken(token, `/${slug}`);
  const tribute = await getTributeRecord(slug);

  if (!tribute) {
    notFound();
  }

  const messages = await getMessagesForAdmin(slug);
  const redirectTo = `/dashboard/${slug}/messages?token=${encodeURIComponent(token ?? "")}`;

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
          <ModerationQueue messages={messages} token={token} redirectTo={redirectTo} />
        )}
      </section>
    </>
  );
}
