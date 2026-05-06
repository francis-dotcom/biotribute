import { ModerationQueue } from "@/components/moderation-queue";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { NoticeToast } from "@/components/notice-toast";
import { requireAdminSession } from "@/lib/admin";
import { getMessagesForAdmin } from "@/lib/messages";

type AdminPageProps = {
  searchParams: Promise<{ notice?: string; tone?: "success" | "error" }>;
};

export default async function AdminMessagesPage({ searchParams }: AdminPageProps) {
  const { notice, tone } = await searchParams;
  await requireAdminSession("/admin/messages");

  const messages = await getMessagesForAdmin();

  return (
    <main className="landing-shell">
      <AdminSessionGuard />
      <NoticeToast message={notice} tone={tone} />
      <section className="landing-hero admin-shell">
        <p className="landing-kicker">bioTributes Admin</p>
        <h1>Message Moderation</h1>
        <p className="landing-copy">
          Review submissions before they appear publicly on the tribute page.
        </p>
      </section>

      {messages.length === 0 ? (
        <article className="form-card">
          <h3>No messages yet</h3>
          <p>No submissions have been stored.</p>
        </article>
      ) : (
        <ModerationQueue messages={messages} />
      )}
    </main>
  );
}
