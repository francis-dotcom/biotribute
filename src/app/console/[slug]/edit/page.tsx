import { redirect } from "next/navigation";

type ConsoleEditPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ConsoleEditPage({
  params,
  searchParams,
}: ConsoleEditPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  redirect(`/dashboard/${slug}/edit${tokenQuery}`);
}
