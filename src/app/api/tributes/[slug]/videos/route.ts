import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTributeBySlug } from "@/data/tributes";
import { canManageTribute } from "@/lib/user-auth";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BUCKET_NAME = "tribute-videos";
const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const uploadPreparationSchema = z.object({
  fileName: z.string().trim().min(1),
  fileType: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
});

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

function inferExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  switch (file.type) {
    case "video/webm":
      return "webm";
    case "video/ogg":
      return "ogg";
    case "video/quicktime":
      return "mov";
    default:
      return "mp4";
  }
}

async function ensureBucket() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase storage is not configured.");
  }

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error("Unable to inspect storage buckets.");
  }

  if (buckets.some((bucket) => bucket.name === BUCKET_NAME)) {
    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error("Unable to create tribute video bucket.");
  }

  return supabase;
}

async function ensureTributeRow(slug: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase content storage is not configured.");
  }

  const { data: existing } = await supabase
    .from("tributes")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return;
  }

  const fallback = getTributeBySlug(slug);
  if (!fallback) {
    throw new Error("Tribute not found.");
  }

  const { error } = await supabase.from("tributes").upsert({
    slug: fallback.slug,
    name: fallback.name,
    years: fallback.years,
    tagline: fallback.tagline,
    organizer: fallback.organizer,
    theme: fallback.theme,
    hero_image_url: fallback.heroImageUrl ?? null,
    background_image_url: fallback.backgroundImageUrl ?? null,
    gallery_note: fallback.galleryNote,
    life_story: fallback.lifeStory.join("\n\n"),
    support_note: fallback.supportNote ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error("Save the tribute draft before uploading videos.");
  }
}

function revalidateTributePaths(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/console/${slug}`);
  revalidatePath(`/dashboard/${slug}`);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug: authSlug } = await context.params;
  if (!(await canManageTribute(authSlug))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const rateLimit = await consumeRateLimit({
    key: `api:tribute-videos-upload:${getClientIp(request)}`,
    limit: 12,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many video upload requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const { slug } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payloadResult = uploadPreparationSchema.safeParse(await request.json());
      if (!payloadResult.success) {
        return NextResponse.json({ error: "Choose one video file to upload." }, { status: 400 });
      }

      const { fileName, fileType, fileSize } = payloadResult.data;

      if (!ALLOWED_MIME_TYPES.has(fileType)) {
        return NextResponse.json(
          { error: "Only MP4, WEBM, OGG, and MOV videos are allowed." },
          { status: 400 },
        );
      }

      if (fileSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Each video must be 50MB or smaller." },
          { status: 400 },
        );
      }

      const supabase = await ensureBucket();
      await ensureTributeRow(slug);

      const extension = inferExtension(new File([], fileName, { type: fileType }));
      const safeBaseName = sanitizeFileName(fileName.replace(/\.[^.]+$/, "")) || "video";
      const filePath = `${slug}/video/${Date.now()}-${randomUUID()}-${safeBaseName}.${extension}`;
      const { data: signedUploadData, error: signedUploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(filePath);

      if (signedUploadError || !signedUploadData?.signedUrl) {
        throw new Error("Unable to prepare video upload.");
      }

      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      return NextResponse.json({
        message: "Video upload prepared.",
        upload: {
          filePath,
          signedUrl: signedUploadData.signedUrl,
          token: signedUploadData.token,
          videoUrl: publicData.publicUrl,
        },
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Choose one video file to upload." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only MP4, WEBM, OGG, and MOV videos are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Each video must be 50MB or smaller." },
        { status: 400 },
      );
    }

    const supabase = await ensureBucket();
    await ensureTributeRow(slug);

    const extension = inferExtension(file);
    const safeBaseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "video";
    const filePath = `${slug}/video/${Date.now()}-${randomUUID()}-${safeBaseName}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Unable to upload video.");
    }

    const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    revalidateTributePaths(slug);

    return NextResponse.json({
      message: "Video uploaded. Save Draft changes are applied automatically.",
      upload: {
        videoUrl: publicData.publicUrl,
      },
    });
  } catch (error) {
    console.error("Failed to upload tribute video.", error);
    return NextResponse.json({ error: "Unable to upload video." }, { status: 500 });
  }
}
