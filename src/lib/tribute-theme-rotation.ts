import { TRIBUTE_THEME_IDS, type TributeTheme } from "@/data/tributes";

const themeSet = new Set<string>(TRIBUTE_THEME_IDS);

export function normalizeRotationThemeIds(
  ids: readonly string[] | readonly TributeTheme[] | undefined,
): TributeTheme[] {
  if (!ids?.length) {
    return [];
  }
  const seen = new Set<TributeTheme>();
  const out: TributeTheme[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !themeSet.has(id)) {
      continue;
    }
    const themeId = id as TributeTheme;
    if (!seen.has(themeId)) {
      seen.add(themeId);
      out.push(themeId);
    }
  }
  return out;
}

/** Wall-clock (UTC) slot: everyone sees the same theme during the same interval. */
export function getActiveThemeFromRotation(
  baseTheme: TributeTheme,
  enabled: boolean,
  intervalMinutes: number,
  themeIds: TributeTheme[],
  atMs: number = Date.now(),
): TributeTheme {
  const valid = normalizeRotationThemeIds(themeIds);
  if (!enabled || valid.length < 2) {
    return baseTheme;
  }
  const safeMinutes = Math.max(1, Math.min(10080, intervalMinutes));
  const intervalMs = safeMinutes * 60_000;
  const slot = Math.floor(atMs / intervalMs) % valid.length;
  return valid[slot] ?? baseTheme;
}
