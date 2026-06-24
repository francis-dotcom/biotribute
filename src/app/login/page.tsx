import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { isUserAuthConfigured } from "@/lib/supabase-server";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/console";

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
          <p className="bt-auth-kicker">Welcome back</p>
          <h1>Sign in to manage your tribute page</h1>
          <p>
            Continue building the story, reviewing memories, and keeping the page ready for family
            and friends.
          </p>
          <div className="bt-auth-image" aria-hidden="true" />
        </div>
        <div className="bt-auth-panel">
          {isUserAuthConfigured() ? (
            <AuthForm mode="login" nextPath={nextPath} />
          ) : (
            <p className="bt-auth-note">Account sign-in is not configured yet.</p>
          )}
          <p className="bt-auth-note">
            New here?{" "}
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create an account</Link>
          </p>
          <Link className="bt-auth-back" href="/">
            Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
