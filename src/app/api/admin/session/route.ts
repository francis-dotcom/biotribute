import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  getAdminSessionValue,
  isValidAdminSecret,
} from "@/lib/admin";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    redirect(
      `/console-login?error=${encodeURIComponent("Invalid request origin.")}&next=${encodeURIComponent("/console/SirFemiOgini")}`,
    );
  }

  const rateLimit = await consumeRateLimit({
    key: `api:admin-session:${getClientIp(request)}`,
    limit: 5,
    windowMs: 1000 * 60 * 15,
  });

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/console/SirFemiOgini");
  const nextPath = next.startsWith("/") ? next : "/console/SirFemiOgini";

  if (!rateLimit.allowed) {
    redirect(
      `/console-login?error=${encodeURIComponent("Too many login attempts. Please wait and try again.")}&next=${encodeURIComponent(nextPath)}`,
    );
  }

  if (!isValidAdminSecret(password)) {
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
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  redirect(nextPath);
}
