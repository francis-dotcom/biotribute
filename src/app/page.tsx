import Link from "next/link";
import { tributes } from "@/data/tributes";

const featuredTribute = tributes[0];

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="product-nav">
        <p className="landing-kicker">bioTributes</p>
        <div className="product-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#example">Example</a>
          <Link href="/login">Sign In</Link>
        </div>
      </section>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="card-label">A free memorial page</p>
          <h1>Create a beautiful tribute page for someone you love.</h1>
          <p className="landing-copy">
            A calm, private space to share their story, gather memories from family and
            friends, and keep their life close — ready to share in minutes.
          </p>
          <div className="home-hero-actions">
            <Link className="button-primary" href="/signup">
              Create a Free Tribute
            </Link>
            <Link className="button-secondary" href={`/${featuredTribute.slug}`}>
              See a Live Example
            </Link>
          </div>
          <ul className="home-reassurance">
            <li>Free to create</li>
            <li>You approve every message</li>
            <li>Private console only you can access</li>
          </ul>
        </div>

        <div className="home-preview">
          <div className="home-preview-card">
            <p className="home-preview-kicker">Preview</p>
            <div className="home-preview-portrait" />
            <h3>In Loving Memory of Eleanor James</h3>
            <p className="home-preview-years">1948 – 2024</p>
            <div className="home-preview-quote">
              &ldquo;She had a way of making every room feel warmer. We carry that with us
              always.&rdquo;
              <span>— Shared by family</span>
            </div>
          </div>
          <span className="home-preview-badge">Made with bioTributes</span>
        </div>
      </section>

      <section className="home-trust-row">
        <span>No ads on tribute pages</span>
        <span>Unlimited photos &amp; videos</span>
        <span>Moderated guestbook</span>
        <span>11 page themes to choose from</span>
      </section>

      <section className="landing-grid" id="features">
        <div className="home-section-head">
          <p className="card-label">Why families choose bioTributes</p>
          <h2>Everything you need, nothing you don&apos;t.</h2>
        </div>
        <article className="landing-card">
          <span className="home-feature-icon" aria-hidden="true">
            ✍
          </span>
          <h3>Tell their story</h3>
          <p>Add a life story, a timeline of milestones, and the moments that mattered most.</p>
        </article>
        <article className="landing-card">
          <span className="home-feature-icon" aria-hidden="true">
            ✉
          </span>
          <h3>Gather memories together</h3>
          <p>Friends and family can leave messages — you decide what gets shown publicly.</p>
        </article>
        <article className="landing-card">
          <span className="home-feature-icon" aria-hidden="true">
            ▣
          </span>
          <h3>Photos and videos, together</h3>
          <p>Build a gallery, share video memories, and link a livestream for the service.</p>
        </article>
        <article className="landing-card">
          <span className="home-feature-icon" aria-hidden="true">
            ◐
          </span>
          <h3>Always private, always yours</h3>
          <p>A private console only you can access — no shared logins, no public admin panel.</p>
        </article>
      </section>

      <section className="landing-solid-cta" id="how-it-works">
        <div className="home-section-head">
          <p className="card-label">How it works</p>
          <h2>From nothing to a finished page in three steps.</h2>
        </div>
        <div className="workflow-grid">
          <article className="soft-card workflow-card">
            <p className="card-label">Step 1</p>
            <h3>Create your tribute</h3>
            <p>Sign up and add a name, dates, and a few words to start the page.</p>
          </article>
          <article className="soft-card workflow-card">
            <p className="card-label">Step 2</p>
            <h3>Personalize it</h3>
            <p>Add their story, photos, a theme, and any service or livestream details.</p>
          </article>
          <article className="soft-card workflow-card">
            <p className="card-label">Step 3</p>
            <h3>Share the link</h3>
            <p>Send it to family and friends — they can read, watch, and leave a message.</p>
          </article>
        </div>
      </section>

      <section className="landing-solid-cta" id="example">
        <div className="home-example-card">
          <div className="home-example-card-copy">
            <p className="card-label">See it in action</p>
            <h3>Take a look at a real tribute page.</h3>
            <p>
              Walk through a finished page — story, timeline, gallery, and guestbook — before
              you create your own.
            </p>
          </div>
          <Link className="button-secondary" href={`/${featuredTribute.slug}`}>
            View Example Tribute
          </Link>
        </div>
      </section>

      <section className="landing-solid-cta">
        <p className="card-label">Get started</p>
        <h2>Start a tribute today.</h2>
        <p>It only takes a few minutes, and you can keep adding to it for as long as you like.</p>
        <div className="landing-actions">
          <Link className="button-primary" href="/signup">
            Create a Free Tribute
          </Link>
          <Link className="button-secondary" href="/console-login?next=%2Fconsole&force=1">
            Admin Console
          </Link>
        </div>
      </section>
    </main>
  );
}
