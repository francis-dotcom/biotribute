import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { UserSignOutButton } from "@/components/user-sign-out-button";
import { isAdminAuthenticated } from "@/lib/admin";
import { getCurrentUser } from "@/lib/user-auth";
import { getTributeOwnedByUser, isTributeStoreConfigured, listAllTributes } from "@/lib/tributes-store";

export default async function ConsoleDashboardPage() {
  const isAdmin = await isAdminAuthenticated();
  const user = isAdmin ? null : await getCurrentUser();

  if (!isAdmin && !user) {
    redirect("/login?next=%2Fconsole");
  }

  const storeConfigured = isTributeStoreConfigured();

  if (isAdmin) {
    const tributes = await listAllTributes();

    return (
      <main className="landing-shell console-shell dashboard-theme-shell">
        <AdminSessionGuard />
        <section className="landing-hero admin-shell dashboard-hero">
          <p className="landing-kicker">bioTributes Console</p>
          <h1>Your tributes</h1>
          <p className="landing-copy">
            Manage every tribute page from one place, or start a new one for someone else.
          </p>
          <div className="console-quick-links">
            <Link className="button-primary" href="/console/new">
              New Tribute
            </Link>
            <form action="/api/admin/logout" method="post">
              <button className="button-secondary" type="submit">
                Sign out
              </button>
            </form>
          </div>
          {!storeConfigured ? (
            <p className="subtle-note">
              Supabase is not configured, so only the built-in sample tribute is shown and new
              tributes cannot be created yet.
            </p>
          ) : null}
        </section>

        <section className="dashboard-row-list">
          {tributes.length === 0 ? (
            <article className="dashboard-row">
              <div className="dashboard-row-main">
                <p className="card-label">No tributes yet</p>
                <h2>Create your first tribute</h2>
                <p>Start a new tribute to add a name, story, photos, and theme.</p>
              </div>
              <Link className="button-secondary" href="/console/new">
                New Tribute
              </Link>
            </article>
          ) : (
            tributes.map((tribute) => (
              <article className="dashboard-row" key={tribute.slug}>
                <div className="dashboard-row-main">
                  <p className="card-label">{tribute.years}</p>
                  <h2>{tribute.name}</h2>
                  <p>/{tribute.slug}</p>
                </div>
                <div className="console-quick-links">
                  <Link className="button-secondary" href={`/console/${tribute.slug}`}>
                    Open Console
                  </Link>
                  <Link className="button-secondary" href={`/${tribute.slug}`}>
                    View Public Page
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    );
  }

  const ownedTribute = user ? await getTributeOwnedByUser(user.id) : null;

  return (
    <main className="landing-shell console-shell dashboard-theme-shell">
      <AdminSessionGuard />
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes Console</p>
        <h1>Your tribute</h1>
        <p className="landing-copy">
          {ownedTribute
            ? "Manage your tribute page below."
            : "You haven't created a tribute yet."}
        </p>
        <div className="console-quick-links">
          <UserSignOutButton />
        </div>
      </section>

      <section className="dashboard-row-list">
        {ownedTribute ? (
          <article className="dashboard-row">
            <div className="dashboard-row-main">
              <p className="card-label">{ownedTribute.years}</p>
              <h2>{ownedTribute.name}</h2>
              <p>/{ownedTribute.slug}</p>
            </div>
            <div className="console-quick-links">
              <Link className="button-secondary" href={`/console/${ownedTribute.slug}`}>
                Open Console
              </Link>
              <Link className="button-secondary" href={`/${ownedTribute.slug}`}>
                View Public Page
              </Link>
            </div>
          </article>
        ) : (
          <article className="dashboard-row">
            <div className="dashboard-row-main">
              <p className="card-label">Get started</p>
              <h2>Create your tribute</h2>
              <p>Add a name, story, photos, and theme for your tribute page.</p>
            </div>
            <Link className="button-secondary" href="/console/new">
              New Tribute
            </Link>
          </article>
        )}
      </section>
    </main>
  );
}
