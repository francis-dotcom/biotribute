import { createHmac } from "node:crypto";
import { getRateLimitHashSecret, getTrustedProxyIpHeaders } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();

function hashKey(key: string) {
  return createHmac("sha256", getRateLimitHashSecret()).update(key).digest("hex");
}

function isValidIp(value: string) {
  return /^[a-fA-F0-9:.]+$/.test(value);
}

function toTrustedClientIp(request: Request) {
  for (const headerName of getTrustedProxyIpHeaders()) {
    const candidate = request.headers.get(headerName);
    if (!candidate) {
      continue;
    }

    const ip = candidate.split(",")[0]?.trim();
    if (ip && isValidIp(ip)) {
      return ip;
    }
  }

  return null;
}

function getClientFingerprint(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown-ua";
  const acceptLanguage = request.headers.get("accept-language")?.trim() || "unknown-lang";

  return `fp:${hashKey(`${userAgent}|${acceptLanguage}`).slice(0, 24)}`;
}

export function getClientIp(request: Request) {
  return toTrustedClientIp(request) ?? getClientFingerprint(request);
}

function consumeMemoryRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = buckets.get(input.key);

  if (!current || current.resetAt <= now) {
    const nextBucket = {
      count: 1,
      resetAt: now + input.windowMs,
    };
    buckets.set(input.key, nextBucket);
    return {
      allowed: true,
      remaining: input.limit - 1,
      retryAfterSeconds: Math.ceil(input.windowMs / 1000),
    } satisfies RateLimitResult;
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    } satisfies RateLimitResult;
  }

  current.count += 1;
  buckets.set(input.key, current);

  return {
      allowed: true,
      remaining: Math.max(0, input.limit - current.count),
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  } satisfies RateLimitResult;
}

export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return consumeMemoryRateLimit(input);
  }

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_scope: input.key.split(":")[0] ?? "default",
    p_key_hash: hashKey(input.key),
    p_limit: input.limit,
    p_window_seconds: Math.max(1, Math.ceil(input.windowMs / 1000)),
  });

  if (error || !Array.isArray(data) || !data[0]) {
    return consumeMemoryRateLimit(input);
  }

  const row = data[0] as Partial<RateLimitResult> & { retry_after_seconds?: number };
  return {
    allowed: Boolean(row.allowed),
    remaining: typeof row.remaining === "number" ? row.remaining : 0,
    retryAfterSeconds:
      typeof row.retryAfterSeconds === "number"
        ? row.retryAfterSeconds
        : typeof row.retry_after_seconds === "number"
          ? row.retry_after_seconds
          : Math.ceil(input.windowMs / 1000),
  } satisfies RateLimitResult;
}
