import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "biotribute_admin_session";

function getAdminSecret() {
  return process.env.BIOTRIBUTE_ADMIN_PASSWORD ?? process.env.BIOTRIBUTE_ADMIN_TOKEN ?? "";
}

export async function isAdminAuthenticated(providedToken?: string) {
  const expected = getAdminSecret();
  if (!expected) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return providedToken === expected || session === expected;
}

export async function requireAdminSession(nextPath = "/") {
  if (await isAdminAuthenticated()) {
    return;
  }

  redirect(`/console-login?next=${encodeURIComponent(nextPath)}`);
}
