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
    <main className="landing-shell">
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes</p>
        <h1>Sign in</h1>
        <p className="landing-copy">Sign in to manage your tribute page.</p>
      </section>

      <section className="dashboard-section">
        {isUserAuthConfigured() ? (
          <AuthForm mode="login" nextPath={nextPath} />
        ) : (
          <p className="subtle-note">Account sign-in is not configured yet.</p>
        )}
        <p className="subtle-note">
          New here? <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create an account</Link>
        </p>
        <Link className="button-secondary" href="/">
          Back to site
        </Link>
      </section>
    </main>
  );
}
