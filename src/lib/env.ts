export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    return `https://${productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "";
}

export function getFamilyContactEmail() {
  return process.env.FAMILY_CONTACT_EMAIL?.trim() ?? "";
}

export function getRateLimitHashSecret() {
  return process.env.RATE_LIMIT_HASH_SECRET?.trim() || "biotribute-rate-limit";
}

export function getTrustedProxyIpHeaders() {
  const configured = process.env.TRUSTED_PROXY_IP_HEADERS?.trim();

  if (configured) {
    return configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  return ["x-vercel-forwarded-for", "cf-connecting-ip", "x-real-ip"];
}

export function getVisitHashSecret() {
  return process.env.VISITOR_HASH_SECRET?.trim() || "biotribute-visitor-hash";
}

export function getFamilyMessageVerificationSecret() {
  const secret = process.env.FAMILY_MESSAGE_VERIFICATION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (!isProductionEnvironment()) {
    return process.env.BIOTRIBUTE_ADMIN_TOKEN?.trim() || "biotribute-family-message-dev";
  }

  return "";
}
