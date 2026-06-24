import Image from "next/image";
import Link from "next/link";

const features = [
  ["♡", "Memorial tribute page", "A dedicated page to celebrate and remember a loved one."],
  ["▦", "Biography", "Tell their life story with chapters, dates, and milestones."],
  ["▣", "Photo gallery", "Collect and share treasured photos from across the family."],
  ["◐", "Video memories", "Preserve voices and moments with uploaded video clips."],
  ["✉", "Guestbook", "Invite friends to leave condolences, notes, and memories."],
  ["♧", "Family tree", "Map relationships and connect generations together."],
  ["⛓", "Donation link", "Direct loved ones to a charity or memorial fund."],
  ["⌘", "QR code", "Link printed funeral programs straight to the tribute page."],
];

const familyMembers = [
  ["M", "Maria Okafor", "Daughter"],
  ["T", "Tunde Okafor", "Son"],
  ["A", "Ada Okafor", "Granddaughter"],
  ["J", "James Okafor", "Brother"],
];

const posts = [
  [
    "M",
    "Maria Okafor",
    "2 days ago",
    "Found this photo of Dad at the lake house, summer 1998. He loved it there.",
    "24",
    "James Okafor: I remember that day so well.",
  ],
  [
    "T",
    "Tunde Okafor",
    "5 days ago",
    "Lit a candle for Mum this morning. Thinking of all of you today.",
    "18",
    "Ada: Sending love to everyone.",
  ],
];

function Navbar() {
  return (
    <header className="bt-nav">
      <Link className="bt-brand" href="/">
        <span className="bt-mark" aria-hidden="true">
          ✽
        </span>
        <span>BioTribute</span>
      </Link>
      <nav className="bt-links" aria-label="Landing page">
        <a href="#how-it-works">How it works</a>
        <a href="#examples">Examples</a>
        <a href="#pricing">Pricing</a>
        <Link href="/login">Sign in</Link>
      </nav>
      <Link className="bt-btn bt-btn-primary" href="/signup">
        Create Free Account
      </Link>
    </header>
  );
}

function Hero() {
  return (
    <section className="bt-hero" id="how-it-works">
      <div className="bt-badge">A place to remember, together</div>
      <h1>Create a Living Memorial Page for Someone You Love</h1>
      <p>
        BioTribute helps families preserve stories, photos, videos, prayers, and memories in one
        beautiful place - private or public.
      </p>
      <div className="bt-actions">
        <Link className="bt-btn bt-btn-primary" href="/signup">
          Create Account
        </Link>
        <Link className="bt-btn bt-btn-outline" href="/login">
          Sign In
        </Link>
      </div>
      <small>Start free. No credit card required.</small>
      <div className="bt-hero-photo">
        <Image
          src="/biotribute-reference-hero.png"
          alt="Memorial candles and keepsakes"
          fill
          priority
          sizes="(max-width: 960px) 82vw, 790px"
        />
      </div>
    </section>
  );
}

function TributePreview() {
  return (
    <div className="bt-preview-card" id="examples">
      <div className="bt-cover" />
      <div className="bt-preview-body">
        <div className="bt-preview-head">
          <div className="bt-portrait" />
          <div>
            <p className="bt-memory-label">In loving memory</p>
            <h3>Margaret Eleanor Hayes</h3>
            <p className="bt-muted">1942 - 2024 | Beloved mother and grandmother</p>
          </div>
        </div>
        <div className="bt-tabs" aria-label="Example tribute sections">
          <span>Story</span>
          <span>Gallery</span>
          <span>Guestbook</span>
          <span>Timeline</span>
          <span>Family</span>
        </div>
        <div className="bt-gallery-strip" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="bt-guestbook">
          <div className="bt-avatar">DA</div>
          <div>
            <strong>David A. | Son</strong>
            <p>Mom, your kitchen always smelled of cinnamon. We miss you every single day.</p>
          </div>
        </div>
        <div className="bt-timeline">
          <p>
            <b>1965</b> Married James in Savannah
          </p>
          <p>
            <b>1971</b> Welcomed her first child
          </p>
        </div>
        <div className="bt-family-row">
          <span>JH</span>
          <span>DA</span>
          <span>SM</span>
          <em>12 family members contributing</em>
        </div>
      </div>
    </div>
  );
}

