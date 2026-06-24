import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { NewTributeForm } from "@/components/new-tribute-form";
import { isAdminAuthenticated } from "@/lib/admin";
import { requireUserSession } from "@/lib/user-auth";
import { getTributeOwnedByUser, isTributeStoreConfigured } from "@/lib/tributes-store";

export default async function NewTributePage() {
  const isAdmin = await isAdminAuthenticated();
  const user = isAdmin ? null : await requireUserSession("/console/new");

  if (user) {
    const ownedTribute = await getTributeOwnedByUser(user.id);
    if (ownedTribute) {
      redirect(`/console/${ownedTribute.slug}`);
    }
  }

  const storeConfigured = isTributeStoreConfigured();

  return (
    <main className="landing-shell console-shell dashboard-theme-shell">
      <AdminSessionGuard />
      <section className="landing-hero admin-shell dashboard-hero">
        <p className="landing-kicker">bioTributes Console</p>
        <h1>New Tribute</h1>
        <p className="landing-copy">
          Create a blank tribute page, then add the full story, photos, and theme in the builder.
        </p>
        <Link className="button-secondary" href="/console">
          Back to console
        </Link>
      </section>

      <section className="dashboard-section">
        {storeConfigured ? (
          <NewTributeForm ownerUserId={user?.id} />
        ) : (
          <p className="subtle-note">
            Supabase is not configured, so new tributes cannot be created yet. Set
            SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable this.
          </p>
        )}
      </section>
    </main>
  );
}
