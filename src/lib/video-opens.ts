import { createHmac } from "node:crypto";
import { getVisitHashSecret } from "@/lib/env";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export type TributeVideoOpenStat = {
  videoIndex: number;
  totalOpens: number;
  uniqueViewers: number;
  lastOpenedAt?: string;
};

function hashValue(value: string) {
  return createHmac("sha256", getVisitHashSecret()).update(value).digest("hex");
}

function isMissingVideoOpenTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.toLowerCase().includes("tribute_video_opens") === true
  );
}

export function isVideoOpenStoreConfigured() {
  return isSupabaseConfigured();
}

export async function recordTributeVideoOpen(input: {
  tributeSlug: string;
  videoIndex: number;
  sessionId: string;
  path: string;
  ip: string;
  userAgent?: string;
  referer?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return;
  }

  const normalizedIp = input.ip.trim() || "unknown";
  const normalizedUserAgent = input.userAgent?.trim() || "unknown";
  const visitorHash = hashValue(`${normalizedIp}|${normalizedUserAgent}`);

  const { error } = await supabase.from("tribute_video_opens").insert({
    tribute_slug: input.tributeSlug,
    video_index: input.videoIndex,
    session_id: input.sessionId,
    visitor_hash: visitorHash,
    path: input.path,
    referer: input.referer?.trim() || null,
  });

  if (error) {
    if (isMissingVideoOpenTableError(error)) {
      throw new Error("Video open tracking table is missing. Run the tribute_video_opens migration.");
    }

    throw new Error("Unable to record video open.");
  }
}

export async function getTributeVideoOpenStats(
  tributeSlug: string,
): Promise<TributeVideoOpenStat[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tribute_video_opens")
    .select("video_index, visitor_hash, created_at")
    .eq("tribute_slug", tributeSlug)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingVideoOpenTableError(error)) {
      throw new Error("Video open tracking table is missing. Run the tribute_video_opens migration.");
    }

    throw new Error("Unable to load video open statistics.");
  }

  const rows = data ?? [];
  const grouped = new Map<number, { totalOpens: number; uniqueViewers: Set<string>; lastOpenedAt?: string }>();

  for (const row of rows) {
    const existing =
      grouped.get(row.video_index) ??
      { totalOpens: 0, uniqueViewers: new Set<string>(), lastOpenedAt: undefined };

    existing.totalOpens += 1;
    existing.uniqueViewers.add(row.visitor_hash);
    if (!existing.lastOpenedAt) {
      existing.lastOpenedAt = row.created_at;
    }

    grouped.set(row.video_index, existing);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([videoIndex, value]) => ({
      videoIndex,
      totalOpens: value.totalOpens,
      uniqueViewers: value.uniqueViewers.size,
      lastOpenedAt: value.lastOpenedAt,
    }));
}