function SignupCard() {
  return (
    <form className="bt-signup-card">
      <h2>Create your BioTribute account</h2>
      <p className="bt-muted">It&apos;s free to start. No credit card required.</p>
      <label>
        Full name
        <input placeholder="Jane Doe" />
      </label>
      <label>
        Email
        <input type="email" placeholder="jane@email.com" />
      </label>
      <label>
        Password
        <input type="password" placeholder="Password" />
      </label>
      <label>
        Confirm password
        <input type="password" placeholder="Password" />
      </label>
      <Link className="bt-btn bt-btn-primary bt-full" href="/signup">
        Create Account
      </Link>
      <p className="bt-signin">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}

function StartSection() {
  return (
    <section className="bt-start-section">
      <p className="bt-overline">Get started</p>
      <h2>Start preserving memories today</h2>
      <p className="bt-section-subtitle">
        Build a private or public tribute page in minutes. Keep exactly what you love in one
        graceful place.
      </p>
      <div className="bt-start-grid">
        <TributePreview />
        <SignupCard />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="bt-section">
      <h2>What you can create</h2>
      <p className="bt-section-subtitle">
        Everything a family needs to honor a life - gathered together in one beautiful, lasting
        place.
      </p>
      <div className="bt-feature-grid">
        {features.map(([icon, title, description]) => (
          <article className="bt-feature" key={title}>
            <div className="bt-feature-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MemoryFeed() {
  return (
    <section className="bt-memory-section">
      <div className="bt-memory-copy">
        <h2>A private family memory space</h2>
        <p>
          After you sign up, your family gets a shared, invite-only space - a gentle social feed to
          post memories, leave comments, and gather around the people you love.
        </p>
      </div>
      <div className="bt-feed-layout">
        <div className="bt-feed-card">
          <div className="bt-composer">
            <div className="bt-avatar">You</div>
            <input placeholder="Share a memory with the family..." />
            <button type="button">Post</button>
          </div>
          {posts.map(([initial, name, date, body, likes, comment]) => (
            <div className="bt-post" key={name}>
              <div className="bt-avatar">{initial}</div>
              <div>
                <div className="bt-post-head">
                  <strong>{name}</strong>
                  <span>{date}</span>
                </div>
                <p>{body}</p>
                <div className="bt-post-stats">{likes} likes</div>
                <div className="bt-comment">{comment}</div>
              </div>
            </div>
          ))}
        </div>
        <aside className="bt-side-stack">
          <div className="bt-side-card">
            <h3>Invited family</h3>
            {familyMembers.map(([initial, name, relationship]) => (
              <div className="bt-person" key={name}>
                <span>{initial}</span>
                <div>
                  {name}
                  <small>{relationship}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="bt-side-card">
            <h3>Anniversary reminders</h3>
            <div className="bt-reminder">
              Dad&apos;s birthday <small>July 12</small>
            </div>
            <div className="bt-reminder">
              One year remembrance <small>Aug 3</small>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bt-cta" id="pricing">
      <h2>Create a Living Memorial Page for Someone You Love</h2>
      <p>BioTribute helps families preserve stories, photos, videos, prayers, and memories in one beautiful place - private or public.</p>
      <div className="bt-actions">
        <Link className="bt-btn bt-btn-primary" href="/signup">
          Create Free Account
        </Link>
        <Link className="bt-btn bt-btn-outline" href="/login">
          Sign In
        </Link>
      </div>
      <small>Start free. No credit card required.</small>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bt-footer">
      <Link className="bt-brand" href="/">
        <span>BioTribute</span>
      </Link>
      <nav aria-label="Footer links">
        <a href="#how-it-works">How it works</a>
        <a href="#examples">Examples</a>
        <a href="#pricing">Pricing</a>
        <Link href="/login">Sign in</Link>
      </nav>
      <p>© 2026 BioTribute</p>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="bt-landing">
      <Navbar />
      <main>
        <Hero />
        <StartSection />
        <Features />
        <MemoryFeed />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
