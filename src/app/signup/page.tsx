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
    <main className="landing-shell">
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes</p>
        <h1>Create your account</h1>
        <p className="landing-copy">
          Sign up to build your own tribute page — your story, your photos, your theme.
        </p>
      </section>

      <section className="dashboard-section">
        {isUserAuthConfigured() ? (
          <AuthForm mode="signup" nextPath={nextPath} />
        ) : (
          <p className="subtle-note">Account creation is not configured yet.</p>
        )}
        <p className="subtle-note">
          Already have an account? <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Sign in</Link>
        </p>
        <Link className="button-secondary" href="/">
          Back to site
        </Link>
      </section>
    </main>
  );
}
