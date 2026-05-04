import { redirect } from "next/navigation";
import { ModerationQueue } from "@/components/moderation-queue";
import { NoticeToast } from "@/components/notice-toast";
import { getMessagesForAdmin } from "@/lib/messages";

type AdminPageProps = {
  searchParams: Promise<{ token?: string; notice?: string; tone?: "success" | "error" }>;
};

export default async function AdminMessagesPage({ searchParams }: AdminPageProps) {
  const { token, notice, tone } = await searchParams;

  if (!process.env.BIOTRIBUTE_ADMIN_TOKEN || token !== process.env.BIOTRIBUTE_ADMIN_TOKEN) {
    redirect("/");
  }

  const messages = await getMessagesForAdmin();

  return (
    <main className="landing-shell">
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
        <ModerationQueue messages={messages} token={token} />
      )}
    </main>
  );
}
