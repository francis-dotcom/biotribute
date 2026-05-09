import type { CSSProperties } from "react";

/** Readable text on a solid 6-digit hex background (primary accent buttons). */
export function contrastOnHex6(hex6: string): "#1a1a1a" | "#ffffff" {
  const h = hex6.replace("#", "");
  if (h.length !== 6) {
    return "#1a1a1a";
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

function hexWithAlpha(hex6: string, alphaHex2: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex6)) {
    return `${hex6}${alphaHex2}`;
  }
  return hex6;
}

/** Prominent preview strip: gradient + soft accent glow so each theme reads at a glance. */
export function themePreviewBackdropStyle(variables: Record<string, string>): CSSProperties {
  const accent = variables["--gold"] ?? "#888888";
  const wash = hexWithAlpha(accent, "55");
  return {
    backgroundImage: `radial-gradient(ellipse 120% 90% at 96% 4%, ${wash}, transparent 58%), linear-gradient(168deg, ${variables["--bg"]} 0%, ${variables["--gold-soft"]} 44%, ${variables["--bg-2"]} 100%)`,
    borderColor: variables["--line"] ?? "transparent",
  };
}

export function themeCardChromeStyle(variables: Record<string, string>): CSSProperties {
  return {
    borderColor: variables["--line"] ?? undefined,
    background: `linear-gradient(180deg, ${variables["--panel-solid"]} 0%, ${variables["--gold-soft"]} 120%)`,
  };
}

export function themeCardHeadingStyle(variables: Record<string, string>): CSSProperties {
  return { color: variables["--text"] ?? undefined };
}

export function themeCardBodyStyle(variables: Record<string, string>): CSSProperties {
  return { color: variables["--muted-2"] ?? undefined };
}

export function themeAccentSelectedButtonStyle(variables: Record<string, string>): CSSProperties {
  const accent = variables["--gold"] ?? "#666666";
  const hex = accent.match(/^#[0-9a-fA-F]{6}$/i)?.[0];
  const color = hex ? contrastOnHex6(hex) : "#ffffff";

  return {
    backgroundColor: accent,
    borderColor: variables["--gold-deep"] ?? accent,
    color,
  };
}

export function themeAccentGhostButtonStyle(variables: Record<string, string>): CSSProperties {
  return {
    backgroundColor: variables["--gold-soft"] ?? "#f4f4f4",
    borderColor: variables["--gold"] ?? "#c8c8c8",
    color: variables["--gold-deep"] ?? "#333333",
  };
}
