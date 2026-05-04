import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin";
import { updateMessageStatus } from "@/lib/messages";

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
  const formData = await request.formData();
  const status = String(formData.get("status") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const { id } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect("/console-login");
  }

  if (
    status !== "pending_verified" &&
    status !== "approved" &&
    status !== "rejected"
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
  } catch {
    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        "Unable to update message status.",
        "error"
      )
    );
  }

  const successMessage =
    status === "pending_verified"
      ? "Message marked as email-verified."
      : status === "approved"
        ? "Message approved."
        : "Message rejected.";

  redirect(
    buildRedirectUrl(
      redirectTo || "/admin/messages",
      successMessage,
      "success"
    )
  );
}
