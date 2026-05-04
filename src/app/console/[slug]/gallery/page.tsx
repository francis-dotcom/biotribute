import { redirect } from "next/navigation";

type ConsoleGalleryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ConsoleGalleryPage({
  params,
}: ConsoleGalleryPageProps) {
  const { slug } = await params;
  redirect(`/dashboard/${slug}/gallery`);
}
