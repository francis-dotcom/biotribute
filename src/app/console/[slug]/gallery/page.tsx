import { redirect } from "next/navigation";

type ConsoleGalleryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ConsoleGalleryPage({
  params,
  searchParams,
}: ConsoleGalleryPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  redirect(`/dashboard/${slug}/gallery${tokenQuery}`);
}
