import { createHmac } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export type TributeVisitStats = {
  pageViews: number;
  uniqueVisitors: number;
  lastVisitedAt?: string;
};

function getVisitHashSecret() {
  return (
    process.env.VISITOR_HASH_SECRET?.trim() ||
    process.env.BIOTRIBUTE_ADMIN_PASSWORD?.trim() ||
    process.env.BIOTRIBUTE_ADMIN_TOKEN?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "biotribute-visitor-hash"
  );
}

function hashValue(value: string) {
  return createHmac("sha256", getVisitHashSecret()).update(value).digest("hex");
}

export function isVisitStoreConfigured() {
  return isSupabaseConfigured();
}

export async function recordTributeVisit(input: {
  tributeSlug: string;
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
  const ipHash = hashValue(normalizedIp);

  const { error } = await supabase.from("tribute_visits").insert({
    tribute_slug: input.tributeSlug,
    path: input.path,
    visitor_hash: visitorHash,
    ip_hash: ipHash,
    referer: input.referer?.trim() || null,
  });

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("tribute_visits")
    ) {
      throw new Error("Visit tracking table is missing. Run the tribute_visits migration.");
    }

    throw new Error("Unable to record visit.");
  }
}

export async function getTributeVisitStats(tributeSlug: string): Promise<TributeVisitStats> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      pageViews: 0,
      uniqueVisitors: 0,
    };
  }

  const { data, error } = await supabase
    .from("tribute_visits")
    .select("visitor_hash, created_at")
    .eq("tribute_slug", tributeSlug);

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("tribute_visits")
    ) {
      throw new Error("Visit tracking table is missing. Run the tribute_visits migration.");
    }

    throw new Error("Unable to load visit statistics.");
  }

  const rows = data ?? [];
  const uniqueVisitors = new Set(rows.map((row) => row.visitor_hash)).size;
  const lastVisitedAt = rows.reduce<string | undefined>((latest, row) => {
    if (!latest) {
      return row.created_at;
    }

    return new Date(row.created_at).getTime() > new Date(latest).getTime() ? row.created_at : latest;
  }, undefined);

  return {
    pageViews: rows.length,
    uniqueVisitors,
    lastVisitedAt,
  };
}
