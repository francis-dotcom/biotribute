import { notFound } from "next/navigation";
import { GalleryDashboardManager } from "@/components/gallery-dashboard-manager";
import { requireAdminSession } from "@/lib/admin";
import { getTributeRecord } from "@/lib/tributes-store";

type GalleryDashboardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GalleryDashboardPage({
  params,
}: GalleryDashboardPageProps) {
  const { slug } = await params;
  await requireAdminSession(`/dashboard/${slug}/gallery`);
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
