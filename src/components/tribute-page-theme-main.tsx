"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { TributeTheme } from "@/data/tributes";
import { getTributeThemePreset } from "@/data/tributes";
import { getActiveThemeFromRotation } from "@/lib/tribute-theme-rotation";

type Props = {
  baseThemeId: TributeTheme;
  initialActiveThemeId: TributeTheme;
  rotationEnabled: boolean;
  rotationIntervalMinutes: number;
  rotationThemeIds: TributeTheme[];
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  children: React.ReactNode;
};

function pageStyleForTheme(
  themeId: TributeTheme,
  heroImageUrl?: string,
  backgroundImageUrl?: string,
): CSSProperties {
  const themePreset = getTributeThemePreset(themeId);
  return {
    ...themePreset.variables,
    "--tribute-hero-image": heroImageUrl ? `url("${heroImageUrl}")` : "none",
    "--tribute-background-image": backgroundImageUrl
      ? `url("${backgroundImageUrl}")`
      : heroImageUrl
        ? `url("${heroImageUrl}")`
        : "none",
  } as CSSProperties;
}

export function TributePageThemeMain({
  baseThemeId,
  initialActiveThemeId,
  rotationEnabled,
  rotationIntervalMinutes,
  rotationThemeIds,
  heroImageUrl,
  backgroundImageUrl,
  children,
}: Props) {
  const [activeThemeId, setActiveThemeId] = useState(initialActiveThemeId);

  useEffect(() => {
    if (!rotationEnabled || rotationThemeIds.length < 2) {
      setActiveThemeId(baseThemeId);
      return;
    }

    const intervalMs = Math.max(60_000, rotationIntervalMinutes * 60_000);
    const tick = () => {
      setActiveThemeId(
        getActiveThemeFromRotation(
          baseThemeId,
          true,
          rotationIntervalMinutes,
          rotationThemeIds,
          Date.now(),
        ),
      );
    };
    const now = Date.now();
    const msUntilNext = intervalMs - (now % intervalMs);
    let intervalHandle: number | undefined;
    const timeoutHandle = window.setTimeout(() => {
      tick();
      intervalHandle = window.setInterval(tick, intervalMs);
    }, msUntilNext);
    return () => {
      window.clearTimeout(timeoutHandle);
      if (intervalHandle !== undefined) {
        window.clearInterval(intervalHandle);
      }
    };
  }, [baseThemeId, rotationEnabled, rotationIntervalMinutes, rotationThemeIds]);

  const style = pageStyleForTheme(activeThemeId, heroImageUrl, backgroundImageUrl);

  return (
    <main className="page-shell tribute-page-shell" style={style}>
      {children}
    </main>
  );
}
