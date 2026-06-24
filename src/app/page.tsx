import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LandingAuthCard } from "@/components/landing-auth-card";
import { isUserAuthConfigured } from "@/lib/supabase-server";

type HomePageProps = {
  searchParams: Promise<{ auth?: string }>;
};

const features: Array<{
  icon: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
}> = [
  {
    icon: "♡",
    title: "Memorial tribute page",
    description: "A dedicated page to celebrate and remember a loved one.",
    image: "/biotribute-reference-preview.png",
    alt: "Memorial candles and flowers on a BioTribute page",
  },
  {
    icon: "▦",
    title: "Biography",
    description: "Tell their life story with chapters, dates, and milestones.",
    image: "/biotribute-landing-memory.png",
    alt: "Family writing a life story on a BioTribute tribute page",
    imagePosition: "48% 36%",
  },
  {
    icon: "▣",
    title: "Photo gallery",
    description: "Collect and share treasured photos from across the family.",
    image: "/feature-images/gallery.jpg",
    alt: "Family photo album gathered for a BioTribute gallery",
    imagePosition: "center 55%",
  },
  {
    icon: "◐",
    title: "Video memories",
    description: "Preserve voices and moments with uploaded video clips.",
    image: "/feature-images/video-tribute.svg",
    alt: "Video memory playback on BioTribute",
    imageFit: "contain",
  },
  {
    icon: "✉",
    title: "Guestbook",
    description: "Invite friends to leave condolences, notes, and memories.",
    image: "/condolence-exact.png",
    alt: "Condolence card shared through BioTribute",
    imageFit: "contain",
  },
  {
    icon: "♧",
    title: "Family tree",
    description: "Map relationships and connect generations together.",
    image: "/feature-images/family-tree.jpg",
    alt: "Family tree chart connecting generations on BioTribute",
    imagePosition: "center 42%",
  },
  {
    icon: "⛓",
    title: "Donation link",
    description: "Direct loved ones to a charity or memorial fund.",
    image: "/feature-images/donation-tribute.svg",
    alt: "Donation support for the family on BioTribute",
    imageFit: "contain",
  },
  {
    icon: "⌘",
    title: "QR code",
    description: "Link printed funeral programs straight to the tribute page.",
    image: "/feature-images/qr-tribute.svg",
    alt: "QR code on a memorial program linking to BioTribute",
    imageFit: "contain",
  },
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
        <Link href="/?auth=login#create-account">Sign in</Link>
      </nav>
      <Link className="bt-btn bt-btn-primary" href="/?auth=signup#create-account">
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
        <Link className="bt-btn bt-btn-primary" href="/?auth=signup#create-account">
          Create Account
        </Link>
        <Link className="bt-btn bt-btn-outline" href="/?auth=login#create-account">
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

function StartSection({
  initialAuthMode,
  isAuthConfigured,
}: {
  initialAuthMode: "signup" | "login";
  isAuthConfigured: boolean;
}) {
  return (
    <section className="bt-start-section" id="create-account">
      <p className="bt-overline">Get started</p>
      <h2>Start preserving memories today</h2>
      <p className="bt-section-subtitle">
        Build a private or public tribute page in minutes. Keep exactly what you love in one
        graceful place.
      </p>
      <div className="bt-start-grid">
        <TributePreview />
        <LandingAuthCard
          initialMode={initialAuthMode}
          isConfigured={isAuthConfigured}
          key={initialAuthMode}
        />
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
        {features.map((feature) => (
          <article className="bt-feature" key={feature.title}>
            <div
              className={`bt-feature-image${
                feature.imageFit === "contain" ? " is-card-image is-illustration" : ""
              }`}
            >
              <Image
                src={feature.image}
                alt={feature.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className={`bt-feature-photo${feature.imageFit === "contain" ? " is-contain" : ""}`}
                style={
                  feature.imagePosition
                    ? ({ objectPosition: feature.imagePosition } as CSSProperties)
                    : undefined
                }
              />
              <div className="bt-feature-image-shade" aria-hidden="true" />
              <div className="bt-feature-icon">{feature.icon}</div>
            </div>
            <div className="bt-feature-copy">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
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
        <Link className="bt-btn bt-btn-primary" href="/?auth=signup#create-account">
          Create Free Account
        </Link>
        <Link className="bt-btn bt-btn-outline" href="/?auth=login#create-account">
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
        <Link href="/?auth=login#create-account">Sign in</Link>
      </nav>
      <p>© 2026 BioTribute</p>
    </footer>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { auth } = await searchParams;
  const initialAuthMode = auth === "login" ? "login" : "signup";

  return (
    <div className="bt-landing">
      <Navbar />
      <main>
        <Hero />
        <StartSection
          initialAuthMode={initialAuthMode}
          isAuthConfigured={isUserAuthConfigured()}
        />
        <Features />
        <MemoryFeed />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
