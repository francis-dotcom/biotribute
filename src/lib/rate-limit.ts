type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function consumeRateLimit(input: {
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
    };
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(input.key, current);

  return {
    allowed: true,
    remaining: Math.max(0, input.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
