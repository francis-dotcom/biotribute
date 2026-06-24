import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin";
import { getSupabaseServerClient, isUserAuthConfigured } from "@/lib/supabase-server";
import { getTributeRecord } from "@/lib/tributes-store";

export async function getCurrentUser() {
  if (!isUserAuthConfigured()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUserSession(nextPath = "/console") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function canManageTribute(slug: string) {
  if (await isAdminAuthenticated()) {
    return true;
  }

  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const tribute = await getTributeRecord(slug);
  return Boolean(tribute && tribute.ownerUserId === user.id);
}
