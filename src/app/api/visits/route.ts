import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordTributeVisitSession } from "@/lib/visits";

const requestSchema = z.object({
  tributeSlug: z.string().trim().min(1),
  sessionId: z.string().trim().min(1).max(120),
  path: z.string().trim().min(1).max(300),
  eventType: z.enum(["enter", "heartbeat", "leave"]).optional(),
});

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit({
    key: `api:visits:${getClientIp(request)}`,
    limit: 180,
    windowMs: 1000 * 60 * 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many visit events. Please wait and try again." },
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

    await recordTributeVisitSession({
      tributeSlug: payload.tributeSlug,
      sessionId: payload.sessionId,
      path: payload.path,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "",
      referer: request.headers.get("referer") ?? "",
      eventType: payload.eventType ?? "heartbeat",
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid visit payload." }, { status: 400 });
    }

    console.error("Failed to record tribute visit.", error);
    return NextResponse.json({ error: "Unable to record visit." }, { status: 500 });
  }
}
