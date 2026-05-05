import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "biotribute_admin_session";

function getAdminSecret() {
  return process.env.BIOTRIBUTE_ADMIN_PASSWORD ?? process.env.BIOTRIBUTE_ADMIN_TOKEN ?? "";
}

export function getAdminSessionValue() {
  const expected = getAdminSecret();
  if (!expected) {
    return "";
  }

  return createHmac("sha256", expected).update("biotribute-admin-session").digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isAdminAuthenticated(providedToken?: string) {
  const expected = getAdminSecret();
  if (!expected) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const expectedSession = getAdminSessionValue();

  return providedToken === expected || (session ? safeEqual(session, expectedSession) : false);
}

export async function requireAdminSession(nextPath = "/") {
  if (await isAdminAuthenticated()) {
    return;
  }

  redirect(`/console-login?next=${encodeURIComponent(nextPath)}`);
}
