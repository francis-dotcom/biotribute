import {
  getTributeBySlug,
  getTributeBySlugInsensitive,
  type TributeContributor,
  type TributeGalleryItem,
  type TributeRecord,
  type TributeLivestreamDisplayMode,
  type TributeSupportAmount,
  type TributeTheme,
  type TributeTimelineEntry,
} from "@/data/tributes";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

type TributeRow = {
  slug: string;
  name: string;
  years: string;
  tagline: string;
  organizer: string;
  theme: TributeTheme;
  hero_image_url: string | null;
  background_image_url: string | null;
  gallery_note: string;
  life_story: string;
  support_note: string | null;
  video_urls: string | null;
  video_note: string | null;
  livestream_url: string | null;
  livestream_note: string | null;
  show_gallery_section: boolean | null;
  show_video_section: boolean | null;
  show_livestream_section: boolean | null;
};

type TimelineRow = {
  sort_order: number;
  year: string;
  title: string;
  copy: string;
};

type ContributorRow = {
  sort_order: number;
  label: string;
  name: string;
  copy: string;
};

type SupportAmountRow = {
  sort_order: number;
  label: string;
  featured: boolean;
};

type GalleryItemRow = {
  id: string;
  sort_order: number;
  image_url: string;
};

export type TributeBuilderInput = {
  slug: string;
  name: string;
  honorificTitle?: string;
  positionTitle?: string;
  years: string;
  tagline: string;
  organizer: string;
  theme: TributeTheme;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  galleryIntro?: string;
  galleryNote: string;
  servicePosterImageUrl?: string;
  servicePosterTitle?: string;
  servicePosterNote?: string;
  showServicePosterSection?: boolean;
  lifeStory: string;
  supportNote?: string;
  videoUrls?: string[];
  videoDescriptions?: string[];
  videoThumbnailUrls?: string[];
  activeVideoIndex?: number;
  videoNote?: string;
  livestreamUrl?: string;
  livestreamThumbnailUrl?: string;
  livestreamDisplayMode?: TributeLivestreamDisplayMode;
  livestreamNote?: string;
  showGallerySection?: boolean;
  showVideoSection?: boolean;
  showLivestreamSection?: boolean;
  timeline: TributeTimelineEntry[];
  contributors: TributeContributor[];
  supportAmounts: TributeSupportAmount[];
  contactEmail?: string;
  donationAccountName?: string;
  donationAccountNumber?: string;
  donationBankName?: string;
  donationPhone?: string;
};

export function isTributeStoreConfigured() {
  return isSupabaseConfigured();
}

function normalizeTributeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function fallbackTribute(slug: string) {
  return getTributeBySlug(slug) ?? null;
}

export async function resolveCanonicalTributeSlug(slug: string) {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    return null;
  }

  const exactFallback = getTributeBySlug(trimmedSlug);
  if (exactFallback) {
    return exactFallback.slug;
  }

  const fallbackMatch = getTributeBySlugInsensitive(trimmedSlug);
  if (!isSupabaseConfigured()) {
    return fallbackMatch?.slug ?? null;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return fallbackMatch?.slug ?? null;
  }

  const { data: exactRow } = await supabase
    .from("tributes")
    .select("slug")
    .eq("slug", trimmedSlug)
    .maybeSingle();

  if (exactRow?.slug) {
    return String(exactRow.slug);
  }

  const { data: caseRow } = await supabase
    .from("tributes")
    .select("slug")
    .ilike("slug", trimmedSlug)
    .limit(1)
    .maybeSingle();

  if (caseRow?.slug) {
    return String(caseRow.slug);
  }

  return fallbackMatch?.slug ?? null;
}

