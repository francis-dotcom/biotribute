import { notFound } from "next/navigation";
import {
  getTributeThemePreset,
  tributeThemePresets,
} from "@/data/tributes";
import { requireAdminToken } from "@/lib/admin";
import { getTributeRecord } from "@/lib/tributes-store";

type TributeThemePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function TributeThemePage({
  params,
  searchParams,
}: TributeThemePageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  requireAdminToken(token, `/${slug}`);
  const tribute = await getTributeRecord(slug);

  if (!tribute) {
    notFound();
  }

  const activeTheme = getTributeThemePreset(tribute.theme);

  return (
    <section className="dashboard-section">
      <article className="form-card">
        <p className="card-label">Theme</p>
        <h2>Visual preference</h2>
        <p className="subtle-note">
          Choose the memorial palette that best reflects the family&apos;s preference.
          The public tribute page reads from this tribute theme.
        </p>
      </article>

      <section className="theme-grid">
        {tributeThemePresets.map((theme) => (
          <article className="theme-card" key={theme.id}>
            <div
              className={`theme-preview${theme.id === activeTheme.id ? " is-active" : ""}`}
              style={{
                background: `linear-gradient(180deg, ${theme.variables["--bg"]} 0%, ${theme.variables["--bg-2"]} 100%)`,
              }}
            >
              <div
                className="theme-preview-card"
                style={{
                  background: theme.variables["--panel-solid"],
                  borderColor: theme.variables["--line"],
                }}
              >
                <div
                  className="theme-preview-dot"
                  style={{ background: theme.variables["--gold"] }}
                />
                <div className="theme-preview-lines">
                  <span style={{ background: theme.variables["--text"] }} />
                  <span style={{ background: theme.variables["--muted"] }} />
                  <span style={{ background: theme.variables["--gold-soft"] }} />
                </div>
              </div>
            </div>

            <p className="card-label">
              {theme.id === activeTheme.id ? "Current Theme" : "Theme Option"}
            </p>
            <h3>{theme.name}</h3>
            <p>{theme.description}</p>
            {theme.id === activeTheme.id ? (
              <div className="dashboard-info-banner">This tribute currently uses this theme.</div>
            ) : (
              <div className="dashboard-info-banner">
                Theme switching is now modeled in the dashboard. Persisting theme changes
                from this screen is the next backend step.
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
