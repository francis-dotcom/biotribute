import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin";
import { deleteFamilyPrivateMessage } from "@/lib/family-private-messages";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

function buildRedirectUrl(path: string, notice?: string, tone?: "success" | "error") {
  const [pathname, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);

  if (notice) {
    params.set("notice", notice);
  }

  if (tone) {
    params.set("tone", tone);
  }

  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    redirect("/console-login?error=Invalid%20request%20origin.");
  }

  const rateLimit = await consumeRateLimit({
    key: `api:admin-family-messages:${getClientIp(request)}`,
    limit: 30,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    redirect("/console-login?error=Too%20many%20admin%20actions.%20Please%20wait%20and%20try%20again.");
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const { id } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect("/console-login");
  }

  if (action !== "delete") {
    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        "Invalid private message action.",
        "error"
      )
    );
  }

  try {
    await deleteFamilyPrivateMessage(id);
  } catch (error) {
    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        error instanceof Error ? error.message : "Unable to delete private message.",
        "error"
      )
    );
  }

  redirect(
    buildRedirectUrl(
      redirectTo || "/admin/messages",
      "Private message deleted.",
      "success"
    )
  );
}