function parseParagraphs(lifeStory: string) {
  return lifeStory
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function parseMultilineValues(value: string | null) {
  return (value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}



function extractUrlsFromText(value: string | null) {
  if (!value) {
    return [] as string[];
  }

  const matches = value.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  const cleaned = matches
    .map((url) => url.replace(/[),.;]+$/g, "").trim())
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

type SupportNoteMetadata = {
  honorificTitle?: string;
  positionTitle?: string;
  galleryIntro?: string;
  showGallerySection?: boolean;
  servicePosterImageUrl?: string;
  servicePosterTitle?: string;
  servicePosterNote?: string;
  showServicePosterSection?: boolean;
  showVideoSection?: boolean;
  showLivestreamSection?: boolean;
  videoUrls?: string[];
  videoDescriptions?: string[];
  videoThumbnailUrls?: string[];
  activeVideoIndex?: number;
  videoNote?: string;
  livestreamUrl?: string;
  livestreamThumbnailUrl?: string;
  livestreamDisplayMode?: TributeLivestreamDisplayMode;
  livestreamNote?: string;
  contactEmail?: string;
  donationAccountName?: string;
  donationAccountNumber?: string;
  donationBankName?: string;
  donationPhone?: string;
};

const VISIBILITY_MARKER = "<!--biotribute:visibility:";
const VISIBILITY_SUFFIX = "-->";

function stripVisibilityMarker(value: string | null) {
  if (!value) {
    return "";
  }

  const markerIndex = value.indexOf(VISIBILITY_MARKER);
  if (markerIndex === -1) {
    return value.trim();
  }

  return value.slice(0, markerIndex).trim();
}

function parseSupportNoteMetadata(value: string | null) {
  if (!value) {
    return null;
  }

  const markerIndex = value.indexOf(VISIBILITY_MARKER);
  if (markerIndex === -1) {
    return null;
  }

  const payloadStart = markerIndex + VISIBILITY_MARKER.length;
  const payloadEnd = value.indexOf(VISIBILITY_SUFFIX, payloadStart);

  if (payloadEnd === -1) {
    return null;
  }

  const payload = value.slice(payloadStart, payloadEnd);

  try {
    const parsed = JSON.parse(payload) as SupportNoteMetadata;
    return {
      honorificTitle:
        typeof parsed.honorificTitle === "string"
          ? parsed.honorificTitle.trim() || undefined
          : undefined,
      positionTitle:
        typeof parsed.positionTitle === "string"
          ? parsed.positionTitle.trim() || undefined
          : undefined,
      galleryIntro:
        typeof parsed.galleryIntro === "string"
          ? parsed.galleryIntro.trim() || undefined
          : undefined,
      showGallerySection: parsed.showGallerySection,
      servicePosterImageUrl:
        typeof parsed.servicePosterImageUrl === "string"
          ? parsed.servicePosterImageUrl.trim() || undefined
          : undefined,
      servicePosterTitle:
        typeof parsed.servicePosterTitle === "string"
          ? parsed.servicePosterTitle.trim() || undefined
          : undefined,
      servicePosterNote:
        typeof parsed.servicePosterNote === "string"
          ? parsed.servicePosterNote.trim() || undefined
          : undefined,
      showServicePosterSection: parsed.showServicePosterSection,
      showVideoSection: parsed.showVideoSection,
      showLivestreamSection: parsed.showLivestreamSection,
      videoUrls: Array.isArray(parsed.videoUrls)
        ? parsed.videoUrls.filter((value): value is string => typeof value === "string")
        : undefined,
      videoDescriptions: Array.isArray(parsed.videoDescriptions)
        ? parsed.videoDescriptions.filter((value): value is string => typeof value === "string")
        : undefined,
      videoThumbnailUrls: Array.isArray(parsed.videoThumbnailUrls)
        ? parsed.videoThumbnailUrls.filter((value): value is string => typeof value === "string")
        : undefined,
      activeVideoIndex:
        typeof parsed.activeVideoIndex === "number" && Number.isInteger(parsed.activeVideoIndex)
          ? parsed.activeVideoIndex
          : undefined,
      videoNote: typeof parsed.videoNote === "string" ? parsed.videoNote : undefined,
      livestreamUrl: typeof parsed.livestreamUrl === "string" ? parsed.livestreamUrl : undefined,
      livestreamThumbnailUrl:
        typeof parsed.livestreamThumbnailUrl === "string"
          ? parsed.livestreamThumbnailUrl.trim() || undefined
          : undefined,
      livestreamDisplayMode:
        parsed.livestreamDisplayMode === "video" ||
        parsed.livestreamDisplayMode === "image-url" ||
        parsed.livestreamDisplayMode === "uploaded-image"
          ? parsed.livestreamDisplayMode
          : undefined,
      livestreamNote:
        typeof parsed.livestreamNote === "string" ? parsed.livestreamNote : undefined,
      contactEmail:
        typeof parsed.contactEmail === "string" ? parsed.contactEmail.trim() || undefined : undefined,
      donationAccountName:
        typeof parsed.donationAccountName === "string"
          ? parsed.donationAccountName.trim() || undefined
          : undefined,
      donationAccountNumber:
        typeof parsed.donationAccountNumber === "string"
          ? parsed.donationAccountNumber.trim() || undefined
          : undefined,
      donationBankName:
        typeof parsed.donationBankName === "string"
          ? parsed.donationBankName.trim() || undefined
          : undefined,
      donationPhone:
        typeof parsed.donationPhone === "string"
          ? parsed.donationPhone.trim() || undefined
          : undefined,
    };
  } catch {
    return null;
  }
}

function withVisibilityInSupportNote(note: string | undefined, metadata: SupportNoteMetadata) {
  const cleanNote = stripVisibilityMarker(note ?? null);
  const encoded = JSON.stringify(metadata);
  return `${cleanNote}

${VISIBILITY_MARKER}${encoded}${VISIBILITY_SUFFIX}`;
}

export async function getTributeRecord(slug: string): Promise<TributeRecord | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return fallbackTribute(slug);
  }

  const { data: tributeRow, error } = await supabase
    .from("tributes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !tributeRow) {
    return fallbackTribute(slug);
  }

  const [
    { data: timelineRows },
    { data: contributorRows },
    { data: supportAmountRows },
    { data: galleryItemRows },
  ] = await Promise.all([
      supabase
        .from("tribute_timeline_entries")
        .select("sort_order, year, title, copy")
        .eq("tribute_slug", slug)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tribute_contributors")
        .select("sort_order, label, name, copy")
        .eq("tribute_slug", slug)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tribute_support_amounts")
        .select("sort_order, label, featured")
        .eq("tribute_slug", slug)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tribute_gallery_items")
        .select("id, sort_order, image_url")
        .eq("tribute_slug", slug)
        .order("sort_order", { ascending: true }),
    ]);

  const fallback = fallbackTribute(slug);
  const supportNoteMetadata = parseSupportNoteMetadata(tributeRow.support_note);
  const supportNoteUrls = extractUrlsFromText(tributeRow.support_note);
  const supportNoteEmailMatch = stripVisibilityMarker(tributeRow.support_note)?.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );

  return {
    slug: tributeRow.slug,
    name: tributeRow.name,
    honorificTitle: supportNoteMetadata?.honorificTitle ?? fallback?.honorificTitle,
    positionTitle: supportNoteMetadata?.positionTitle ?? fallback?.positionTitle,
    years: tributeRow.years,
    tagline: tributeRow.tagline,
    organizer: tributeRow.organizer,
    theme: tributeRow.theme,
    heroImageUrl: tributeRow.hero_image_url ?? undefined,
    backgroundImageUrl: tributeRow.background_image_url ?? undefined,
    lifeStory: parseParagraphs(tributeRow.life_story),
    timeline:
      ((timelineRows as TimelineRow[] | null)?.map((row) => ({
        year: row.year,
        title: row.title,
        copy: row.copy,
      })) ?? []) || fallback?.timeline || [],
    contributors:
      (contributorRows as ContributorRow[] | null)?.map((row) => ({
        label: row.label,
        name: row.name,
        copy: row.copy,
      })) ?? fallback?.contributors ?? [],
    galleryIntro:
      supportNoteMetadata?.galleryIntro ??
      fallback?.galleryIntro ??
      "A gentle space for family photos, celebration moments, and the scenes that made his life recognizable to everyone who loved him.",
    galleryNote: tributeRow.gallery_note,
    galleryImages:
      (galleryItemRows as GalleryItemRow[] | null)?.map((row) => ({
        id: row.id,
        imageUrl: row.image_url,
      })) ?? fallback?.galleryImages ?? [],
    showGallerySection:
      tributeRow.show_gallery_section ??
      supportNoteMetadata?.showGallerySection ??
      fallback?.showGallerySection ??
      true,
    servicePosterImageUrl:
      supportNoteMetadata?.servicePosterImageUrl ?? fallback?.servicePosterImageUrl,
    servicePosterTitle:
      supportNoteMetadata?.servicePosterTitle ??
      fallback?.servicePosterTitle ??
      "Service Poster",
    servicePosterNote:
      supportNoteMetadata?.servicePosterNote ?? fallback?.servicePosterNote,
    showServicePosterSection:
      supportNoteMetadata?.showServicePosterSection ??
      fallback?.showServicePosterSection ??
      true,
    videoUrls: parseMultilineValues(
      tributeRow.video_urls ||
        supportNoteMetadata?.videoUrls?.join("\n") ||
        supportNoteUrls.join("\n") ||
        fallback?.videoUrls?.join("\n") ||
        null
    ),
    videoDescriptions: supportNoteMetadata?.videoDescriptions ?? fallback?.videoDescriptions ?? [],
    videoThumbnailUrls:
      supportNoteMetadata?.videoThumbnailUrls ?? fallback?.videoThumbnailUrls ?? [],
    activeVideoIndex:
      supportNoteMetadata?.activeVideoIndex ?? fallback?.activeVideoIndex ?? 0,
    videoNote: tributeRow.video_note ?? supportNoteMetadata?.videoNote ?? fallback?.videoNote,
    showVideoSection:
      tributeRow.show_video_section ??
      supportNoteMetadata?.showVideoSection ??
      fallback?.showVideoSection ??
      true,
    livestreamUrl:
      tributeRow.livestream_url ??
      supportNoteMetadata?.livestreamUrl ??
      supportNoteUrls[0] ??
      fallback?.livestreamUrl,
    livestreamThumbnailUrl:
      supportNoteMetadata?.livestreamThumbnailUrl ?? fallback?.livestreamThumbnailUrl,
    livestreamDisplayMode:
      supportNoteMetadata?.livestreamDisplayMode ??
      fallback?.livestreamDisplayMode ??
      (supportNoteMetadata?.livestreamThumbnailUrl || fallback?.livestreamThumbnailUrl
        ? "image-url"
        : "video"),
    livestreamNote:
      tributeRow.livestream_note ?? supportNoteMetadata?.livestreamNote ?? fallback?.livestreamNote,
    showLivestreamSection:
      tributeRow.show_livestream_section ??
      supportNoteMetadata?.showLivestreamSection ??
      fallback?.showLivestreamSection ??
      true,
    messages: fallback?.messages ?? [],
    supportAmounts:
      (supportAmountRows as SupportAmountRow[] | null)?.map((row) => ({
        label: row.label,
        featured: row.featured,
      })) ?? fallback?.supportAmounts ?? [],
    contactEmail:
      supportNoteMetadata?.contactEmail ??
      supportNoteEmailMatch?.[0] ??
      fallback?.contactEmail,
    donationAccountName:
      supportNoteMetadata?.donationAccountName ?? fallback?.donationAccountName,
    donationAccountNumber:
      supportNoteMetadata?.donationAccountNumber ?? fallback?.donationAccountNumber,
    donationBankName:
      supportNoteMetadata?.donationBankName ?? fallback?.donationBankName,
    donationPhone:
      supportNoteMetadata?.donationPhone ?? fallback?.donationPhone,
    supportNote:
      tributeRow.support_note === null
        ? fallback?.supportNote
        : stripVisibilityMarker(tributeRow.support_note),
  };
}

