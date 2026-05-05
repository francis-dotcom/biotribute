import Link from "next/link";
import { tributes } from "@/data/tributes";

const featuredTribute = tributes[0];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="product-nav">
        <p className="landing-kicker">bioTributes</p>
        <div className="product-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#launch-plan">Launch plan</a>
        </div>
      </section>

      <section className="landing-hero product-hero">
        <p className="card-label">Memorial Platform</p>
        <h1>A real memorial product, not just a tribute mockup.</h1>
        <p className="landing-copy">
          bioTributes gives families a calm public tribute page, a private owner
          console, moderated guest submissions, and launch-ready workflows from one
          product surface.
        </p>
        <div className="landing-actions">
          <Link className="button-primary" href={`/${featuredTribute.slug}`}>
            View Product Demo
          </Link>
          <a className="button-secondary" href="/console/SirFemiOgini">
            Open Console
          </a>
        </div>
        <div className="product-proof-grid">
          <article className="landing-card">
            <p className="card-label">Public experience</p>
            <h2>Mobile-first tribute route</h2>
            <p>Fast, readable, shareable page with story, media, and support actions.</p>
          </article>
          <article className="landing-card">
            <p className="card-label">Owner console</p>
            <h2>One place to manage everything</h2>
            <p>Content, images, timeline, card/messages inbox, and launch settings.</p>
          </article>
        </div>
      </section>

      <section className="landing-grid" id="features">
        <article className="landing-card">
          <p className="card-label">Feature</p>
          <h2>Theme-aware page builder</h2>
          <p>Update biography, timeline, media, support note, and featured tributes.</p>
        </article>
        <article className="landing-card">
          <p className="card-label">Feature</p>
          <h2>Moderation queue</h2>
          <p>Approve or reject public guestbook posts before they appear live.</p>
        </article>
        <article className="landing-card">
          <p className="card-label">Feature</p>
          <h2>Private inbox for family</h2>
          <p>Card + Message submissions are captured privately in console inbox.</p>
        </article>
        <article className="landing-card">
          <p className="card-label">Feature</p>
          <h2>Email verification logic</h2>
          <p>Unverified emails confirm first; verified senders can post immediately.</p>
        </article>
        <article className="landing-card">
          <p className="card-label">Feature</p>
          <h2>Media persistence</h2>
          <p>Hero, gallery, video placeholders, and livestream assets stored in Supabase.</p>
        </article>
        <article className="landing-card">
          <p className="card-label">Feature</p>
          <h2>Launch-ready routing</h2>
          <p>Canonical route flow with console, dashboard, and public tribute paths.</p>
        </article>
      </section>

      <section className="landing-solid-cta" id="workflow">
        <p className="card-label">How It Works</p>
        <h2>From setup to launch in 3 clear steps.</h2>
        <div className="workflow-grid">
          <article className="soft-card workflow-card">
            <p className="card-label">Step 1</p>
            <h3>Build the tribute</h3>
            <p>Use console to add story, timeline, images, videos, and support details.</p>
          </article>
          <article className="soft-card workflow-card">
            <p className="card-label">Step 2</p>
            <h3>Review submissions</h3>
            <p>Moderate public messages and monitor private cards/messages in inbox.</p>
          </article>
          <article className="soft-card workflow-card">
            <p className="card-label">Step 3</p>
            <h3>Launch and share</h3>
            <p>Publish the route, share link with family/community, continue updating.</p>
          </article>
        </div>
      </section>

      <section className="landing-grid" id="launch-plan">
        <article className="landing-card">
          <p className="card-label">Now</p>
          <h2>Ship with core workflows</h2>
          <p>
            Keep current tribute + console + moderation + private inbox flow as the
            stable launch slice.
          </p>
        </article>
        <article className="landing-card">
          <p className="card-label">Next</p>
          <h2>Add account system + invitations</h2>
          <p>Move from single owner to role-based access for family and contributors.</p>
        </article>
        <article className="landing-card">
          <p className="card-label">Then</p>
          <h2>Scale media + payments</h2>
          <p>Finalize scalable media pipeline and productized support contributions.</p>
        </article>
      </section>

      <section className="landing-solid-cta">
        <p className="card-label">Final CTA</p>
        <h2>Ready to make this production solid?</h2>
        <p>
          Start from the working memorial product experience and harden each slice with
          clear launch checkpoints.
        </p>
        <div className="landing-actions">
          <Link className="button-primary" href={`/${featuredTribute.slug}`}>
            Open Tribute Demo
          </Link>
          <a className="button-secondary" href="/console/SirFemiOgini">
            Go to Console
          </a>
        </div>
      </section>
    </main>
  );
}
