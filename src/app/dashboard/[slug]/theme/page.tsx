import { notFound } from "next/navigation";
import {
  getTributeThemePreset,
  tributeThemePresets,
} from "@/data/tributes";
import {
  themeCardBodyStyle,
  themeCardChromeStyle,
  themeCardHeadingStyle,
  themePreviewBackdropStyle,
} from "@/lib/theme-card-styles";
import { requireAdminSession } from "@/lib/admin";
import { getTributeRecord } from "@/lib/tributes-store";

type TributeThemePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TributeThemePage({
  params,
}: TributeThemePageProps) {
  const { slug } = await params;
  await requireAdminSession(`/dashboard/${slug}/theme`);
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
          The public tribute page reads from this tribute theme. {tributeThemePresets.length}{" "}
          palettes are listed; scroll if cards wrap on a narrow window.
        </p>
      </article>

      <section className="theme-grid">
        {tributeThemePresets.map((theme) => (
          <article
            className="theme-card"
            key={theme.id}
            style={themeCardChromeStyle(theme.variables)}
          >
            <div
              className={`theme-preview${theme.id === activeTheme.id ? " is-active" : ""}`}
              style={{
                ...themePreviewBackdropStyle(theme.variables),
                borderWidth: 1,
                borderStyle: "solid",
              }}
            >
              <div
                className="theme-preview-card"
                style={{
                  background: theme.variables["--panel-solid"],
                  borderColor: theme.variables["--line"],
                  boxShadow:
                    /^#[0-9a-fA-F]{6}$/i.test(theme.variables["--gold"] ?? "")
                      ? `0 0 0 1px ${theme.variables["--gold"]}38`
                      : undefined,
                }}
              >
                <div
                  className="theme-preview-dot"
                  style={{
                    background: theme.variables["--gold"],
                    boxShadow:
                      /^#[0-9a-fA-F]{6}$/i.test(theme.variables["--gold-deep"] ?? "")
                        ? `0 0 0 2px ${theme.variables["--panel-solid"]}, 0 0 14px ${theme.variables["--gold-deep"]}44`
                        : `0 0 0 2px ${theme.variables["--panel-solid"]}`,
                  }}
                />
                <div className="theme-preview-lines">
                  <span style={{ background: theme.variables["--text"] }} />
                  <span style={{ background: theme.variables["--muted"] }} />
                  <span style={{ background: theme.variables["--gold"] }} />
                </div>
              </div>
            </div>

            <p className="card-label">
              {theme.id === activeTheme.id ? "Current Theme" : "Theme Option"}
            </p>
            <h3 style={themeCardHeadingStyle(theme.variables)}>{theme.name}</h3>
            <p style={themeCardBodyStyle(theme.variables)}>{theme.description}</p>
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
