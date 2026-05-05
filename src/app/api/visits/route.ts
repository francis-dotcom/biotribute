import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/rate-limit";
import { recordTributeVisit } from "@/lib/visits";

const requestSchema = z.object({
  tributeSlug: z.string().trim().min(1),
  path: z.string().trim().min(1).max(300),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = requestSchema.parse(json);

    await recordTributeVisit({
      tributeSlug: payload.tributeSlug,
      path: payload.path,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "",
      referer: request.headers.get("referer") ?? "",
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid visit payload." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record visit." },
      { status: 500 },
    );
  }
}
