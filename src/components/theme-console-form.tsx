"use client";

import { useMemo, useState } from "react";
import type { TributeRecord, TributeTheme, TributeThemePreset } from "@/data/tributes";
import { normalizeRotationThemeIds } from "@/lib/tribute-theme-rotation";
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

function defaultRotationPool(
  tribute: TributeRecord,
  presets: TributeThemePreset[],
): TributeTheme[] {
  const stored = tribute.themeRotationThemeIds ?? [];
  if (stored.length >= 2) {
    return normalizeRotationThemeIds(stored);
  }
  const other = presets.find((p) => p.id !== tribute.theme)?.id;
  return normalizeRotationThemeIds(other ? [tribute.theme, other] : [tribute.theme]);
}

export function ThemeConsoleForm({ tribute, presets }: ThemeConsoleFormProps) {
  const [selectedTheme, setSelectedTheme] = useState(tribute.theme);
  const [rotationEnabled, setRotationEnabled] = useState(
    tribute.themeRotationEnabled ?? false,
  );
  const [intervalMinutes, setIntervalMinutes] = useState(
    tribute.themeRotationIntervalMinutes ?? 1440,
  );
  const [rotationIds, setRotationIds] = useState<TributeTheme[]>(() =>
    defaultRotationPool(tribute, presets),
  );
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function applyTheme() {
    const pool = normalizeRotationThemeIds(rotationIds);
    if (rotationEnabled && pool.length < 2) {
      setStatus("Choose at least two themes for rotation, or turn rotation off.");
      return;
    }

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
        themeRotationEnabled: rotationEnabled,
        themeRotationIntervalMinutes: Math.max(1, Math.min(10080, Math.round(intervalMinutes))),
        themeRotationThemeIds: pool,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);

    if (!response.ok) {
      setStatus(data.error ?? data.message ?? "Unable to save theme.");
      return;
    }

    setStatus(data.message ?? "Saved.");
    window.location.reload();
  }

  function toggleRotationTheme(id: TributeTheme) {
    setRotationIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  const selectedVariables = useMemo(() => {
    return presets.find((preset) => preset.id === selectedTheme)?.variables ?? presets[0]?.variables ?? {};
  }, [presets, selectedTheme]);

  const intervalPreset = (minutes: number) => (
    <button
      key={minutes}
      className="theme-rotation-preset-btn"
      type="button"
      onClick={() => setIntervalMinutes(minutes)}
    >
      {minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${minutes / 60} hr` : "24 hr"}
    </button>
  );

  return (
    <section className="dashboard-section" id="theme">
      <article className="form-card">
        <p className="card-label">Theme</p>
        <h2>Visual preference</h2>
        <p className="subtle-note">
          Choose the memorial palette ({presets.length} options). Your content stays when you switch
          themes.
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

      <article className="form-card theme-rotation-card">
        <p className="card-label">Timed rotation</p>
        <h3>Public page theme schedule</h3>
        <p className="subtle-note">
          Optionally cycle through several palettes on the live memorial page. Visitors all see the
          same theme at the same moment (shared clock). The “Saved theme” above is still stored as
          the default when rotation is off.
        </p>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={rotationEnabled}
            onChange={(e) => {
              setRotationEnabled(e.target.checked);
              setStatus(null);
            }}
          />
          <span>Rotate themes automatically</span>
        </label>

        {rotationEnabled ? (
          <div className="theme-rotation-fields">
            <div className="form-field">
              <label htmlFor="theme-rotation-interval">Interval (minutes)</label>
              <input
                id="theme-rotation-interval"
                type="number"
                min={1}
                max={10080}
                step={1}
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value) || 1)}
              />
              <p className="subtle-note theme-rotation-presets">
                Quick: {[5, 15, 60, 1440].map((m) => intervalPreset(m))}
              </p>
            </div>

            <div className="form-field">
              <p className="card-label">Themes in rotation (pick at least two)</p>
              <ul className="theme-rotation-checklist">
                {presets.map((p) => {
                  const checked = rotationIds.includes(p.id);
                  return (
                    <li key={p.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRotationTheme(p.id)}
                        />
                        <span>{p.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="subtle-note">
                Order follows the order you check themes (re-check to move to end).
              </p>
            </div>
          </div>
        ) : null}
      </article>

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
