import { NextResponse } from "next/server";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { searchPublicTributes } from "@/lib/tributes-store";

export async function GET(request: Request) {
  const rateLimit = await consumeRateLimit({
    key: `api:tributes-search:${getClientIp(request)}`,
    limit: 60,
    windowMs: 1000 * 60 * 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many search requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (query.length > 80) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }

  try {
    const results = await searchPublicTributes(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Tribute search failed.", error);
    return NextResponse.json({ error: "Unable to search tributes." }, { status: 500 });
  }
}
