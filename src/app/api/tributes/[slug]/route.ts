import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin";
import { getCurrentUser } from "@/lib/user-auth";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { TRIBUTE_THEME_IDS } from "@/data/tributes";
import {
  getTributeOwnedByUser,
  getTributeRecord,
  saveTributeRecord,
  updateTributeTheme,
  updateTributeThemeConsole,
} from "@/lib/tributes-store";

const timelineSchema = z.object({
  year: z.string().trim(),
  title: z.string().trim(),
  copy: z.string().trim().min(1),
});

const contributorSchema = z.object({
  label: z.string().trim().min(1),
  name: z.string().trim().min(1),
  copy: z.string().trim().min(1),
});

const supportAmountSchema = z.object({
  label: z.string().trim().min(1),
  featured: z.boolean().optional(),
});

const fullTributeSchema = z.object({
  slug: z.string().trim().min(1),
  ownerUserId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  honorificTitle: z.string().trim().optional(),
  positionTitle: z.string().trim().optional(),
  years: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  organizer: z.string().trim().min(1),
  theme: z.enum(TRIBUTE_THEME_IDS),
  heroImageUrl: z.string().trim().optional(),
  backgroundImageUrl: z.string().trim().optional(),
  galleryIntro: z.string().trim().optional(),
  galleryNote: z.string().trim(),
  servicePosterImageUrl: z.string().trim().optional(),
  servicePosterTitle: z.string().trim().optional(),
  servicePosterNote: z.string().trim().optional(),
  showServicePosterSection: z.boolean().optional(),
  lifeStory: z.string().trim().min(1),
  supportNote: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  donationAccountName: z.string().trim().optional(),
  donationAccountNumber: z.string().trim().optional(),
  donationBankName: z.string().trim().optional(),
  donationPhone: z.string().trim().optional(),
  showCondolencePopup: z.boolean().optional(),
  condolenceCardImageUrl: z.string().trim().optional(),
  heroCountdownTargetDate: z.string().trim().optional(),
  heroCountdownUnit: z.string().trim().optional(),
  videoUrls: z.array(z.string().trim().min(1)).optional(),
  videoDescriptions: z.array(z.string().trim()).optional(),
  videoThumbnailUrls: z.array(z.string().trim()).optional(),
  activeVideoIndex: z.number().int().min(0).max(2).optional(),
  videoNote: z.string().trim().optional(),
  livestreamUrl: z.string().trim().optional(),
  livestreamThumbnailUrl: z.string().trim().optional(),
  livestreamDisplayMode: z.enum(["video", "image-url", "uploaded-image"]).optional(),
  livestreamNote: z.string().trim().optional(),
  showGallerySection: z.boolean().optional(),
  showVideoSection: z.boolean().optional(),
  showLivestreamSection: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  themeRotationEnabled: z.boolean().optional(),
  themeRotationIntervalMinutes: z.number().int().min(1).max(10080).optional(),
  themeRotationThemeIds: z.array(z.enum(TRIBUTE_THEME_IDS)).optional(),
  timeline: z.array(timelineSchema),
  contributors: z.array(contributorSchema),
  supportAmounts: z.array(supportAmountSchema),
});

const themeConsoleSchema = z
  .object({
    slug: z.string().trim().min(1),
    theme: z.enum(TRIBUTE_THEME_IDS),
    themeRotationEnabled: z.boolean(),
    themeRotationIntervalMinutes: z.number().int().min(1).max(10080),
    themeRotationThemeIds: z.array(z.enum(TRIBUTE_THEME_IDS)),
  })
  .refine(
    (data) =>
      !data.themeRotationEnabled || data.themeRotationThemeIds.filter(Boolean).length >= 2,
    { message: "Pick at least two themes for rotation." },
  );

const themeOnlySchema = z.object({
  slug: z.string().trim().min(1),
  theme: z.enum(TRIBUTE_THEME_IDS),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const rateLimit = await consumeRateLimit({
    key: `api:tributes:${getClientIp(request)}`,
    limit: 40,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many tribute update requests. Please wait and try again." },
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
    const slug = typeof json?.slug === "string" ? json.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "Missing tribute slug." }, { status: 400 });
    }

    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }

      const existingTribute = await getTributeRecord(slug);
      if (existingTribute) {
        if (existingTribute.ownerUserId !== user.id) {
          return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
        }
      } else {
        const requestedOwnerId = typeof json?.ownerUserId === "string" ? json.ownerUserId : null;
        if (requestedOwnerId !== user.id) {
          return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
        }
        const ownedTribute = await getTributeOwnedByUser(user.id);
        if (ownedTribute) {
          return NextResponse.json(
            { error: "You already have a tribute. Each account can manage one tribute." },
            { status: 409 },
          );
        }
      }
    }

    const fullPayloadResult = fullTributeSchema.safeParse(json);

    if (fullPayloadResult.success) {
      const payload = fullPayloadResult.data;
      await saveTributeRecord(payload);
      revalidatePath(`/${payload.slug}`);
      revalidatePath(`/console/${payload.slug}`);
      revalidatePath(`/dashboard/${payload.slug}`);
      return NextResponse.json({ message: "Tribute saved to Supabase." });
    }

    const themeConsoleResult = themeConsoleSchema.safeParse(json);
    if (themeConsoleResult.success) {
      const payload = themeConsoleResult.data;
      await updateTributeThemeConsole({
        slug: payload.slug,
        theme: payload.theme,
        themeRotationEnabled: payload.themeRotationEnabled,
        themeRotationIntervalMinutes: payload.themeRotationIntervalMinutes,
        themeRotationThemeIds: payload.themeRotationThemeIds,
      });
      revalidatePath(`/${payload.slug}`);
      revalidatePath(`/console/${payload.slug}`);
      revalidatePath(`/dashboard/${payload.slug}`);
      return NextResponse.json({ message: "Theme saved to Supabase." });
    }

    const themeOnlyResult = themeOnlySchema.safeParse(json);
    if (themeOnlyResult.success) {
      const payload = themeOnlyResult.data;
      await updateTributeTheme(payload);
      revalidatePath(`/${payload.slug}`);
      revalidatePath(`/console/${payload.slug}`);
      revalidatePath(`/dashboard/${payload.slug}`);
      return NextResponse.json({ message: "Theme saved to Supabase." });
    }

    return NextResponse.json(
      { error: "Please complete the tribute builder fields correctly." },
      { status: 400 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Tribute name already taken. Please choose a different name."
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to save tribute.", error);
    return NextResponse.json({ error: "Unable to save tribute." }, { status: 500 });
  }
}
