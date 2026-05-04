import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin";

type ConsoleLoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function ConsoleLoginPage({ searchParams }: ConsoleLoginPageProps) {
  const { error, next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/console/SirFemiOgini";

  if (await isAdminAuthenticated()) {
    redirect(nextPath);
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes Console</p>
        <h1>Sign in</h1>
        <p className="landing-copy">
          Enter your console password to manage tributes, moderation, media, and theme.
        </p>
      </section>

      <section className="dashboard-section">
        <article className="form-card login-card">
          <h2>Console access</h2>
          <p className="subtle-note">
            This signs you into the private BioTributes console on this browser.
          </p>
          {error ? <p className="form-status">{error}</p> : null}
          <form className="login-form" action="/api/admin/session" method="post">
            <input type="hidden" name="next" value={nextPath} />
            <label className="field-block">
              <span>Password</span>
              <input name="password" type="password" required autoFocus />
            </label>
            <button className="button-primary" type="submit">
              Sign in
            </button>
          </form>
          <p className="subtle-note">
            After sign-in you will stay logged in on this device until you sign out.
          </p>
          <Link className="button-secondary" href="/">
            Back to site
          </Link>
        </article>
      </section>
    </main>
  );
}
