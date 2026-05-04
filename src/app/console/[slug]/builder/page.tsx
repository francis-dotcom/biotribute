import { redirect } from "next/navigation";

type ConsoleBuilderPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ConsoleBuilderPage({
  params,
  searchParams,
}: ConsoleBuilderPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  redirect(`/dashboard/${slug}/builder${tokenQuery}`);
}
