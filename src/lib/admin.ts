import { redirect } from "next/navigation";

export function requireAdminToken(token: string | undefined, fallback = "/") {
  if (!process.env.BIOTRIBUTE_ADMIN_TOKEN || token !== process.env.BIOTRIBUTE_ADMIN_TOKEN) {
    redirect(fallback);
  }
}
