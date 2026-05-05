import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export type CreateFamilyPrivateMessageInput = {
  tributeSlug: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  message: string;
  website?: string;
};

type FamilyMessageVerificationPayload = {
  tributeSlug: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  message: string;
  exp: number;
};

const FAMILY_MESSAGE_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24;

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.toLowerCase().includes("family_private_messages") === true
  );
}

export function isFamilyPrivateMessageStoreConfigured() {
  return isSupabaseConfigured();
}

function getSiteUrl() {
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

function getVerificationSecret() {
  return (
    process.env.FAMILY_MESSAGE_VERIFICATION_SECRET?.trim() ||
    process.env.BIOTRIBUTE_ADMIN_TOKEN?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

function createVerificationToken(payload: FamilyMessageVerificationPayload) {
  const secret = getVerificationSecret();
  if (!secret) {
    throw new Error(
      "Missing family message verification secret. Set FAMILY_MESSAGE_VERIFICATION_SECRET.",
    );
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function parseVerificationToken(token: string): FamilyMessageVerificationPayload {
  const secret = getVerificationSecret();
  if (!secret) {
    throw new Error(
      "Missing family message verification secret. Set FAMILY_MESSAGE_VERIFICATION_SECRET.",
    );
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("This family message verification link is invalid.");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error("This family message verification link is invalid.");
  }

  let parsed: FamilyMessageVerificationPayload;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    throw new Error("This family message verification link is invalid.");
  }

  if (
    typeof parsed.exp !== "number" ||
    typeof parsed.tributeSlug !== "string" ||
    typeof parsed.recipientEmail !== "string" ||
    typeof parsed.senderName !== "string" ||
    typeof parsed.senderEmail !== "string" ||
    typeof parsed.message !== "string"
  ) {
    throw new Error("This family message verification link is invalid.");
  }

  if (Date.now() > parsed.exp) {
    throw new Error("This family message verification link has expired.");
  }

  return parsed;
}

function getVerificationEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  const siteUrl = getSiteUrl();

  return {
    apiKey,
    fromEmail,
    siteUrl,
    configured: Boolean(apiKey && fromEmail && siteUrl),
  };
}

async function sendFamilyVerificationEmail(input: {
  senderName: string;
  senderEmail: string;
  tributeSlug: string;
  verificationToken: string;
}) {
  const { apiKey, fromEmail, siteUrl, configured } = getVerificationEmailConfig();
  if (!configured) {
    throw new Error(
      "Verification email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and NEXT_PUBLIC_SITE_URL.",
    );
  }

  const verifyUrl = `${siteUrl}/verify-family-message?token=${encodeURIComponent(input.verificationToken)}`;
  const subject = `Confirm your private family message for ${input.tributeSlug}`;
  const text = `Hello ${input.senderName},

Please confirm your private family message by opening this link:
${verifyUrl}

Until you confirm, your message will not be visible to the family.

If you did not submit this message, you can ignore this email.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.senderEmail],
      subject,
      text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to send verification email.");
  }
}

async function insertFamilyPrivateMessage(input: CreateFamilyPrivateMessageInput) {
  if (input.website?.trim()) {
    throw new Error("Spam detected.");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Private family message storage is not configured.");
  }

  const { error } = await supabase.from("family_private_messages").insert({
    tribute_slug: input.tributeSlug.trim(),
    recipient_email: input.recipientEmail.trim().toLowerCase(),
    sender_name: input.senderName.trim(),
    sender_email: input.senderEmail.trim().toLowerCase(),
    message: input.message.trim(),
  });

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "Private family message table is missing. Run the family_private_messages migration.",
      );
    }

    throw new Error("Unable to save private family message.");
  }
}

async function hasPreviouslyVerifiedEmail(senderEmail: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Private family message storage is not configured.");
  }

  const normalizedEmail = senderEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const [{ data: guestbookVerified }, { data: priorFamilyMessage }] = await Promise.all([
    supabase
      .from("tribute_messages")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("email_verified", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("family_private_messages")
      .select("id")
      .eq("sender_email", normalizedEmail)
      .limit(1)
      .maybeSingle(),
  ]);

  return Boolean(guestbookVerified || priorFamilyMessage);
}

export async function createPendingFamilyPrivateMessage(input: CreateFamilyPrivateMessageInput) {
  if (input.website?.trim()) {
    throw new Error("Spam detected.");
  }

  const alreadyVerified = await hasPreviouslyVerifiedEmail(input.senderEmail);
  if (alreadyVerified) {
    await insertFamilyPrivateMessage(input);
    return { verificationRequired: false as const };
  }

  const payload: FamilyMessageVerificationPayload = {
    tributeSlug: input.tributeSlug.trim(),
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    senderName: input.senderName.trim(),
    senderEmail: input.senderEmail.trim().toLowerCase(),
    message: input.message.trim(),
    exp: Date.now() + FAMILY_MESSAGE_TOKEN_MAX_AGE_MS,
  };

  const verificationToken = createVerificationToken(payload);
  await sendFamilyVerificationEmail({
    senderName: payload.senderName,
    senderEmail: payload.senderEmail,
    tributeSlug: payload.tributeSlug,
    verificationToken,
  });

  return { verificationRequired: true as const };
}

export async function confirmFamilyPrivateMessageVerification(token: string) {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error("Verification token is missing.");
  }

  const payload = parseVerificationToken(normalizedToken);
  await insertFamilyPrivateMessage({
    tributeSlug: payload.tributeSlug,
    recipientEmail: payload.recipientEmail,
    senderName: payload.senderName,
    senderEmail: payload.senderEmail,
    message: payload.message,
  });

  return {
    tributeSlug: payload.tributeSlug,
    senderName: payload.senderName,
  };
}
