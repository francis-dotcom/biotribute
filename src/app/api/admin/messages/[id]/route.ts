import { redirect } from "next/navigation";
import { updateMessageStatus } from "@/lib/messages";

function buildRedirectUrl(path: string, token: string, notice?: string, tone?: "success" | "error") {
  const [pathname, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);

  if (!params.get("token") && token) {
    params.set("token", token);
  }

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
  const token = String(formData.get("token") ?? "");
  const status = String(formData.get("status") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const { id } = await params;

  if (!process.env.BIOTRIBUTE_ADMIN_TOKEN || token !== process.env.BIOTRIBUTE_ADMIN_TOKEN) {
    redirect("/");
  }

  if (
    status !== "pending_verified" &&
    status !== "approved" &&
    status !== "rejected"
  ) {
    redirect(
      buildRedirectUrl(
        redirectTo || "/admin/messages",
        token,
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
        token,
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
      token,
      successMessage,
      "success"
    )
  );
}
