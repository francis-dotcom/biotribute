import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin";
import { deleteMessage, updateMessageContent, updateMessageStatus } from "@/lib/messages";
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
    key: `api:admin-messages:${getClientIp(request)}`,
    limit: 30,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    redirect("/console-login?error=Too%20many%20admin%20actions.%20Please%20wait%20and%20try%20again.");
  }

  const formData = await request.formData();
  const status = String(formData.get("status") ?? "");
  const action = String(formData.get("action") ?? "");
  const message = String(formData.get("message") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const { id } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect("/console-login");
  }

  if (action === "delete") {
    try {
      await deleteMessage(id);
    } catch {
      redirect(
        buildRedirectUrl(
          redirectTo || "/admin/messages",
          "Unable to delete message.",
          "error"
        )
      );
    }

    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        "Message moved to deleted.",
        "success"
      )
    );
  }

  if (action === "edit") {
    try {
      await updateMessageContent(id, message);
    } catch (error) {
      redirect(
        buildRedirectUrl(
          redirectTo || "/admin/messages",
          error instanceof Error ? error.message : "Unable to update message content.",
          "error"
        )
      );
    }

    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        "Message text updated.",
        "success"
      )
    );
  }

  if (
    status !== "pending_verified" &&
    status !== "approved" &&
    status !== "rejected" &&
    status !== "deleted"
  ) {
    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        "Invalid moderation action.",
        "error"
      )
    );
  }

  try {
    await updateMessageStatus(id, status);
  } catch (error) {
    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        error instanceof Error ? error.message : "Unable to update message status.",
        "error"
      )
    );
  }

  const successMessage =
    status === "pending_verified"
      ? "Message marked as email-verified."
      : status === "approved"
        ? "Message approved."
        : status === "rejected"
          ? "Message rejected."
          : "Message moved to deleted.";

  redirect(
    buildRedirectUrl(
      redirectTo || "/admin/messages",
      successMessage,
      "success"
    )
  );
}
