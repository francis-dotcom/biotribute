import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { isUserAuthConfigured } from "@/lib/supabase-server";

type SignupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/console/new";

  return (
    <main className="bt-auth-page">
      <Link className="bt-auth-brand" href="/">
        <span className="bt-auth-mark" aria-hidden="true">
          ✽
        </span>
        <span>BioTribute</span>
      </Link>
      <section className="bt-auth-shell">
        <div className="bt-auth-copy">
          <p className="bt-auth-kicker">Start preserving memories</p>
          <h1>Create your BioTribute account</h1>
          <p>
            Build a private or public tribute page with photos, memories, guestbook messages, and a
            calm family space.
          </p>
          <div className="bt-auth-image" aria-hidden="true" />
        </div>
        <div className="bt-auth-panel">
          {isUserAuthConfigured() ? (
            <AuthForm mode="signup" nextPath={nextPath} />
          ) : (
            <p className="bt-auth-note">Account creation is not configured yet.</p>
          )}
          <p className="bt-auth-note">
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Sign in</Link>
          </p>
          <Link className="bt-auth-back" href="/">
            Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
