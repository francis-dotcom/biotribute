import { redirect } from "next/navigation";

type ConsoleThemePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ConsoleThemePage({
  params,
  searchParams,
}: ConsoleThemePageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  redirect(`/dashboard/${slug}/theme${tokenQuery}`);
}
