"use client";

import { useMemo, useState } from "react";
import type { TributeRecord, TributeThemePreset } from "@/data/tributes";
import {
  themeAccentGhostButtonStyle,
  themeAccentSelectedButtonStyle,
  themeCardBodyStyle,
  themeCardChromeStyle,
  themeCardHeadingStyle,
  themePreviewBackdropStyle,
} from "@/lib/theme-card-styles";

type ThemeConsoleFormProps = {
  tribute: TributeRecord;
  presets: TributeThemePreset[];
};

export function ThemeConsoleForm({ tribute, presets }: ThemeConsoleFormProps) {
  const [selectedTheme, setSelectedTheme] = useState(tribute.theme);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function applyTheme() {
    setPending(true);
    setStatus(null);

    const response = await fetch(`/api/tributes/${tribute.slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug: tribute.slug,
        theme: selectedTheme,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setStatus(data.message ?? data.error ?? "Unable to save theme.");

    if (response.ok) {
      window.location.reload();
    }
  }

  const selectedVariables = useMemo(() => {
    return presets.find((preset) => preset.id === selectedTheme)?.variables ?? presets[0]?.variables ?? {};
  }, [presets, selectedTheme]);

  return (
    <section className="dashboard-section" id="theme">
      <article className="form-card">
        <p className="card-label">Theme</p>
        <h2>Visual preference</h2>
        <p className="subtle-note">
          Choose the memorial palette that best reflects the family&apos;s preference ({presets.length}{" "}
          options). Cards are compact; scroll if needed on small screens. Your content stays when you switch themes.
        </p>
        {status ? <p className="form-status">{status}</p> : null}
      </article>

      <section className="theme-grid">
        {presets.map((theme) => (
          <article
            className="theme-card"
            key={theme.id}
            style={themeCardChromeStyle(theme.variables)}
          >
            <div
              className={`theme-preview${theme.id === selectedTheme ? " is-active" : ""}`}
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
              {theme.id === tribute.theme ? "Current Theme" : "Theme Option"}
            </p>
            <h3 style={themeCardHeadingStyle(theme.variables)}>{theme.name}</h3>
            <p style={themeCardBodyStyle(theme.variables)}>{theme.description}</p>
            <button
              className={`theme-picker-swatch-btn${theme.id === selectedTheme ? " is-selected" : ""}`}
              type="button"
              style={
                theme.id === selectedTheme
                  ? themeAccentSelectedButtonStyle(theme.variables)
                  : themeAccentGhostButtonStyle(theme.variables)
              }
              onClick={() => {
                setSelectedTheme(theme.id);
                setStatus(null);
              }}
            >
              {theme.id === selectedTheme ? "Selected" : "Choose Theme"}
            </button>
          </article>
        ))}
      </section>

      <div className="builder-actions">
        <button
          className="theme-save-accent-btn theme-save-theme-btn-base"
          type="button"
          style={themeAccentSelectedButtonStyle(selectedVariables)}
          onClick={applyTheme}
          disabled={pending}
        >
          {pending ? "Saving Theme..." : "Save Theme"}
        </button>
      </div>
    </section>
  );
}
