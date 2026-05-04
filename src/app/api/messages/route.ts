import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingMessage } from "@/lib/messages";

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

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to submit message.",
      },
      { status: 500 }
    );
  }
}
