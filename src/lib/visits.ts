import { createHmac } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export type TributeVisitStats = {
  pageViews: number;
  uniqueVisitors: number;
  lastVisitedAt?: string;
};

export type TributeVisitDetail = {
  visitorHash: string;
  path: string;
  referer?: string | null;
  createdAt: string;
};

export type TributeVisitSessionDetail = {
  sessionId: string;
  visitorHash: string;
  path: string;
  referer?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  estimatedDurationSeconds: number;
  heartbeatCount: number;
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

type RecordTributeVisitSessionInput = {
  tributeSlug: string;
  sessionId: string;
  path: string;
  ip: string;
  userAgent?: string;
  referer?: string;
  eventType?: "enter" | "heartbeat" | "leave";
};

function isMissingVisitSessionTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.toLowerCase().includes("tribute_visit_page_sessions") === true
  );
}

export async function recordTributeVisitSession(input: RecordTributeVisitSessionInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return;
  }

  const nowIso = new Date().toISOString();
  const normalizedIp = input.ip.trim() || "unknown";
  const normalizedUserAgent = input.userAgent?.trim() || "unknown";
  const visitorHash = hashValue(`${normalizedIp}|${normalizedUserAgent}`);

  const { data: existingRow, error: lookupError } = await supabase
    .from("tribute_visit_page_sessions")
    .select(
      "id, first_seen_at, heartbeat_count, referer",
    )
    .eq("tribute_slug", input.tributeSlug)
    .eq("session_id", input.sessionId)
    .eq("path", input.path)
    .maybeSingle();

  if (lookupError) {
    if (isMissingVisitSessionTableError(lookupError)) {
      throw new Error(
        "Visit session tracking table is missing. Run the tribute_visit_page_sessions migration.",
      );
    }

    throw new Error("Unable to load visit session state.");
  }

  if (!existingRow) {
    const { error } = await supabase.from("tribute_visit_page_sessions").insert({
      tribute_slug: input.tributeSlug,
      session_id: input.sessionId,
      path: input.path,
      visitor_hash: visitorHash,
      referer: input.referer?.trim() || null,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
      estimated_duration_seconds: 0,
      heartbeat_count: input.eventType === "heartbeat" ? 1 : 0,
      updated_at: nowIso,
    });

    if (error) {
      if (isMissingVisitSessionTableError(error)) {
        throw new Error(
          "Visit session tracking table is missing. Run the tribute_visit_page_sessions migration.",
        );
      }

      throw new Error("Unable to save visit session.");
    }

    return;
  }

  const firstSeenAt = new Date(existingRow.first_seen_at);
  const estimatedDurationSeconds = Math.max(
    0,
    Math.floor((new Date(nowIso).getTime() - firstSeenAt.getTime()) / 1000),
  );

  const { error: updateError } = await supabase
    .from("tribute_visit_page_sessions")
    .update({
      last_seen_at: nowIso,
      estimated_duration_seconds: estimatedDurationSeconds,
      heartbeat_count:
        Number(existingRow.heartbeat_count ?? 0) + (input.eventType === "heartbeat" ? 1 : 0),
      referer: existingRow.referer?.trim() ? existingRow.referer : input.referer?.trim() || null,
      updated_at: nowIso,
    })
    .eq("id", existingRow.id);

  if (updateError) {
    if (isMissingVisitSessionTableError(updateError)) {
      throw new Error(
        "Visit session tracking table is missing. Run the tribute_visit_page_sessions migration.",
      );
    }

    throw new Error("Unable to update visit session.");
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

export async function getRecentTributeVisits(
  tributeSlug: string,
  limit = 20,
): Promise<TributeVisitDetail[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tribute_visits")
    .select("visitor_hash, path, referer, created_at")
    .eq("tribute_slug", tributeSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("tribute_visits")
    ) {
      throw new Error("Visit tracking table is missing. Run the tribute_visits migration.");
    }

    throw new Error("Unable to load visit details.");
  }

  return (data ?? []).map((row) => ({
    visitorHash: row.visitor_hash,
    path: row.path,
    referer: row.referer,
    createdAt: row.created_at,
  }));
}

export async function getRecentTributeVisitSessions(
  tributeSlug: string,
  limit?: number,
): Promise<TributeVisitSessionDetail[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("tribute_visit_page_sessions")
    .select(
      "session_id, visitor_hash, path, referer, first_seen_at, last_seen_at, estimated_duration_seconds, heartbeat_count",
    )
    .eq("tribute_slug", tributeSlug)
    .order("last_seen_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingVisitSessionTableError(error)) {
      throw new Error(
        "Visit session tracking table is missing. Run the tribute_visit_page_sessions migration.",
      );
    }

    throw new Error("Unable to load visit session details.");
  }

  return (data ?? []).map((row) => ({
    sessionId: row.session_id,
    visitorHash: row.visitor_hash,
    path: row.path,
    referer: row.referer,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    estimatedDurationSeconds: Number(row.estimated_duration_seconds ?? 0),
    heartbeatCount: Number(row.heartbeat_count ?? 0),
  }));
}
