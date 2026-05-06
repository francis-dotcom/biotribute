import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getTributeBySlug } from "@/data/tributes";
import { isAdminAuthenticated } from "@/lib/admin";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BUCKET_NAME = "tribute-media";
const ALLOWED_KINDS = new Set(["hero", "background", "gallery", "livestream-thumb", "video-thumb"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

function inferExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "jpg";
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
    throw new Error("Unable to create tribute media bucket.");
  }

  return supabase;
}

async function ensureTributeRow(slug: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase content storage is not configured.");
  }

  const { data: existing } = await supabase.from("tributes").select("slug").eq("slug", slug).maybeSingle();
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
    throw new Error("Save the tribute draft before uploading images.");
  }
}

function getStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(markerIndex + marker.length));
}

async function deleteStorageObject(publicUrl: string | null | undefined) {
  if (!publicUrl) {
    return;
  }

  const storagePath = getStoragePathFromPublicUrl(publicUrl);
  if (!storagePath) {
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return;
  }

  await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
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
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const rateLimit = await consumeRateLimit({
    key: `api:tribute-images-upload:${getClientIp(request)}`,
    limit: 20,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many image upload requests. Please wait and try again." },
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
    const formData = await request.formData();
    const kind = String(formData.get("kind") ?? "").trim();
    const fileEntries = formData.getAll("files");
    const files = fileEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!ALLOWED_KINDS.has(kind)) {
      return NextResponse.json({ error: "Invalid upload target." }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one image to upload." }, { status: 400 });
    }

    if ((kind === "hero" || kind === "background" || kind === "livestream-thumb" || kind === "video-thumb") && files.length !== 1) {
      return NextResponse.json({ error: "Upload exactly one image for this field." }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, WEBP, and AVIF images are allowed." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Each image must be 10MB or smaller." },
          { status: 400 }
        );
      }
    }

    const supabase = await ensureBucket();
    await ensureTributeRow(slug);

    const uploads: { id: string; imageUrl: string }[] = [];

    for (const file of files) {
      const extension = inferExtension(file);
      const safeBaseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "image";
      const filePath = `${slug}/${kind}/${Date.now()}-${randomUUID()}-${safeBaseName}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Unable to upload image.");
      }

      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      uploads.push({
        id: randomUUID(),
        imageUrl: publicData.publicUrl,
      });
    }

    if (kind === "hero" || kind === "background") {
      const column = kind === "hero" ? "hero_image_url" : "background_image_url";
      const { error } = await supabase
        .from("tributes")
        .update({
          [column]: uploads[0].imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", slug);

      if (error) {
        throw new Error("Image uploaded, but tribute record could not be updated.");
      }
    }

    if (kind === "gallery") {
      const { data: existingRows } = await supabase
        .from("tribute_gallery_items")
        .select("sort_order")
        .eq("tribute_slug", slug)
        .order("sort_order", { ascending: false })
        .limit(1);

      const startOrder = existingRows?.[0]?.sort_order ?? -1;
      const { error } = await supabase.from("tribute_gallery_items").insert(
        uploads.map((upload, index) => ({
          id: upload.id,
          tribute_slug: slug,
          sort_order: startOrder + index + 1,
          image_url: upload.imageUrl,
        }))
      );

      if (error) {
        throw new Error("Images uploaded, but gallery records could not be saved.");
      }
    }

    revalidateTributePaths(slug);

    return NextResponse.json({
      message:
        kind === "gallery"
          ? "Gallery images uploaded."
          : kind === "livestream-thumb"
            ? "Thumbnail uploaded. Click Save Draft to apply it to the live stream."
          : "Image uploaded and applied to the tribute.",
      uploads,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload image.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const rateLimit = await consumeRateLimit({
    key: `api:tribute-images-reorder:${getClientIp(request)}`,
    limit: 40,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many image reorder requests. Please wait and try again." },
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
    const payload = (await request.json()) as { galleryIds?: string[] };
    const galleryIds = Array.isArray(payload.galleryIds) ? payload.galleryIds : [];

    if (galleryIds.length === 0) {
      return NextResponse.json({ error: "Provide at least one gallery image id." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 500 });
    }

    const { data: existingRows, error: selectError } = await supabase
      .from("tribute_gallery_items")
      .select("id")
      .eq("tribute_slug", slug);

    if (selectError) {
      return NextResponse.json({ error: "Unable to load gallery items." }, { status: 500 });
    }

    const existingIds = new Set((existingRows ?? []).map((row) => String(row.id)));
    if (existingIds.size !== galleryIds.length || galleryIds.some((id) => !existingIds.has(id))) {
      return NextResponse.json({ error: "Gallery reorder payload does not match existing items." }, { status: 400 });
    }

    for (const [index, id] of galleryIds.entries()) {
      const { error: updateError } = await supabase
        .from("tribute_gallery_items")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("tribute_slug", slug);

      if (updateError) {
        return NextResponse.json({ error: "Unable to reorder gallery images." }, { status: 500 });
      }
    }

    revalidateTributePaths(slug);
    return NextResponse.json({ message: "Gallery order updated." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to reorder gallery images.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const rateLimit = await consumeRateLimit({
    key: `api:tribute-images-delete:${getClientIp(request)}`,
    limit: 30,
    windowMs: 1000 * 60 * 10,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many image delete requests. Please wait and try again." },
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
    const payload = (await request.json()) as {
      kind?: "hero" | "background" | "gallery";
      galleryId?: string;
    };
    const kind = payload.kind;

    if (!kind || !ALLOWED_KINDS.has(kind)) {
      return NextResponse.json({ error: "Invalid delete target." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 500 });
    }

    if (kind === "hero" || kind === "background") {
      const column = kind === "hero" ? "hero_image_url" : "background_image_url";

      const { data: tributeRow, error: loadError } = await supabase
        .from("tributes")
        .select(column)
        .eq("slug", slug)
        .maybeSingle();

      if (loadError || !tributeRow) {
        return NextResponse.json({ error: "Unable to load tribute image." }, { status: 500 });
      }

      const oldImageUrl =
        kind === "hero"
          ? String((tributeRow as { hero_image_url?: string | null }).hero_image_url ?? "")
          : String(
              (tributeRow as { background_image_url?: string | null }).background_image_url ?? ""
            );

      const { error: updateError } = await supabase
        .from("tributes")
        .update({
          [column]: null,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", slug);

      if (updateError) {
        return NextResponse.json({ error: "Unable to remove tribute image." }, { status: 500 });
      }

      await deleteStorageObject(oldImageUrl);
      revalidateTributePaths(slug);
      return NextResponse.json({ message: "Image removed." });
    }

    const galleryId = String(payload.galleryId ?? "").trim();
    if (!galleryId) {
      return NextResponse.json({ error: "Missing gallery image id." }, { status: 400 });
    }

    const { data: galleryRow, error: selectError } = await supabase
      .from("tribute_gallery_items")
      .select("id, image_url")
      .eq("id", galleryId)
      .eq("tribute_slug", slug)
      .maybeSingle();

    if (selectError || !galleryRow) {
      return NextResponse.json({ error: "Gallery image not found." }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("tribute_gallery_items")
      .delete()
      .eq("id", galleryId)
      .eq("tribute_slug", slug);

    if (deleteError) {
      return NextResponse.json({ error: "Unable to delete gallery image." }, { status: 500 });
    }

    await deleteStorageObject(galleryRow.image_url);

    const { data: remainingRows } = await supabase
      .from("tribute_gallery_items")
      .select("id")
      .eq("tribute_slug", slug)
      .order("sort_order", { ascending: true });

    for (const [index, row] of (remainingRows ?? []).entries()) {
      await supabase
        .from("tribute_gallery_items")
        .update({ sort_order: index })
        .eq("id", row.id)
        .eq("tribute_slug", slug);
    }

    revalidateTributePaths(slug);
    return NextResponse.json({ message: "Gallery image removed." });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete image.",
      },
      { status: 500 }
    );
  }
}
