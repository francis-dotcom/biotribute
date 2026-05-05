import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export type CreateFamilyPrivateMessageInput = {
  tributeSlug: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  message: string;
  website?: string;
};

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

export async function createFamilyPrivateMessage(input: CreateFamilyPrivateMessageInput) {
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
