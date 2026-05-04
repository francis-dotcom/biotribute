import { createClient } from "@supabase/supabase-js";
import type { TributeMessage, TributeMessagePlacement } from "@/data/tributes";

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

async function verifyTurnstileToken(token?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
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

  const { error } = await supabase.from("tribute_messages").insert({
    tribute_slug: input.tributeSlug,
    author,
    email,
    placement: input.placement,
    message,
    excerpt: toExcerpt(message),
    status: "pending_unverified",
    email_verified: false,
    verification_token: verificationToken,
    verified_at: null,
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