export async function saveTributeRecord(input: TributeBuilderInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Tribute store is not configured.");
  }

  const normalizedInputName = normalizeTributeName(input.name);
  const { data: nameRows, error: nameLookupError } = await supabase
    .from("tributes")
    .select("slug, name")
    .neq("slug", input.slug);

  if (nameLookupError) {
    throw new Error("Unable to validate tribute name uniqueness.");
  }

  const duplicateName = (nameRows ?? []).some((row) => {
    const rowName = typeof row.name === "string" ? row.name : "";
    return normalizeTributeName(rowName) === normalizedInputName;
  });

  if (duplicateName) {
    throw new Error("Tribute name already taken. Please choose a different name.");
  }

  const supportNoteMetadata: SupportNoteMetadata = {
    honorificTitle: input.honorificTitle?.trim() || undefined,
    positionTitle: input.positionTitle?.trim() || undefined,
    galleryIntro: input.galleryIntro?.trim() || undefined,
    showGallerySection: input.showGallerySection ?? true,
    servicePosterImageUrl: input.servicePosterImageUrl?.trim() || undefined,
    servicePosterTitle: input.servicePosterTitle?.trim() || undefined,
    servicePosterNote: input.servicePosterNote?.trim() || undefined,
    showServicePosterSection: input.showServicePosterSection ?? true,
    showVideoSection: input.showVideoSection ?? true,
    showLivestreamSection: input.showLivestreamSection ?? true,
    videoUrls: (input.videoUrls ?? []).map((item) => item.trim()).filter(Boolean),
    videoDescriptions: (input.videoDescriptions ?? []).map((item) => item.trim()),
    videoThumbnailUrls: (input.videoThumbnailUrls ?? []).map((item) => item.trim()),
    activeVideoIndex: input.activeVideoIndex,
    videoNote: input.videoNote?.trim() || undefined,
    livestreamUrl: input.livestreamUrl?.trim() || undefined,
    livestreamThumbnailUrl: input.livestreamThumbnailUrl?.trim() || undefined,
    livestreamDisplayMode: input.livestreamDisplayMode ?? "video",
    livestreamNote: input.livestreamNote?.trim() || undefined,
    contactEmail: input.contactEmail?.trim().toLowerCase() || undefined,
    donationAccountName: input.donationAccountName?.trim() || undefined,
    donationAccountNumber: input.donationAccountNumber?.trim() || undefined,
    donationBankName: input.donationBankName?.trim() || undefined,
    donationPhone: input.donationPhone?.trim() || undefined,
  };

  const supportNoteWithVisibility = withVisibilityInSupportNote(input.supportNote, supportNoteMetadata);

  const modernPayload = {
    slug: input.slug,
    name: input.name,
    years: input.years,
    tagline: input.tagline,
    organizer: input.organizer,
    theme: input.theme,
    hero_image_url: input.heroImageUrl?.trim() || null,
    background_image_url: input.backgroundImageUrl?.trim() || null,
    gallery_note: input.galleryNote,
    life_story: input.lifeStory,
    support_note: supportNoteWithVisibility,
    video_urls: (input.videoUrls ?? []).map((item) => item.trim()).filter(Boolean).join("\n"),
    video_note: input.videoNote?.trim() || null,
    livestream_url: input.livestreamUrl?.trim() || null,
    livestream_note: input.livestreamNote?.trim() || null,
    show_gallery_section: supportNoteMetadata.showGallerySection ?? true,
    show_video_section: supportNoteMetadata.showVideoSection ?? true,
    show_livestream_section: supportNoteMetadata.showLivestreamSection ?? true,
    updated_at: new Date().toISOString(),
  };

  const { error: tributeError } = await supabase.from("tributes").upsert(modernPayload);

  if (tributeError) {
    const message = tributeError.message ?? "";
    const isMissingMediaColumns =
      message.includes("show_gallery_section") ||
      message.includes("show_video_section") ||
      message.includes("show_livestream_section") ||
      message.includes("video_urls") ||
      message.includes("livestream_url") ||
      message.includes("video_note") ||
      message.includes("livestream_note");

    if (isMissingMediaColumns) {
      const { error: legacyError } = await supabase.from("tributes").upsert({
        slug: input.slug,
        name: input.name,
        years: input.years,
        tagline: input.tagline,
        organizer: input.organizer,
        theme: input.theme,
        hero_image_url: input.heroImageUrl?.trim() || null,
        background_image_url: input.backgroundImageUrl?.trim() || null,
        gallery_note: input.galleryNote,
        life_story: input.lifeStory,
        support_note: supportNoteWithVisibility,
        updated_at: new Date().toISOString(),
      });

      if (legacyError) {
        throw new Error(
          `Unable to save tribute details: ${legacyError.message || "database schema mismatch"}`
        );
      }
    } else {
      throw new Error(`Unable to save tribute details: ${message || "unknown error"}`);
    }
  }

  await Promise.all([
    supabase.from("tribute_timeline_entries").delete().eq("tribute_slug", input.slug),
    supabase.from("tribute_contributors").delete().eq("tribute_slug", input.slug),
    supabase.from("tribute_support_amounts").delete().eq("tribute_slug", input.slug),
  ]);

  if (input.timeline.length > 0) {
    const { error } = await supabase.from("tribute_timeline_entries").insert(
      input.timeline.map((entry, index) => ({
        tribute_slug: input.slug,
        sort_order: index,
        year: entry.year,
        title: entry.title,
        copy: entry.copy,
      }))
    );

    if (error) {
      throw new Error("Unable to save timeline entries.");
    }
  }

  if (input.contributors.length > 0) {
    const { error } = await supabase.from("tribute_contributors").insert(
      input.contributors.map((entry, index) => ({
        tribute_slug: input.slug,
        sort_order: index,
        label: entry.label,
        name: entry.name,
        copy: entry.copy,
      }))
    );

    if (error) {
      throw new Error("Unable to save contributors.");
    }
  }

  if (input.supportAmounts.length > 0) {
    const { error } = await supabase.from("tribute_support_amounts").insert(
      input.supportAmounts.map((entry, index) => ({
        tribute_slug: input.slug,
        sort_order: index,
        label: entry.label,
        featured: Boolean(entry.featured),
      }))
    );

    if (error) {
      throw new Error("Unable to save support amounts.");
    }
  }
}

export async function updateTributeTheme(input: { slug: string; theme: TributeTheme }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Tribute store is not configured.");
  }

  const { data, error } = await supabase
    .from("tributes")
    .update({
      theme: input.theme,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", input.slug)
    .select("slug")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to save theme: ${error.message || "unknown error"}`);
  }

  if (!data?.slug) {
    throw new Error("Tribute not found.");
  }
}
