import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordTributeVideoOpen } from "@/lib/video-opens";

const requestSchema = z.object({
  tributeSlug: z.string().trim().min(1),
  sessionId: z.string().trim().min(1).max(120),
  videoIndex: z.number().int().min(0).max(2),
  path: z.string().trim().min(1).max(300),
});

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit({
    key: `api:video-opens:${getClientIp(request)}`,
    limit: 120,
    windowMs: 1000 * 60 * 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many video open events. Please wait and try again." },
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

    await recordTributeVideoOpen({
      tributeSlug: payload.tributeSlug,
      sessionId: payload.sessionId,
      videoIndex: payload.videoIndex,
      path: payload.path,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "",
      referer: request.headers.get("referer") ?? "",
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid video open payload." }, { status: 400 });
    }

    console.error("Failed to record tribute video open.", error);
    return NextResponse.json({ error: "Unable to record video open." }, { status: 500 });
  }
}
