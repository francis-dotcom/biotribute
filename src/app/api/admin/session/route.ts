import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from "@/lib/admin";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

function getAdminSecret() {
  return process.env.BIOTRIBUTE_ADMIN_PASSWORD ?? process.env.BIOTRIBUTE_ADMIN_TOKEN ?? "";
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    key: `api:admin-session:${getClientIp(request)}`,
    limit: 5,
    windowMs: 1000 * 60 * 15,
  });

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/console/SirFemiOgini");
  const nextPath = next.startsWith("/") ? next : "/console/SirFemiOgini";
  const expected = getAdminSecret();

  if (!rateLimit.allowed) {
    redirect(
      `/console-login?error=${encodeURIComponent("Too many login attempts. Please wait and try again.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  if (!expected || password !== expected) {
    redirect(
      `/console-login?error=${encodeURIComponent("Invalid password.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, getAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(nextPath);
}
