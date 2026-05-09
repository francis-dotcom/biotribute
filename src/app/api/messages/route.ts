import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingMessage } from "@/lib/messages";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const requestSchema = z.object({
  tributeSlug: z.string().min(1),
  author: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  placement: z.enum(["feed", "timeline"]),
  message: z.string().trim().min(12).max(5000),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

type MessageFormField = "author" | "email" | "message";

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit({
    key: `api:messages:${getClientIp(request)}`,
    limit: 6,
    windowMs: 1000 * 60 * 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many message submissions. Please wait and try again." },
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

    await createPendingMessage(payload);

    return NextResponse.json({
      message:
        "Message submitted. Please verify your email from your inbox before your message can be reviewed and shown.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = {} as Partial<Record<MessageFormField, string>>;
      for (const issue of error.issues) {
        const key = issue.path[0];
        if ((key === "author" || key === "email" || key === "message") && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }

      return NextResponse.json(
        {
          error: "Please complete all required fields correctly.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Failed to submit tribute message.", error);
    return NextResponse.json({ error: "Unable to submit message." }, { status: 500 });
  }
}
