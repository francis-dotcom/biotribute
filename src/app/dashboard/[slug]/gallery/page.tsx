import { notFound } from "next/navigation";
import { GalleryDashboardManager } from "@/components/gallery-dashboard-manager";
import { requireAdminToken } from "@/lib/admin";
import { getTributeRecord } from "@/lib/tributes-store";

type GalleryDashboardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function GalleryDashboardPage({
  params,
  searchParams,
}: GalleryDashboardPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  requireAdminToken(token, `/biotribute/${slug}`);
  const tribute = await getTributeRecord(slug);

  if (!tribute) {
    notFound();
  }

  return (
    <GalleryDashboardManager
      slug={tribute.slug}
      heroImageUrl={tribute.heroImageUrl}
      backgroundImageUrl={tribute.backgroundImageUrl}
      galleryImages={tribute.galleryImages}
    />
  );
}
