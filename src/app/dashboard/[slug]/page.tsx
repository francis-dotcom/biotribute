import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminToken } from "@/lib/admin";
import { getMessagesForAdmin } from "@/lib/messages";
import { getTributeRecord } from "@/lib/tributes-store";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  requireAdminToken(token, `/biotribute/${slug}`);
  const tribute = await getTributeRecord(slug);

  if (!tribute) {
    notFound();
  }

  const messages = await getMessagesForAdmin(slug);
  const approved = messages.filter((message) => message.status === "approved").length;
  const pending = messages.filter((message) => message.status.startsWith("pending")).length;
  const tokenQuery = `?token=${encodeURIComponent(token ?? "")}`;

  return (
    <section className="dashboard-grid">
      <article className="dashboard-card">
        <p className="card-label">Public Page</p>
        <h2>{tribute.slug}</h2>
        <p>
          This tribute is currently available at the dynamic route
          <strong> /biotribute/{tribute.slug}</strong>. You can later map this to a cleaner
          public route like <strong>/{tribute.slug}</strong>.
        </p>
        <Link className="button-secondary" href={`/biotribute/${tribute.slug}`}>
          View Public Tribute
        </Link>
      </article>

      <article className="dashboard-card">
        <p className="card-label">Page Builder</p>
        <h2>All tribute sections</h2>
        <p>
          Open one working page to manage biography, timeline, contributors, images,
          gallery, and launch actions together.
        </p>
        <Link className="button-primary" href={`/dashboard/${slug}/builder${tokenQuery}`}>
          Open Builder
        </Link>
      </article>

      <article className="dashboard-card">
        <p className="card-label">Messages</p>
        <h2>{messages.length}</h2>
        <p>
          {pending} pending and {approved} approved. Moderate guest submissions before
          they appear publicly.
        </p>
        <Link className="button-primary" href={`/dashboard/${slug}/messages${tokenQuery}`}>
          Open Moderation
        </Link>
      </article>

      <article className="dashboard-card">
        <p className="card-label">Images</p>
        <h2>Hero + Background</h2>
        <p>
          Set a main portrait and a separate background image so the public tribute and
          story modals can carry the same visual identity.
        </p>
        <Link className="button-secondary" href={`/dashboard/${slug}/gallery${tokenQuery}`}>
          Manage Images
        </Link>
      </article>

      <article className="dashboard-card dashboard-card-wide">
        <p className="card-label">Launch Checklist</p>
        <h2>Before going live</h2>
        <ul className="dashboard-list">
          <li>Replace placeholder life story and timeline with the real content.</li>
          <li>Add hero image and soft background image.</li>
          <li>Connect Resend for verification emails.</li>
          <li>Connect Turnstile for bot protection.</li>
          <li>Test submit → verify → approve → display.</li>
        </ul>
      </article>
    </section>
  );
}
