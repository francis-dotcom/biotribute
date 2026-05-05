import Link from "next/link";
import { tributes } from "@/data/tributes";

const featuredTribute = tributes[0];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="landing-kicker">bioTributes</p>
        <h1>Honor Their Life. Share Their Legacy.</h1>
        <p className="landing-copy">
          Preserve a loved one&apos;s story with a memorial page designed to feel
          personal, calm, and easy to share across family and community.
        </p>
        <div className="landing-proof">
          <span>Mobile-first tribute route</span>
          <span>Owner console for content + media</span>
          <span>Moderated messages before publish</span>
        </div>
        <div className="landing-actions">
          <Link className="button-primary" href={`/${featuredTribute.slug}`}>
            View Tribute Demo
          </Link>
          <a className="button-secondary" href="#next-steps">
            Launch Plan
          </a>
        </div>
      </section>

      <section className="landing-grid">
        <article className="landing-card">
          <p className="card-label">Ready Now</p>
          <h2>Mobile-first public tribute page</h2>
          <p>
            Your current memorial page is now represented as a real route under the
            app instead of a static mockup.
          </p>
          <ul className="landing-checklist">
            <li>Shareable public URL per tribute</li>
            <li>Clean sections for story, photos, timeline, and support</li>
            <li>Message moderation workflow already in place</li>
          </ul>
        </article>
        <article className="landing-card">
          <p className="card-label">Tomorrow’s Launch</p>
          <h2>Fastest path to live</h2>
          <p>
            Deploy this to Vercel, keep content hardcoded for now, then add auth,
            dashboard, uploads, and payments immediately after launch.
          </p>
          <ul className="landing-checklist">
            <li>Deploy current repo with existing route structure</li>
            <li>Use console workflow for owner-managed updates</li>
            <li>Add product layers incrementally after go-live</li>
          </ul>
        </article>
        <article className="landing-card" id="next-steps">
          <p className="card-label">Next Build Slice</p>
          <h2>Productize in stages</h2>
          <p>
            Add Supabase for auth and data, Cloudinary for media, and Stripe Checkout
            for support contributions once the public page is approved.
          </p>
          <ul className="landing-checklist">
            <li>Auth + role access for family/admin accounts</li>
            <li>Media pipelines for scalable photo/video upload</li>
            <li>Payments for tribute cards and contributions</li>
          </ul>
        </article>
      </section>

      <section className="landing-solid-cta">
        <p className="card-label">Launch Focus</p>
        <h2>Ship the tribute experience first.</h2>
        <p>
          Keep launch simple: publish a calm, reliable memorial page now, then layer
          in advanced features without disrupting the family experience.
        </p>
        <div className="landing-actions">
          <Link className="button-primary" href={`/${featuredTribute.slug}`}>
            Open Live Tribute Demo
          </Link>
          <a className="button-secondary" href="/console/SirFemiOgini">
            Open Owner Console
          </a>
        </div>
      </section>
    </main>
  );
}
