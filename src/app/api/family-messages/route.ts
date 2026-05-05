import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingFamilyPrivateMessage } from "@/lib/family-private-messages";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const requestSchema = z.object({
  tributeSlug: z.string().trim().min(1),
  recipientEmail: z.string().trim().email(),
  senderName: z.string().trim().min(2).max(80),
  senderEmail: z.string().trim().email().max(160),
  message: z.string().trim().min(12).max(5000),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

type FamilyMessageField = "senderName" | "senderEmail" | "message";

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit({
    key: `api:family-messages:${getClientIp(request)}`,
    limit: 4,
    windowMs: 1000 * 60 * 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many private messages. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const json = await request.json();
    const payload = requestSchema.parse(json);
    const botCheckPassed = await verifyTurnstileToken(payload.turnstileToken);

    if (!botCheckPassed) {
      return NextResponse.json(
        { error: "Please complete bot verification before sending your private message." },
        { status: 400 },
      );
    }

    const result = await createPendingFamilyPrivateMessage(payload);

    return NextResponse.json({
      message: result.verificationRequired
        ? "Your email is not verified yet. The family will not see your message until you verify from your inbox."
        : result.emailNotified
          ? "Your email is already verified. Your message was sent to the family and emailed to them immediately."
          : "Your email is already verified. Your message was saved for the family immediately.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = {} as Partial<Record<FamilyMessageField, string>>;
      for (const issue of error.issues) {
        const key = issue.path[0];
        if (
          (key === "senderName" || key === "senderEmail" || key === "message") &&
          !fieldErrors[key]
        ) {
          fieldErrors[key] = issue.message;
        }
      }

      return NextResponse.json(
        {
          error: "Please complete the private message form correctly.",
          fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to send private family message.",
      },
      { status: 500 },
    );
  }
}
