import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getAdminSessionValue } from "@/lib/admin";

function getAdminSecret() {
  return process.env.BIOTRIBUTE_ADMIN_PASSWORD ?? process.env.BIOTRIBUTE_ADMIN_TOKEN ?? "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/console/SirFemiOgini");
  const nextPath = next.startsWith("/") ? next : "/console/SirFemiOgini";
  const expected = getAdminSecret();

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
