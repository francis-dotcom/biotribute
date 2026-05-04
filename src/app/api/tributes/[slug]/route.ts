import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { saveTributeRecord } from "@/lib/tributes-store";

const timelineSchema = z.object({
  year: z.string().trim().min(1),
  title: z.string().trim().min(1),
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

const tributeSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  honorificTitle: z.string().trim().optional(),
  positionTitle: z.string().trim().optional(),
  years: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  organizer: z.string().trim().min(1),
  theme: z.enum(["ivory", "sage", "sky"]),
  heroImageUrl: z.string().trim().optional(),
  backgroundImageUrl: z.string().trim().optional(),
  galleryNote: z.string().trim(),
  lifeStory: z.string().trim().min(1),
  supportNote: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  donationAccountName: z.string().trim().optional(),
  donationAccountNumber: z.string().trim().optional(),
  donationBankName: z.string().trim().optional(),
  donationPhone: z.string().trim().optional(),
  videoUrls: z.array(z.string().trim().min(1)).optional(),
  videoDescriptions: z.array(z.string().trim()).optional(),
  videoNote: z.string().trim().optional(),
  livestreamUrl: z.string().trim().optional(),
  livestreamNote: z.string().trim().optional(),
  showGallerySection: z.boolean().optional(),
  showVideoSection: z.boolean().optional(),
  showLivestreamSection: z.boolean().optional(),
  timeline: z.array(timelineSchema),
  contributors: z.array(contributorSchema),
  supportAmounts: z.array(supportAmountSchema),
});

export async function POST(request: Request) {
  try {
    const payload = tributeSchema.parse(await request.json());
    await saveTributeRecord(payload);
    revalidatePath(`/${payload.slug}`);
    revalidatePath(`/console/${payload.slug}`);
    revalidatePath(`/dashboard/${payload.slug}`);
    return NextResponse.json({ message: "Tribute saved to Supabase." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please complete the tribute builder fields correctly." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "Tribute name already taken. Please choose a different name."
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save tribute.",
      },
      { status: 500 }
    );
  }
}
