import { createClient } from "@supabase/supabase-js";
import type { TributeMessage, TributeMessagePlacement } from "@/data/tributes";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { getSiteUrl } from "@/lib/env";

export type StoredMessageStatus =
  | "pending_unverified"
  | "pending_verified"
  | "approved"
  | "rejected";

export type StoredMessageRow = {
  id: string;
  tribute_slug: string;
  author: string;
  email: string;
  placement: TributeMessagePlacement;
  message: string;
  excerpt: string;
  status: StoredMessageStatus;
  email_verified: boolean;
  verification_token?: string | null;
  verified_at?: string | null;
  created_at: string;
};

export type CreateMessageInput = {
  tributeSlug: string;
  author: string;
  email: string;
  placement: TributeMessagePlacement;
  message: string;
  turnstileToken?: string;
  website?: string;
};

type VerificationResult = {
  slug: string;
  author: string;
  alreadyVerified: boolean;
};

type ExistingVerifiedEmailRow = {
  id: string;
  email_verified: boolean;
  verified_at?: string | null;
};

function isMissingMessageTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.toLowerCase().includes("tribute_messages") === true
  );
}

function isPermissionError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("permission denied") === true
  );
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

async function sendVerificationEmail(input: {
  tributeSlug: string;
  author: string;
  email: string;
  verificationToken: string;
}) {
  const { apiKey, fromEmail, siteUrl, configured } = getVerificationEmailConfig();
  if (!configured) {
    throw new Error(
      "Verification email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and NEXT_PUBLIC_SITE_URL.",
    );
  }

  const verifyUrl = `${siteUrl}/verify-message?token=${encodeURIComponent(input.verificationToken)}`;
  const subject = `Confirm your guestbook message for ${input.tributeSlug}`;
  const text = `Hello ${input.author},

Please confirm your guestbook message by opening this link:
${verifyUrl}

After confirmation, the family can review your message for approval.

If you did not submit this message, you can ignore this email.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.email],
      subject,
      text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to send verification email.");
  }
}

function toExcerpt(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

function toPublicMessage(row: StoredMessageRow): TributeMessage {
  return {
    id: row.id,
    author: row.author,
    date: new Date(row.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    placement: row.placement,
    excerpt: row.excerpt,
    full: row.message,
  };
}

async function syncVerifiedPendingMessages(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  tributeSlug?: string
) {
  let query = supabase
    .from("tribute_messages")
    .update({
      status: "pending_verified" as StoredMessageStatus,
      verified_at: new Date().toISOString(),
    })
    .eq("status", "pending_unverified")
    .eq("email_verified", true);

  if (tributeSlug) {
    query = query.eq("tribute_slug", tributeSlug);
  }

  await query;
}

export function isMessageStoreConfigured() {
  return Boolean(getSupabaseAdmin());
}

export async function getApprovedMessages(tributeSlug: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as TributeMessage[];
  }

  const { data, error } = await supabase
    .from("tribute_messages")
    .select("*")
    .eq("tribute_slug", tributeSlug)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [] as TributeMessage[];
  }

  return (data as StoredMessageRow[]).map(toPublicMessage);
}

export async function createPendingMessage(input: CreateMessageInput) {
  if (input.website?.trim()) {
    throw new Error("Spam detected.");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Message storage is not configured.");
  }

  const botCheckPassed = await verifyTurnstileToken(input.turnstileToken);
  if (!botCheckPassed) {
    throw new Error("Bot verification failed.");
  }

  const message = input.message.trim();
  const author = input.author.trim();
  const email = input.email.trim().toLowerCase();
  const verificationToken = crypto.randomUUID();
  const { data: verifiedEmailRow } = await supabase
    .from("tribute_messages")
    .select("id, email_verified, verified_at")
    .eq("tribute_slug", input.tributeSlug)
    .eq("email", email)
    .eq("email_verified", true)
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const hasVerifiedHistory = Boolean((verifiedEmailRow as ExistingVerifiedEmailRow | null)?.email_verified);
  const initialStatus: StoredMessageStatus = hasVerifiedHistory
    ? "pending_verified"
    : "pending_unverified";
  const initialVerifiedAt =
    hasVerifiedHistory
      ? new Date().toISOString()
      : null;

  const { error } = await supabase.from("tribute_messages").insert({
    tribute_slug: input.tributeSlug,
    author,
    email,
    placement: input.placement,
    message,
    excerpt: toExcerpt(message),
    status: initialStatus,
    email_verified: hasVerifiedHistory,
    verification_token: hasVerifiedHistory ? null : verificationToken,
    verified_at: initialVerifiedAt,
  });

  if (error) {
    if (isMissingMessageTableError(error)) {
      throw new Error(
        "Message storage table is missing. Run migration 20260503044007_initial_tribute_messages.sql.",
      );
    }

    if (isPermissionError(error)) {
      throw new Error(
        "Message storage permission is missing. Grant SELECT, INSERT, UPDATE on public.tribute_messages to service_role.",
      );
    }

    throw new Error("Unable to save message.");
  }

  if (!hasVerifiedHistory) {
    try {
      await sendVerificationEmail({
        tributeSlug: input.tributeSlug,
        author,
        email,
        verificationToken,
      });
    } catch (emailError) {
      await supabase
        .from("tribute_messages")
        .delete()
        .eq("verification_token", verificationToken);

      if (emailError instanceof Error) {
        throw emailError;
      }

      throw new Error("Unable to send verification email.");
    }
  }
}

export async function getMessagesForAdmin(tributeSlug?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [] as StoredMessageRow[];
  }

  await syncVerifiedPendingMessages(supabase, tributeSlug);

  let query = supabase
    .from("tribute_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (tributeSlug) {
    query = query.eq("tribute_slug", tributeSlug);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingMessageTableError(error)) {
      throw new Error(
        "Message storage table is missing. Run migration 20260503044007_initial_tribute_messages.sql.",
      );
    }

    if (isPermissionError(error)) {
      throw new Error(
        "Message storage permission is missing. Grant SELECT, INSERT, UPDATE on public.tribute_messages to service_role.",
      );
    }

    throw new Error("Unable to load messages.");
  }

  if (!data) {
    return [] as StoredMessageRow[];
  }

  return data as StoredMessageRow[];
}

export async function updateMessageStatus(id: string, status: StoredMessageStatus) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Message storage is not configured.");
  }

  const updates: Partial<StoredMessageRow> = { status };
  if (status === "pending_verified") {
    updates.email_verified = true;
    updates.verified_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tribute_messages")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error("Unable to update message.");
  }
}

export async function updateMessageContent(id: string, message: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Message storage is not configured.");
  }

  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    throw new Error("Message cannot be empty.");
  }

  const { error } = await supabase
    .from("tribute_messages")
    .update({
      message: normalizedMessage,
      excerpt: toExcerpt(normalizedMessage),
    })
    .eq("id", id);

  if (error) {
    throw new Error("Unable to update message content.");
  }
}

export async function deleteMessage(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Message storage is not configured.");
  }

  const { error } = await supabase
    .from("tribute_messages")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Unable to delete message.");
  }
}

export async function confirmMessageVerification(token: string): Promise<VerificationResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Message storage is not configured.");
  }

  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error("Verification token is missing.");
  }

  const { data, error } = await supabase
    .from("tribute_messages")
    .select("*")
    .eq("verification_token", normalizedToken)
    .maybeSingle();

  if (error || !data) {
    throw new Error("This verification link is invalid or has expired.");
  }

  const row = data as StoredMessageRow;

  if (row.email_verified) {
    throw new Error("This email verification link has already been used.");
  }

  const { error: updateError } = await supabase
    .from("tribute_messages")
    .update({
      email_verified: true,
      verified_at: new Date().toISOString(),
      status: "pending_verified" as StoredMessageStatus,
    })
    .eq("id", row.id);

  if (updateError) {
    throw new Error("Unable to verify this message right now.");
  }

  return {
    slug: row.tribute_slug,
    author: row.author,
    alreadyVerified: false,
  };
}
