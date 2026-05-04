import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="landing-kicker">bioTributes</p>
        <h1>That tribute page does not exist.</h1>
        <p className="landing-copy">
          The public route is missing or the slug has not been created yet.
        </p>
        <div className="landing-actions">
          <Link className="button-primary" href="/">
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
